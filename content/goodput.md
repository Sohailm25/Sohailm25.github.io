Title: Goodput or It Didn't Happen
Date: 2026-05-13
Category: Writings
Slug: goodput
Summary: GPU utilization can be 78% while 30% of requests fail SLO constraints. The Goodput Frontier Test replaces single-number benchmarks with decision-grade surfaces that measure accepted results, not raw throughput.
Featured: true
Template: longform_article
Status: published

*I work at Together AI. Technical details have been generalized from production experience; no proprietary information from any organization is disclosed.*

*Production Inference Economics --- Part 5 of 5: [1. The Denominator Problem]({filename}/denominator-problem.md) | [2. Trace Autopsy]({filename}/trace-autopsy.md) | [3. LCPR Calculator]({filename}/lcpr-calculator-v2.md) | [4. Workload Costs]({filename}/workload-costs.md) | **5. Goodput***

---

A capacity planning team reports 78% GPU utilization and calls the cluster "well utilized." The product team reports that 30% of requests exceed the p99 latency SLO (service-level objective). The support team reports rising escalation rates. Finance asks why the bill is growing while utilization is high.

These three facts are not contradictory. They are the same fact, seen from three angles.

78% GPU utilization measures how often the GPU is doing *something*. It does not measure how much of that work produced accepted output at target latency. The GPU can be busy recomputing evicted KV cache (the per-request memory that stores attention state). It can be running speculative decode drafts that get rejected. It can be processing retries of requests that already failed once. It can be serving outputs that will fail the quality gate and never reach a customer. All of that counts as utilization. None of it counts as productive work.

I watched this pattern play out over six weeks. The team had provisioned a dedicated cluster for a RAG workload --- document analysis, roughly 2,000 requests per day. Utilization dashboards were green. Token throughput was healthy. The GPU-hours-per-dollar number looked competitive. But the LCPR --- loaded cost per accepted result --- was climbing. Not because inference got more expensive per token, but because an increasing fraction of the GPU's work was producing nothing the customer would accept.

The root causes were mundane. A KV cache eviction cascade under long-context traffic meant the system was recomputing prefill for requests whose KV state had been preempted. A retry storm from a downstream timeout meant the same prompt was being processed two or three times before one attempt succeeded. And a quantization change intended to improve throughput had introduced quality degradation in the long tail --- rare entities, numeric precision, multi-turn coherence after turn five --- that the standard A/B test hadn't caught.

Each of these individually was a normal operational event. Together, they meant the GPU was 78% utilized and 30% unproductive. The metric that would have caught this is not utilization. It is goodput.

The gap between allocated and productive GPU capacity is not an edge case. A 2024 industry survey found the majority of organizations achieve less than 70% GPU allocation utilization at peak demand, with common figures closer to 10-20%. That is allocation utilization --- how much of provisioned capacity is even assigned to work. Productive utilization --- how much of that assigned work produces accepted output --- is lower still. The gap has two layers: hardware sitting idle, and hardware that is busy but unproductive. Both are costs. Only productive work is revenue.

---

## The distinction that changes every decision

**Throughput** is work attempted. Total tokens generated per second, total requests processed per hour, total GPU cycles consumed. Throughput tells you how busy the system is. It does not tell you how much of that busyness produced value.

**Goodput** is work completed --- accepted results per second, meeting latency, quality, and reliability constraints. Goodput is the bridge between serving physics and the economics from the first four articles in this series. It is the number that belongs in capacity plans, migration decisions, benchmark comparisons, and the LCPR denominator.

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

The formula is not complicated. The discipline of applying it is. Because applying it means you need three things most teams don't have wired together: latency measurements per request, quality labels per request, and cost attribution per request. Without all three, goodput degrades to "latency-constrained throughput" --- still useful, but incomplete. The full definition --- latency, quality, reliability, and cost --- is what connects serving infrastructure to the [LCPR-2026 formula]({filename}/denominator-problem.md).

The cost per accepted result is then:

```
cost_per_accepted = sum(all_costs) / count(accepted_requests)
```

The numerator includes *all* costs --- including failed attempts, retries, quality failures, and wasted speculative tokens. The denominator includes *only* accepted requests. This is the same structure as LCPR-2026. Goodput is the serving-side measurement that feeds the economic formula's denominator --- the `A` in the [LCPR-2026 formula]({filename}/denominator-problem.md).

---

## Where GPU work goes that isn't goodput

The gap between utilization and productive capacity has five mechanisms. Each is measurable, and each has a specific lever.

**KV cache preemption and recomputation** happens when a serving engine runs out of KV memory. It preempts --- evicts the KV state of lower-priority sequences to make room for new ones. When the evicted sequence needs to continue, the engine recomputes the KV from scratch. That recomputation consumes GPU cycles that produce no new output. It is pure overhead. In a production deployment mixing short-context support chat and long-context document analysis on the same GPU pool, KV cache eviction cascades caused running requests to drop and preemptions to spike simultaneously. The monitoring signal was cache usage near 100% with preemption counts climbing. The fix was workload-aware routing: short context to one pool, long context to another. Same hardware, different routing, different economics.

**Retries and repair loops** are a second source of waste. A request times out. The client retries. The retry consumes a fresh prefill, fresh KV allocation, and fresh decode cycles --- all for work that the first attempt already partially completed. On quality-sensitive workloads, a failed quality gate triggers a repair: the system regenerates with corrected context, burning a second full inference pass. [The Trace Autopsy]({filename}/trace-autopsy.md) showed the twelve-request trace where eight tickets generated twelve inference calls --- two retries, one eval grader, and one repair. Those four extra calls are GPU work that doesn't count as goodput but absolutely counts as utilization.

**Speculative decode waste** is subtler. Speculative decoding uses a small draft model to propose multiple tokens per step, then verifies them against the target model. When the draft is accepted, decode is faster. When it's rejected, the draft computation was wasted. The acceptance rate determines whether speculative decoding improves or degrades productive capacity. GPU utilization goes up either way --- the draft model is doing compute --- but goodput only goes up when the acceptance rate is high enough for the drafting savings to exceed the drafting cost.

**Quality failures at the model level** burn GPU budget invisibly. An output that passes the latency SLO but fails the quality gate consumed every token of its inference budget for nothing. The GPU was busy. The request was "successful" in the HTTP sense. The output was useless. Without quality labels in the goodput measurement, this failure is invisible --- the system looks like it's producing work at target latency, and the quality problem surfaces later as customer complaints, support tickets, or manual rework.

**Queue buildup and SLO violations** round out the five mechanisms. At high utilization, requests queue. Queue time adds to TTFT (time to first token). Even if decode is fast once the request starts, the user waits through the queue. A system running at 90% utilization with Poisson arrivals will have materially worse p99 queue time than one running at 70%. The utilization dashboard says "efficient." The user says "slow." The TTFT SLO violation means the request doesn't count as goodput even if the output was perfect.

---

## When optimizations backfire

Two common optimizations --- speculative decoding and quantization --- deserve specific attention because they increase utilization while potentially decreasing productive capacity.

### Speculative decoding at production batch sizes

In a high-concurrency voice workload, speculative decoding with a domain fine-tuned 1B draft model produced 0.92x throughput --- slower, not faster. The acceptance rate improved from 48% to 58% after fine-tuning the draft, but under production batch sizes of 12-16, the extra compute from running the draft model exceeded the savings from accepted drafts. Two weeks of engineering time was the additional real cost.

The mechanism is straightforward. Speculative decoding works best at low concurrency with high acceptance rates. The draft model adds compute at every step. At batch size 1-2, the GPU has spare compute cycles, so the draft is nearly free. At batch size 12-16, the GPU's compute budget is already committed to serving the decode batch, and adding a draft model means either slowing down all sequences or increasing memory pressure.

A search infrastructure provider reports positive production results with multi-token prediction draft layers for the same technique, likely because the search workload's constrained output distribution yields higher draft acceptance rates than voice's open-ended generation. The technique is not universally good or bad. The decision variable is whether your workload's output distribution produces an acceptance rate high enough to offset the draft model's compute at your production batch size.

The wrong conclusion: "speculative decoding improves latency." The right question: "at our batch size and acceptance rate, does speculative decoding increase or decrease goodput?"

### Quantization and the quality tail

After quantizing a production model, quality failures appeared in the long tail: rare entities, numeric precision errors, and multi-turn conversation degradation after five or six turns. Standard A/B tests did not catch these because A/B tests measure average quality on a general distribution. The tail failures affected 2-3% of requests --- below the noise floor of most A/B sample sizes --- but those requests were disproportionately high-value: complex customer queries, multi-step reasoning, and queries involving precise numerical data.

Quantization's throughput gains are real. FP8 quantization can improve throughput by 1.6x and cut memory consumption by 3-4x. But the quality risk is in the tail, not the average. Continuous log analysis --- reviewing real production outputs, not just aggregate quality scores --- was the only reliable detection method.

The productive capacity impact: throughput went up by 60%. Quality failures in the tail increased by 1.5 percentage points. Retry rate for affected queries increased. Human escalation cost for affected queries increased. Net LCPR change: roughly break-even. The quantization "saved" GPU cost and then spent it on retries and human review.

The right approach is not to avoid quantization. It is to measure its effect on goodput, not just throughput. Run quantization experiments with tail-quality evaluation --- rare entities, long conversations, numerical tasks --- not just aggregate pass rates. If goodput under SLO improves, the optimization worked. If throughput improved but goodput didn't, the optimization is a wash dressed up as a win.

---

## Cache-local routing: the lever hiding in your load balancer

Eight replicas behind a round-robin load balancer. Cache hit rate drops from 85% to 12%. TTFT increases 4x. The support chatbot's cache configuration has not changed. The system prompt is identical across requests. The tool definitions haven't moved. Everything about the caching setup is correct --- except the load balancer.

Round-robin sends each request to a random replica. The system prompt is cached on replica 3, but the next turn goes to replica 7, where the cache is cold. Replica 7 runs a full prefill. The next request goes to replica 1. Another full prefill. The cache is populated on every replica, but each replica only serves one-eighth of the traffic, so reuse within the TTL window is too low to sustain hits.

Traditional load balancing treats replicas as interchangeable. Inference replicas are not interchangeable --- each replica holds different KV state.

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

**Session state.** Multi-turn conversations benefit from sticky routing to the replica that holds the conversation's growing context. Context accumulates across turns --- by turn 8, the growing conversation plus system prompt can be 4-6x the initial prompt. If each turn goes to a different replica, every turn pays for full re-prefill of the conversation history.

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

If your workload has reusable prefixes and you use multi-replica serving, routing policy is an economic lever. Implement prefix-aware or KV-cache-aware routing before spending on more hardware. Measure cache hit rate by replica. If hit rates are low but prefix diversity is low --- most requests share a few system prompts --- routing is the problem, not cache configuration.

### The operations angle

Cache locality is fragile under operations. Rolling deployments cycle replicas, clearing their KV state. Autoscaling adds cold replicas that have no cache state --- the router spreads traffic to them, and their cache miss rate is 100% until they warm up. A cache salt rotation (sometimes triggered by security policy or tenant isolation requirements) invalidates all cached prefixes simultaneously.

Each of these events temporarily converts the system from warm-cache to cache-disrupted. If the team measures average cache hit rate across a day, the 15-minute disruption window looks small. But if that disruption window coincides with peak traffic --- and scaling events often do, because autoscaling triggers under load --- the cost impact is disproportionate. Peak traffic times cold cache means the most expensive requests hit the most expensive state.

The mitigation is not to avoid operations. It is to measure TTFT and cache hit rate around operational events --- deployments, scale-outs, salt rotations --- and include disruption-window cost in the goodput calculation. A system that runs at $0.012 per accepted result in steady state but spikes to $0.035 during the 20 minutes after each deployment has a blended cost that depends on deployment frequency. Deploy twice a day and the disruption cost is material. Deploy weekly and it's noise. The goodput framework makes this tradeoff explicit.

---

## The Goodput Frontier Test

Most benchmarks in vendor blogs and provider comparisons make the same mistake. They report a single number --- tokens per second, requests per second, average latency --- at a single operating point. A benchmark that reports a single operating point hides the surface underneath.

The Goodput Frontier Test measures goodput across a sweep of request rates or concurrency levels, under explicit SLO constraints, with quality labels. It produces a frontier --- the curve of cost per accepted result as load increases --- not a single point.

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
Route A wins on raw throughput and total cost. Route B wins on goodput and cost per accepted result. A token-price comparison picks Route A. A Goodput Frontier Test picks Route B.

The difference is not subtle. Route A serves 58 accepted results per 100 attempts. Route B serves 85. Route A wastes 42% of its GPU work on requests that will fail SLO or quality gates. Route B wastes 15%. Route A looks cheaper in total spend. Route B is cheaper per unit of value delivered.

This is the same denominator problem from [The Denominator Problem]({filename}/denominator-problem.md), expressed in serving physics instead of billing arithmetic. The metric that matters is not tokens generated. It is accepted results delivered.

For output-heavy workloads --- code generation, long-form content, agentic tool use --- output-token goodput can be more informative than request goodput:

```
output_token_goodput =
  sum(output_tokens for passing requests) / D
```

A system that produces 800 accepted output tokens per second and 200 rejected tokens per second has output-token goodput of 800 tok/s --- not 1,000. The rejected tokens consumed GPU decode cycles, KV bandwidth, and output-token billing. They produced nothing the customer accepted. Output-token goodput makes this visible in a way that raw token throughput does not.

### Benchmark claims to avoid

Every claim on this list has appeared in a vendor blog, a comparison table, or a customer deck. Every one of them is incomplete or misleading without additional context:

- "X tokens/sec, therefore X is cheaper." Tokens/sec alone is not an economics claim --- it requires SLO constraints, length distribution, cache warmth, quality gates, and cost attribution to mean anything.
- "p50 latency improved, so users will feel it." Interactive systems fail at p95/p99, TTFT spikes, cold starts, or retries --- not at p50.
- "This engine is faster than that engine." This claim requires model revision, quantization level, hardware, runtime flags, workload shape, request-rate sweep, and cache policy to be meaningful. Without them, it is marketing.
- "Prompt caching saves N percent." Cacheable-prefix share, hit rate, TTL fit, tenant isolation, and eviction behavior all determine whether the savings number is real or aspirational.
- "Batch API is 50% cheaper, so move workloads to batch." Completion-window tolerance, failed-row handling, expiration cost, and delivery delay alone determine whether the migration math works.
- "Speculative decoding improves latency." Acceptance rate, batch size, quality gate, and net goodput measurement can flip this claim backwards.
- "GPU utilization is 78%, so the cluster is efficient." Utilization without goodput describes busyness, not productivity.

---

## What to measure

The workload class determines the goodput definition. The serving infrastructure determines the measurement points. Here is the measurement table that ties everything together --- from the workload economics of [What Your Workload Actually Costs]({filename}/workload-costs.md) to the goodput definition in this article:

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

At the goodput level, Engine B produces more accepted results per second at a lower cost per accepted result --- despite being "slower" on the throughput benchmark. The migration that looks wrong on throughput looks right on goodput. I have seen teams reverse migration decisions after measuring goodput instead of throughput. The reversal held up in every case I observed.

**Model selection.** The model evaluation says Model X generates 40% more output tokens per second than Model Y. Model X costs 30% less per token. The spreadsheet says: switch to Model X, save $12,000 per month. This is the same spreadsheet from [The Denominator Problem]({filename}/denominator-problem.md). The denominator problem returns.

Model X's output is longer --- it generates more tokens per response, inflating throughput numbers but also inflating cost per response. Model X's quality pass rate is 78% versus Model Y's 91%. Model X's repair rate is 3x higher. At the LCPR level, Model X costs $0.052 per accepted result versus Model Y's $0.038. The cheaper model is more expensive. Goodput catches this. Throughput does not.

---

## What goodput doesn't capture

**Quality labels are missing.** Without quality labels, goodput degrades to latency-constrained throughput. That is still better than raw throughput, but it misses the largest cost lever on quality-sensitive workloads. If you don't have eval labels, goodput will tell you about latency and reliability but not about the acceptance rate that drives LCPR. Start measuring quality on the highest-value workload first.

**Streaming workloads care about jitter.** Interactive chat users feel inter-token latency (ITL) variation --- a burst of fast tokens followed by a stall is worse than a steady moderate pace. Mean TPOT doesn't capture this. For streaming UX, measure p95 ITL and jitter (max ITL minus min ITL within a response), not just mean TPOT.

**Batch workloads use different SLOs.** Batch goodput should use completion window and accepted-row rate, not interactive TTFT/TPOT. A batch job that completes in 4 hours with 99.2% row acceptance is productive. Applying interactive latency SLOs to batch work produces a nonsensical goodput number.

**Benchmarks don't match production.** A benchmark with synthetic uniform prompts, closed-loop traffic, and warm cache will produce different goodput numbers than production with variable-length prompts, Poisson arrivals, cache disruption from replica scaling, and real quality failures. Treat benchmark goodput as directional, not predictive. The frontier test is most useful when run on production traffic replay or realistic synthetic distributions.

**Scaling replicas dilutes cache locality.** Adding replicas to handle traffic spikes reduces per-replica cache hit rate. A system that runs at 85% cache hit rate on 4 replicas may drop to 60% on 8 replicas if the router doesn't adapt. Counterintuitively, scaling up can increase per-request cost even as it increases total capacity.

**Low volume makes goodput noisy.** At 50 requests per day, daily goodput fluctuations are large. One bad hour --- a provider incident, a cache flush, a burst of difficult queries --- can swing daily goodput by 30%. Goodput is most stable and useful at hundreds of requests per day or more.

**Multi-turn sessions complicate the unit.** Is the goodput unit a turn or a session? A conversation with seven good turns and one bad turn is one failed session or seven-eighths good turns, depending on how you define the unit. For conversational workloads, I define the unit as the session --- the conversation is accepted or it isn't. But this means session-level goodput is lower than turn-level goodput, and the distinction matters for capacity planning.

---

## The series in five minutes

This is the fifth and final article in the series. Here is what the series argued, compressed:

**[The Denominator Problem]({filename}/denominator-problem.md).** Cost per token is the wrong metric. The right metric is loaded cost per accepted result --- LCPR. The denominator is not requests, not tokens, not API calls. It is accepted work units. A team that optimizes token price while ignoring the denominator can make their costs worse by switching to a "cheaper" provider that produces more retries, more repairs, and more human escalation.

**[The Trace Autopsy]({filename}/trace-autopsy.md).** LCPR is a formula. The Trace Autopsy is the diagnostic that makes it measurable. Four data sources --- application traces, provider usage exports, eval pipeline results, and the provider invoice --- joined by request ID and reconciled to a monthly delta. If the delta exceeds 5%, investigate before trusting the number. Start with twenty traces, not a data warehouse.

**[The LCPR Calculator]({filename}/lcpr-calculator-v2.md).** The calculator implements the four-source join as code. Trace data, provider invoice, eval results, and contract terms go in. LCPR, margin, cache sensitivity, and the reconciliation delta come out. The tool makes the diagnostic repeatable without spreadsheet gymnastics.

**[What Your Workload Actually Costs]({filename}/workload-costs.md).** Not all inference is the same. A support chatbot, a coding agent, a RAG pipeline, and a batch extraction job have different cost structures, different failure modes, different quality gates, and different denominators. The blended average hides the cross-subsidy. Per-workload LCPR exposes the dominant lever for each workload class.

**Goodput or It Didn't Happen (this article).** Throughput measures busyness. Goodput measures productivity. GPU utilization can be high while productive capacity is low --- because retries, KV recomputation, speculative waste, quality failures, and queue-induced SLO violations all consume GPU cycles without producing accepted output. The Goodput Frontier Test measures cost per accepted result across a load sweep, under explicit SLOs, replacing single-number benchmarks with a decision-grade surface. Cache-local routing is an economic lever that can reduce TTFT by 4x and input cost by 60% without changing models or hardware.

The serving infrastructure exists to produce accepted work. Not tokens. Not GPU cycles. Not throughput. Accepted work. Every decision --- model selection, provider comparison, routing policy, caching strategy, quantization, capacity planning, migration --- should be evaluated by its effect on the loaded cost of producing accepted work under the constraints the product requires.

Token price is the first number every team looks at. It is the last number that should inform the decision.

---

*Production Inference Economics --- Part 5 of 5: [1. The Denominator Problem]({filename}/denominator-problem.md) | [2. Trace Autopsy]({filename}/trace-autopsy.md) | [3. LCPR Calculator]({filename}/lcpr-calculator-v2.md) | [4. Workload Costs]({filename}/workload-costs.md) | **5. Goodput***

*Sohail Mohammad --- May 2026*

*Numbers are anonymized and should not be attributed to any specific employer, customer, or deployment.*
