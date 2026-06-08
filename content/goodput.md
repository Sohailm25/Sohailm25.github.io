Title: Goodput or It Didn't Happen
Date: 2026-05-13
Category: Writings
Slug: goodput
Summary: GPU utilization can be 78% while 30% of requests fail SLO constraints. The goodput frontier test replaces single-number benchmarks with decision-grade surfaces that measure accepted results, not raw throughput.
Template: longform_article
Status: published

*This article is excerpted from Chapter 9 of *Production Inference Economics: A Field Guide*. The full chapter develops the productive-capacity and cache-local routing framework in more depth.*

*I work at Together AI. Technical details have been generalized from production experience; no proprietary information from any organization is disclosed.*

---

78% GPU utilization is consistent with 30% of requests exceeding p99 latency (service-level objective), with rising escalation rates, and with the bill growing. Same problem, three departments noticing it.

Utilization measures GPU busyness. It doesn't measure productive output: accepted work at target latency. The GPU can be busy recomputing evicted KV cache (the per-request memory that stores attention state). It can be running speculative decode drafts that get rejected. It can be processing retries of requests that already failed once. It can be serving outputs that will fail the quality gate and never reach a customer. All of that counts as utilization. None of it counts as productive work.

I watched this pattern play out over six weeks. The team had provisioned a dedicated cluster for a RAG workload, document analysis at roughly 2,000 requests per day. Utilization dashboards were green. Token throughput was healthy. The GPU-hours-per-dollar number looked competitive. But the LCPR (loaded cost per accepted result) was climbing. Not because inference got more expensive per token, but because an increasing fraction of the GPU's work was producing nothing the customer would accept.

The root causes were mundane. A KV cache eviction cascade under long-context traffic meant the system was recomputing prefill for requests whose KV state had been preempted. A retry storm from a downstream timeout meant the same prompt was being processed two or three times before one attempt succeeded. A quantization change intended to improve throughput had introduced quality degradation in the long tail (rare entities, numeric precision, multi-turn coherence after turn five) that the standard A/B test hadn't caught.

Each of these individually was a normal operational event. Together, they meant the GPU was 78% utilized and 30% unproductive. The metric that would have caught this is not utilization. It is goodput.

The gap between allocated and productive GPU capacity is not an edge case. Modal's *State of AI Infrastructure at Scale, 2024* reports the majority of organizations under 70% GPU allocation utilization at peak; common figures 10-20%. That is allocation utilization: how much of provisioned capacity is even assigned to work. Productive utilization (how much of that assigned work produces accepted output) is lower still. The gap has two layers: hardware sitting idle, and hardware that is busy but unproductive. Both are costs. Only productive work is revenue.

---

## The distinction that changes every decision

**Throughput** is work attempted. Total tokens generated per second, total requests processed per hour, total GPU cycles consumed. Throughput tells you how busy the system is. It does not tell you how much of that busyness produced value.

**Goodput** is work completed: accepted results per second, meeting latency, quality, and reliability constraints. Goodput is the bridge between serving physics and the economics from [The Denominator Problem]({filename}/denominator-problem.md) and [Workload Costs]({filename}/workload-costs.md). It is the number that belongs in capacity plans, migration decisions, benchmark comparisons, and the LCPR denominator.

The formal definition is straightforward:

```
TPOT_i = (E2E_i - TTFT_i) / (output_tokens_i - 1)

goodput = count(requests where
    TTFT ≤ S_ttft
    AND TPOT ≤ S_tpot
    AND quality_pass == true
    AND success == true
    AND retry_count ≤ R_budget
) / D
```

Where `S_ttft` and `S_tpot` are your service-level thresholds and `D` is the measurement window in seconds.

The formula is straightforward. Wiring up the data is not. You need latency, quality labels, and cost attribution at request granularity, and most teams have one or two of those wired but not all three. Without all three, goodput degrades to "latency-constrained throughput": still useful, but incomplete. The full definition (latency, quality, reliability, and cost) is what connects serving infrastructure to the [LCPR formula]({filename}/denominator-problem.md).

The cost per accepted result is then:

```
cost_per_accepted = sum(all_costs) / count(accepted_requests)
```

The numerator includes *all* costs, including failed attempts, retries, quality failures, and wasted speculative tokens. The denominator includes *only* accepted requests. Goodput is the serving-side measurement that feeds LCPR's denominator.

---

## Where productive capacity leaks

Five mechanisms turn GPU utilization into wasted capacity. Each is measurable; each has a lever.

**KV cache preemption.** Serving engines preempt long-running sequences to make room for incoming ones. Recomputing the evicted KV when the sequence resumes consumes GPU cycles that produce no new output. In a production deployment mixing short-context support chat and long-context document analysis on the same GPU pool, KV cache eviction cascades caused running requests to drop and preemptions to spike simultaneously. The monitoring signal was cache usage near 100% with preemption counts climbing. The fix was workload-aware routing: short context to one pool, long context to another. Same hardware, different routing, different economics.

**Retries and repair loops.** A request times out. The client retries. The retry consumes a fresh prefill, fresh KV allocation, and fresh decode cycles, all for work that the first attempt already partially completed. On quality-sensitive workloads, a failed quality gate triggers a repair: the system regenerates with corrected context, burning a second full inference pass. [The Denominator Problem]({filename}/denominator-problem.md) showed the trace where eight tickets generated twelve inference calls. Those four extra calls are GPU work that doesn't count as goodput but absolutely counts as utilization.

**Speculative decode waste.** A draft model proposes tokens; the target model verifies. Accepted drafts are faster; rejected drafts are wasted compute. GPU utilization goes up either way. Goodput only goes up when acceptance rate is high enough to offset the drafting cost.

**Quality failures at the model level** burn GPU budget invisibly. An output that passes the latency SLO but fails the quality gate consumed every token of its inference budget for nothing. The GPU was busy. The request was "successful" in the HTTP sense. The output was useless. Without quality labels in the goodput measurement, this failure is invisible. The system looks like it's producing work at target latency, and the quality problem surfaces later as customer complaints, support tickets, or manual rework.

**Queue buildup and SLO violations.** At high utilization, requests queue. Queue time adds to TTFT (time to first token). Even if decode is fast once the request starts, the user waits through the queue. A system running at 90% utilization with Poisson arrivals will have materially worse p99 queue time than one running at 70%. The utilization dashboard says "efficient." The user says "slow." The TTFT SLO violation means the request doesn't count as goodput even if the output was perfect.

---

## When optimizations backfire

Two common optimizations (speculative decoding and quantization) deserve specific attention because they increase utilization while potentially decreasing productive capacity.

### Speculative decoding at production batch sizes

In one high-concurrency conversational workload I worked on, speculative decoding with a fine-tuned draft model produced ~0.92x throughput. Slower than the baseline, after roughly two weeks of engineering work to tune the draft. The acceptance rate climbed from ~47% to ~58% after fine-tuning, but at the production batch sizes we hit (around 11-14 concurrent sequences), the draft model's added compute exceeded the savings from accepted drafts.

The mechanism is straightforward. Speculative decoding wins at low concurrency with high acceptance: the draft is nearly free if the GPU has spare cycles. At batch sizes where the GPU's compute budget is already committed to the decode batch, adding a draft means either slowing all sequences or raising memory pressure.

A search infrastructure provider reports positive production results with multi-token prediction draft layers for the same technique, likely because the search workload's constrained output distribution yields higher draft acceptance rates than open-ended conversational generation. The technique is not universally good or bad. The decision variable is whether your workload's output distribution produces an acceptance rate high enough to offset the draft model's compute at your production batch size.

Speculative decoding is workload-dependent. The right question isn't whether it "improves latency" in general. It's whether your acceptance rate and batch size make it net positive for goodput.

### Quantization and the quality tail

After quantizing a production model, quality failures appeared in the long tail: rare entities, numeric precision errors, and multi-turn conversation degradation after five or six turns. Standard A/B tests did not catch these because A/B tests measure average quality on a general distribution. The tail failures affected 2-3% of requests, below the noise floor of most A/B sample sizes, but those requests were disproportionately high-value: complex customer queries, multi-step reasoning, and queries involving precise numerical data.

Quantization's throughput gains are real. FP8 quantization can improve throughput by 1.6x and cut memory consumption by 3-4x. But the quality risk is in the tail, not the average. Continuous log analysis (reviewing real production outputs, not just aggregate quality scores) was the only reliable detection method.

The productive capacity impact: throughput went up by 60%. Quality failures in the tail increased by 1.5 percentage points. Retry rate for affected queries increased. Human escalation cost for affected queries increased. Net LCPR change: roughly break-even. The quantization "saved" GPU cost and then spent it on retries and human review.

The right approach is not to avoid quantization. It is to measure its effect on goodput, not just throughput. Run quantization experiments with tail-quality evaluation (rare entities, long conversations, numerical tasks), not just aggregate pass rates. If goodput under SLO improves, the optimization worked. If throughput improved but goodput didn't, the optimization is a wash dressed up as a win.

---

## Cache-local routing: the lever hiding in your load balancer

Eight replicas behind a round-robin load balancer. Cache hit rate drops from 85% to 12%. TTFT increases 4x. The support chatbot's cache configuration has not changed. The system prompt is identical across requests. The tool definitions haven't moved. Everything about the caching setup is correct, except the load balancer.

Round-robin sends each request to a random replica. The system prompt is cached on replica 3, but the next turn goes to replica 7, where the cache is cold. Replica 7 runs a full prefill. The next request goes to replica 1. Another full prefill. The cache is populated on every replica, but each replica only serves one-eighth of the traffic, so reuse within the TTL window is too low to sustain hits.

Traditional load balancing treats replicas as interchangeable. Inference replicas are not interchangeable. Each replica holds different KV state.

Here is what this looks like on real numbers for a support chatbot with a 6,000-token system prompt plus tool prefix, running on 8 replicas:

| Routing policy | Cache hit rate | Mean TTFT | Effective input cost |
|---------------|---------------|-----------|---------------------|
| Round-robin | ~12% (1/8 chance) | 1,200ms | Baseline |
| Prefix-aware | ~85% (routed to prefix holder) | 300ms | ~60% savings |
| Sticky session | ~90% (conversation state preserved) | 250ms | ~65% savings |
The difference between round-robin and prefix-aware routing is 4x TTFT and 60% cost reduction. Not from a better model. Not from cheaper hardware. From routing the request to the right replica.

### Why routing policy is an economic lever

Inference serving systems maintain per-replica state that matters:

**KV cache.** Each replica holds KV blocks for recently served prefixes. A cache hit requires routing the request to the replica that holds the matching prefix. Miss the routing, miss the cache, pay for full prefill.

**Prefix cache.** Some systems hash prefixes and store KV blocks by hash. The same prefix hashed on different replicas creates duplicate storage. Routing to the right replica avoids recomputation.

**Session state.** Multi-turn conversations benefit from sticky routing to the replica that holds the conversation's growing context. Context accumulates across turns. By turn 8, the growing conversation plus system prompt can be 4-6x the initial prompt. If each turn goes to a different replica, every turn pays for full re-prefill of the conversation history.

Cache-local routing creates two tradeoffs:

**Locality versus load balance.** Routing to the cache-hot replica improves TTFT and cost but can overload that replica if many requests share the same prefix. The routing layer needs a saturation threshold: route to the cache-hot replica if it has capacity, fall back to another if saturated.

**Cache diversity versus cache efficiency.** If all requests go to the same replica, one replica does all the work and the rest sit idle. If requests are spread evenly, cache hit rates drop. The optimal distribution depends on prefix diversity, traffic shape, and the cost of cache misses versus load imbalance.

### Routing policies for inference

| Policy | Mechanism | When it works | When it fails |
|--------|-----------|--------------|---------------|
| Round-robin | Even distribution | Stateless or batch workloads | Destroys cache locality |
| Least-request | Route to least-loaded | When all replicas are cold | Ignores cache state |
| Prefix-aware | Route by prefix hash | High-reuse prefixes (support, tools) | Low-reuse or unique-prefix workloads |
| KV-cache-aware | Route to replica with matching KV | Multi-turn, high cache benefit | Requires cache state visibility |
| Sticky session | Route same session to same replica | Conversational workloads | Creates hotspots if sessions are uneven |
| Fallback | Route to any when target is saturated | Burst handling | Cold start penalty on fallback |

The engineering community has converged on this hierarchy. SGLang's default router uses cache-aware routing. KServe and llm-d document KV-cache-aware scheduling with per-pod cache event routing. LMCache documents cross-instance KV reuse with multi-tier storage. The infrastructure exists. The question is whether your deployment uses it.

If your workload has reusable prefixes and you use multi-replica serving, routing policy is an economic lever. Implement prefix-aware or KV-cache-aware routing before spending on more hardware. Measure cache hit rate by replica. If hit rates are low but prefix diversity is low (most requests share a few system prompts), routing is the problem, not cache configuration.

### The operations angle

Cache locality is fragile under operations. Rolling deployments cycle replicas, clearing their KV state. Autoscaling adds cold replicas that have no cache state: the router spreads traffic to them, and their cache miss rate is 100% until they warm up. A cache salt rotation (sometimes triggered by security policy or tenant isolation requirements) invalidates all cached prefixes simultaneously.

Each of these events temporarily converts the system from warm-cache to cache-disrupted. If the team measures average cache hit rate across a day, the 15-minute disruption window looks small. But if that disruption window coincides with peak traffic (and scaling events often do, because autoscaling triggers under load) the cost impact is disproportionate. Peak traffic times cold cache means the most expensive requests hit the most expensive state.

The mitigation is not to avoid operations. It is to measure TTFT and cache hit rate around operational events (deployments, scale-outs, salt rotations) and include disruption-window cost in the goodput calculation. A system that runs at $0.012 per accepted result in steady state but spikes to $0.035 during the 20 minutes after each deployment has a blended cost that depends on deployment frequency. Deploy twice a day and the disruption cost is material. Deploy weekly and it's noise. The goodput framework makes this tradeoff explicit.

---

## The goodput frontier test

Most vendor-blog benchmarks report a single number (tokens/sec or average latency) at one operating point. A single point hides the surface underneath.

The goodput frontier test measures goodput across a sweep of request rates or concurrency levels, under explicit SLO constraints, with quality labels. It produces a frontier (the curve of cost per accepted result as load increases) not a single point.

### How to run it

**Step 1: Define SLOs before measuring.**

| Gate | Threshold |
|------|-----------|
| TTFT | ≤ your product's first-token SLO |
| TPOT (time per output token) | ≤ your product's per-token SLO |
| E2E (end-to-end latency) | ≤ your product's end-to-end SLO |
| Quality | Passes your eval gate |
| Retries | ≤ retry budget per attempt |

If you don't have defined SLOs, you can't measure goodput. Define them first. Even rough SLOs (TTFT ≤ 1,500ms, TPOT ≤ 60ms/tok) are better than none.

**Step 2: Sweep request rate with your actual workload shape.**

Use your production prompt/output length distribution, not synthetic uniform inputs. Use Poisson arrivals for interactive workloads, not closed-loop. Run at least five rate points: comfortable, moderate, busy, stressed, and overloaded. At each point, record:

- p50/p95/p99 TTFT, TPOT, and E2E latency
- Request throughput and token throughput
- Request goodput (accepted results per second)
- Error rate, retry rate, and quality pass rate
- KV cache hit rate and utilization
- Cost per accepted result

**Step 3: State cache warmth explicitly.**

A benchmark that does not state cache warmth is not reusable evidence for production economics. Five states matter:

| State | Meaning |
|-------|---------|
| Cold | No model weights resident, no KV/prefix cache |
| Warm-model cold-cache | Model resident, prefix/KV cache empty |
| Warm-cache | Repeated prefixes populated on target replicas |
| Hot-cache steady state | Hit rate at intended production distribution |
| Cache-disrupted | Replicas rolled, cache evicted, salt changed |

Run at least warm-cache and cache-disrupted. The gap between them tells you how much of your system's performance depends on cache locality surviving operations.

### Worked example

Two routing configurations for the same RAG workload, 100 requests per point:

| Metric | Route A (high throughput) | Route B (SLO-tuned) |
|--------|--------------------------|---------------------|
| Raw throughput (tok/s) | 1,200 | 800 |
| p99 TTFT | 1,400ms (fails 800ms SLO) | 650ms (passes) |
| p99 TPOT | 55ms/tok | 42ms/tok |
| Quality pass rate | 72% | 91% |
| Requests meeting ALL gates | 58 | 85 |
| Goodput (accepted req/s) | 5.8 | 8.5 |
| Total cost (100 req) | $1.10 | $1.45 |
| Cost per accepted result | $0.019 | $0.017 |

Route A wins on raw throughput. Route B wins on goodput. The token-price comparison picks A; the goodput frontier test picks B.

Route A delivers 58 accepted results per 100 attempts; 42% of GPU work goes to requests that will fail. Route B delivers 85; 15% waste. Total spend favors A; per-unit-of-value cost favors B. Same denominator problem from [The Denominator Problem]({filename}/denominator-problem.md), in serving-physics form: the metric is accepted results, not tokens generated.

For output-heavy workloads (code generation, long-form content, agentic tool use) output-token goodput can be more informative than request goodput:

```
output_token_goodput =
  sum(output_tokens for passing requests) / D
```

A system that produces 800 accepted output tokens per second and 200 rejected tokens per second has output-token goodput of 800 tok/s, not 1,000. The rejected tokens consumed GPU decode cycles, KV bandwidth, and output-token billing. They produced nothing the customer accepted. Output-token goodput makes this visible in a way that raw token throughput does not.

### Benchmark claims to avoid

Every claim on this list has appeared in a vendor blog, a comparison table, or a customer deck. Every one of them is incomplete or misleading without additional context:

- "X tokens/sec, therefore X is cheaper." Tokens/sec alone is not an economics claim. It requires SLO constraints, length distribution, cache warmth, quality gates, and cost attribution to mean anything.
- "p50 latency improved, so users will feel it." Interactive systems fail at p95/p99, TTFT spikes, cold starts, or retries, not at p50.
- "This engine is faster than that engine." This claim requires model revision, quantization level, hardware, runtime flags, workload shape, request-rate sweep, and cache policy to be meaningful. Without them, it is marketing.
- "Prompt caching saves N percent." Cacheable-prefix share, hit rate, TTL fit, tenant isolation, and eviction behavior all determine whether the savings number is real or aspirational.
- "Batch API is 50% cheaper, so move workloads to batch." Completion-window tolerance, failed-row handling, expiration cost, and delivery delay alone determine whether the migration math works.
- "Speculative decoding improves latency." Acceptance rate, batch size, quality gate, and net goodput measurement can flip this claim backwards.
- "GPU utilization is 78%, so the cluster is efficient." Utilization without goodput describes busyness, not productivity.

---

## What to measure

The workload class determines the goodput definition. The serving infrastructure determines the measurement points. Here is the measurement table that ties everything together, from the workload economics of [What Your Workload Actually Costs]({filename}/workload-costs.md) to the goodput definition in this article:

| Workload class | Goodput unit | Primary serving metrics | Primary economic metric | Dominant lever |
|---------------|-------------|----------------------|----------------------|----------------|
| Conversational | Accepted resolutions per second | Cache hit rate by turn, TTFT, session length | LCPR per accepted resolution | Quality gate, cache stability |
| Agentic | Accepted tasks per second | Fanout multiplier, repair rate, compaction events | LCPR per accepted task | Fanout control, termination policy |
| RAG | Grounded answers per second | Retrieval precision, context tokens, grounding pass rate | LCPR per grounded answer | Retrieval quality |
| Extraction | Validated records per second | Schema pass rate, batch-eligible share | LCPR per validated record | Batch eligibility, deterministic checks |
| Voice | Completed interactions per second | LLM budget utilization, fallback rate, TTFT | LCPR per completed interaction | Latency budget, fallback quality |
| Batch/offline | Accepted items per hour | Completion time, retry rate, expiration rate | LCPR per accepted batch item | Batch API usage, volume pricing |

Each row is a different goodput configuration. Same formula, different SLO gates, different quality definitions, different denominators. The formula is durable. The workload identity determines which inputs matter.

---

## Three decisions goodput changes

**Capacity planning.** GPU-hour math without goodput produces fictional capacity numbers. A team plans: "We need 4 H100s to serve 10,000 requests per day based on throughput benchmarks." The throughput benchmark ran at batch 256 with warm cache, no quality gate, and no retry overhead. Production runs at batch 8-16 with cold cache on 40% of requests, a 12% quality failure rate, and a 6% retry rate. The effective capacity at production conditions is 40-60% of the benchmark number. The team needs 6-8 H100s, not 4. Or they need to fix their cache hit rate and quality gate before buying hardware.

The right capacity planning formula is not "throughput times hours." It is: "goodput under SLO at your production traffic shape, times the hours you need to serve, plus headroom for bursts and p99." Goodput already accounts for retries, quality failures, and cache misses. Throughput does not.

**Migration decisions.** A team evaluates switching serving engines or providers. Engine A produces 1,200 raw tok/s. Engine B produces 900 raw tok/s. Engine A looks faster. But Engine A has a 1,400ms p99 TTFT that violates the 800ms SLO on 30% of requests, while Engine B's p99 TTFT is 650ms. Engine A has worse prefix cache stability under rolling restarts. Engine A's quality pass rate is 72% versus Engine B's 91%.

At the goodput level, Engine B produces more accepted results per second at a lower cost per accepted result, despite being "slower" on the throughput benchmark. The migration that looks wrong on throughput looks right on goodput. In the cases I've seen, those reversals held.

**Model selection.** The model evaluation says Model X generates 40% more output tokens per second than Model Y. Model X costs 30% less per token. The spreadsheet says: switch to Model X, save $12,000 per month. This is the same spreadsheet from [The Denominator Problem]({filename}/denominator-problem.md). The denominator problem returns.

Model X's output is longer. It generates more tokens per response, inflating throughput numbers but also inflating cost per response. Model X's quality pass rate is 78% versus Model Y's 91%. Model X's repair rate is 3x higher. At the LCPR level, Model X costs $0.052 per accepted result versus Model Y's $0.038. The cheaper model is more expensive. Goodput catches this. Throughput does not.

---

## What goodput doesn't capture

**Quality labels are missing.** Without quality labels, goodput degrades to latency-constrained throughput. That is still better than raw throughput, but it misses the largest cost lever on quality-sensitive workloads. If you don't have eval labels, goodput will tell you about latency and reliability but not about the acceptance rate that drives LCPR. Start measuring quality on the highest-value workload first.

**Streaming workloads care about jitter.** Interactive chat users feel inter-token latency (ITL) variation. A burst of fast tokens followed by a stall is worse than a steady moderate pace. Mean TPOT doesn't capture this. For streaming UX, measure p95 ITL and jitter (max ITL minus min ITL within a response), not just mean TPOT.

**Batch workloads use different SLOs.** Batch goodput should use completion window and accepted-row rate, not interactive TTFT/TPOT. A batch job that completes in 4 hours with 99.2% row acceptance is productive. Applying interactive latency SLOs to batch work produces a nonsensical goodput number.

**Benchmarks don't match production.** A benchmark with synthetic uniform prompts, closed-loop traffic, and warm cache will produce different goodput numbers than production with variable-length prompts, Poisson arrivals, cache disruption from replica scaling, and real quality failures. Treat benchmark goodput as directional, not predictive. The frontier test is most useful when run on production traffic replay or realistic synthetic distributions.

**Scaling replicas dilutes cache locality.** Adding replicas to handle traffic spikes reduces per-replica cache hit rate. A system that runs at 85% cache hit rate on 4 replicas may drop to 60% on 8 replicas if the router doesn't adapt. Counterintuitively, scaling up can increase per-request cost even as it increases total capacity.

**Low volume makes goodput noisy.** At 50 requests per day, daily goodput fluctuations are large. One bad hour (a provider incident, a cache flush, a burst of difficult queries) can swing daily goodput by 30%. Goodput is most stable and useful at hundreds of requests per day or more.

**Multi-turn sessions complicate the unit.** Is the goodput unit a turn or a session? A conversation with seven good turns and one bad turn is one failed session or seven-eighths good turns, depending on how you define the unit. For conversational workloads, I define the unit as the session: the conversation is accepted or it isn't. But this means session-level goodput is lower than turn-level goodput, and the distinction matters for capacity planning.

---

## Three layers, one observation

Cache-local routing, the right denominator, and SLO-gated benchmarking are not separate optimizations. They are the same observation applied at three layers: the request, the trace, and the cluster. A serving system that produces accepted work is the thing the product needs. Tokens, GPU cycles, and throughput are inputs to that, not metrics for it.

Token price is the first number every team looks at. It should be the last number that informs the decision.

The full chapter develops this framework further, with additional worked examples on cache-local routing under operational disruption and the productive-capacity formalism. See *Production Inference Economics: A Field Guide*, Chapter 9.

---

*Sohail Mohammad — May 2026*

*Numbers are anonymized and should not be attributed to any specific employer, customer, or deployment.*
