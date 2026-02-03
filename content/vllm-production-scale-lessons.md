Title: Optimizing vLLM at Production Scale: Lessons from Conversational AI Infrastructure
Date: 2026-02-03 14:00
Category: Technical
Slug: vllm-production-scale-lessons
Summary: Memory fragmentation, throughput cliffs, and quantization accuracy issues that only show up in production—lessons from running vLLM at scale for conversational AI.

---

# Optimizing vLLM at Production Scale: Lessons from Conversational AI Infrastructure

**Disclaimer:** This post reflects patterns and lessons learned from building vLLM-based inference systems at production scale. Technical details have been generalized, and no proprietary information from any specific organization is disclosed.

---

I spent a significant portion of the past 2 years building conversational AI infrastructure for real-time systems.

vLLM was the foundation. PagedAttention, continuous batching, prefix caching are all subsets of that. But often is the case where production issues don't 1:1 resemble what the docs tell you. Memory fragmentation is something I learned about, which ended up being huge as it creeps up over days. Throughput cliffs after bursts in service usage can force architectural changes. Even something that everyone talks about now, quantization, can introduce accuracy issues on seasonal items that only show up in logs.

Here's some context about what I learned.

---

## Part 1: Well-Known Principles (Foundation)

If you're evaluating vLLM, you probably already know this. But there are nuances worth clarifying.

### PagedAttention Is Virtual Memory for GPUs

PagedAttention treats the KV cache like OS virtual memory, AKA there's almost zero GPU waste on padding as blocks are allocated AS NEEDED. So fixed-size blocks and non-contiguous allocation. Traditional systems pre-allocate contiguous memory per sequence and waste 60-80% through fragmentation. vLLM reduces this to under ~4%.

The detail most people miss here is you're running **PagedAttention v2**, not v1. The original paper used copy-on-write for forked sequences (beam search). v2 eliminated that overhead with reference counting on blocks. It's been the default since mid-2024 and especially in production environments.

For those of you who are in the weeds of PagedAttention already, the picture gets even spicier because now that FlashAttention and FlashInfer handle compute, the architecture is even MORE like OS virtual memory. AKA vLLM's Block Manager handles the allocation semantics, the attention backend does indirect reads through block tables, and the model doesn't care.

Memory management is _DECOUPLED_ from attention kernel optimization.

If you're lost, ignore my pretentious outpourings and keep chugging forward.

### Continuous Batching vs Static Batching

vLLM doesn't wait for a batch to finish before admitting new requests. As each sequence completes, its slot is immediately filled by a waiting request.

The production nuance here is that continuous batching creates variable GPU utilization. During peak hours, utilization stays consistently high (80-95%). During off-peak, you get _spiky_ utilization.

This is an issue because it confuses your autoscalers, unless you _set autoscaler cooldown periods to at least 60 seconds_.

### The TTFT / ITL / Throughput Triangle

Three CRUCIAL metrics:

- **TTFT (Time To First Token):** This is dominated by _prefill compute_. It is proportional to prompt length.

- **ITL (Inter-Token Latency):** This is dominated by _memory bandwidth_. Model weights load from HBM every decode step.

- **Throughput:** This is dominated by _batching efficiency_. More concurrent sequences means better GPU utilization.

For real-time conversational systems, _TTFT matters most for UX_. Customers hear silence. ITL matters for smooth audio synthesis (stuttering breaks immersion). Throughput matters for cost.

You can't optimize all three simultaneously. Pick the constraint that matters for your use case.

How do you figure out what matters? Discernment and Metrics. Oh also maybe talk to people.

---

## Part 2: Production Nuances (The Meat)

This is where production tends to diverge from benchmarks.

### vLLM V1 Architecture: Everything Changed

vLLM underwent a complete rewrite in early 2025, which deprecated V0. I was working with vLLM through this change, so if you're reading old blog posts, they could be misleading.

**What objectively changed (i organized this table with claude's help while researching for this paper):**

| Component | V0 | V1 |
|-----------|----|----|
| **Scheduler** | Separate prefill/decode phases | Unified — treats all tokens the same |
| **Worker Architecture** | Asymmetric (scheduler on Worker 0) | Symmetric — scheduler in separate process |
| **Prefix Caching** | Optional, had CPU overhead | **Default ON**, near-zero overhead at 0% hit rate |
| **CUDA Graphs** | Full graphs only | Piecewise — captures portions individually |
| **Input Preparation** | Recreated every step | Persistent Batch — cached tensors, diffs via NumPy |
| **API Server** | Single-process | Multi-process ZeroMQ IPC, overlaps tokenization with GPU |

**Okay but why does this matter lmaorofl:**

_Prefix caching is ON by default_ in V1. Your system prompt (1500-2000 tokens) gets cached automatically. For conversational systems with repeated prompts, this is 100-200ms that gets saved on every request. It also gets rid of a lot of CPU overhead you may notice in your logs.

V1 achieves **1.7x higher throughput** than V0 on identical hardware, purely from reduced CPU overhead. We love vLLM devs.

### The REAL KV Cache Story: Fragmentation, Offloading, and Compression

#### Memory Fragmentation

Oof this one hurt.

PagedAttention allocates blocks from a free list. As sequences of varying lengths complete, blocks are returned in non-contiguous order. Over time, the free list _fragments_. There are enough free blocks _total_, but they can't satisfy _large contiguous allocation requests_ efficiently.

**Symptom AKA how we noticed this:** p99 latency drifts on average 5-10% per hour. Averages hide this completely which is what caused us noticing this VERY late. You need _percentile-based_ alerting.

**We observed this directly.** 12-14 hours in, p99 started drifting. By 36 hours, degradation was significant. Eventually this led to the bane of our existence, OOM kills.

Piecing this together correlates three symptoms:
1. OOM kills (what alerted us)
2. p99 drift (visible in retrospect)
3. Preemption warnings in logs (correlated later)

**Mitigation (better than restarts):**

1. **KV Cache Offloading to CPU (claude told me this is vLLM 0.11.0+):** Offload KV to CPU DRAM. The new contiguous memory layout (0.12.0) made this practical with ~9x throughput improvement with high cache hit rates. For systems where the _prompt is identical across requests_, this is a _game-changer_.

2. **FP8 KV Cache Quantization:** Separate from weight quantization. Cuts KV cache memory in half with less than 1% in quality loss (we noticed a bit more than this but more on tracking down the why later). This is available with `--kv-cache-dtype fp8_e5m2`. For short conversations, the quality impact is negligible though.

We stuck with 12-hour rolling restarts. At our scale (20-30 concurrent peak per regional hub), the fragmentation rate was manageable. Teams running higher concurrency (100+) need offloading or FP8.

#### KV Cache Memory Calculation

For the crackheads that are constantly asking Claude for how to estimate vRAM and KV Cache needs every other week, this will hopefully look vaguely familiar:

```
KV cache per token = 2 × num_layers × num_kv_heads × head_dim × dtype_size

For Qwen2.5-7B (FP16):
  = 2 × 32 × 4 × 128 × 2 bytes
  = 64 KB per token

For a 2048-token conversation:
  = 2048 × 64 KB = 128 MB per conversation

For 30 concurrent conversations:
  = 30 × 128 MB = 3.84 GB of KV cache alone

With FP8 KV cache:
  = 1.92 GB (half the memory, double the concurrent capacity)
```

#### Block Size Matters

vLLM's default block size is 16 tokens. This affects:

- **Prefix caching granularity:** Hashes are computed per block. Cache matching happens in 16-token chunks.

- **KV offloading throughput:** Larger physical blocks = better DMA throughput. vLLM 0.12.0 changed memory layout to make each physical block contiguous across all layers (16KB → 2MB for Llama-8B)(this is what we just talked about). 

- **Memory waste at sequence boundaries:** Last block of each sequence wastes memory. Google for the full estimation equation. 

### Preemption: The Hidden Failure Mode

When KV cache fills up, vLLM must preempt running requests. This is just a fancy term for stopping a task that's running in order to free up some resources that may be exhausted. 

Not gonna lie this can be hard to catch.

**How it works (V1):**

1. Scheduler detects insufficient KV blocks
2. **Recompute mode:** Evicts lowest-priority request's KV cache entirely. When re-scheduled, prefill starts from scratch.
3. V0 had swap mode—deprecated. V1 uses KV offloading instead

**The warning you'll see:**

```
WARNING scheduler.py:1057 Sequence group 0 is preempted by PreemptionMode.RECOMPUTE 
```

This warning is your canary. If you see it regularly, you're running too many concurrent sequences for your GPU memory. Reduce `max_num_seqs` or enable KV cache offloading.

**Impact:** A preempted request loses ALL its KV cache. For a multi-turn conversation that's 5 turns deep:
- Lose ~1500 tokens of computed KV
- Recompute from scratch on re-schedule
- Adds 100-300ms latency to that specific customer

**Mitigation:** Set `max_num_seqs` to a value where preemption never triggers under peak load. Better to queue new requests with a semaphore than preempt running ones.

### Chunked Prefill

**The problem:** Without chunked prefill, a single request with a long prompt (2000-token system prompt + history) blocks ALL decode steps for other in-flight requests. Customer A's response stalls while Customer B's prefill runs.

**How chunked prefill solves it:** vLLM splits prefill into chunks (default: 512 tokens per chunk in V1). Between chunks, decode steps for other requests run. This interleaves prefill and decode work.

```
Without chunked prefill:
  |---PREFILL (2000 tokens)---|---decode---|---decode---|
  Customer B hears nothing ^^^^^^^^^ during A's prefill

With chunked prefill:
  |PREFILL(512)|decode|PREFILL(512)|decode|PREFILL(512)|decode|
  Customer B still gets tokens ^^^ while A's prefill runs
```

**Tuning:**

```python
engine_args = {
    "max_num_batched_tokens": 2048,  # Total token budget per step
    # V1 automatically splits prefill to fit this budget
}
```

For short conversations, keep `max_num_batched_tokens` at 2048. But during turn 5+ (when history accumulates), chunked prefill prevents one customer's long history from stalling all others.

---

### Speculative Decoding

Speculative decoding uses a small draft model to predict future tokens, then verifies them with your target model in parallel. When the draft is correct, you get multiple tokens per forward pass.

The theory is simple, but the production reality is that _it doesn't always help_.

**When it helps:**
- Models where draft acceptance rate is high (>70%)
- Tasks with predictable patterns (code completion, structured output)
- When you're memory-bound, not compute-bound (small batch sizes)

**When it hurts:**
- Conversational AI with unpredictable user responses
- Large batch sizes where GPU is already saturated
- Draft model overhead exceeds the speedup from accepted tokens

We tested speculative decoding with Qwen2.5-7B as the target and Qwen2.5-0.5B as the draft model. Acceptance rate was around 50-60% for conversational responses. The overhead of running two models (even with the small one) _actually increased_ p50 latency by ~15-20ms. The intuition is that there is a limited subset of potential responses and outputs due to the domain. We aren't answering theoretical questions about quantum computing. We're asking how we should put the fries in the bag.

And in writing this article I realized that the math didn't work out either. We need 3-4 accepted tokens per speculation to break even on the added overhead. At 50-60% acceptance, we were getting 1-2 tokens per speculation. WACK.

**Key insight here is** speculative decoding is a _latency_ optimization, not a throughput optimization. If you're already batch-saturated, skip it. If you're running single requests with strict latency SLOs, test it carefully with YOUR traffic patterns. Although we ARE latency optimizing, it didn't fit our specific profile.

### Quantization: The Accuracy-Memory Tradeoff

Quantization reduces model weight precision. FP16 → INT8 or INT4. The goal is to cut memory usage and increase throughput, but it introduces accuracy degradation. This was a given before we did it but the way it surfaced was a learning experience. 

The degradation is not uniform across all use cases, which is what makes this annoying af to debug in production.

**What we used:**
- **AWQ (Activation-aware Weight Quantization):** INT4 quantization that preserves accuracy by identifying and protecting _critical_ weights (critical weights is the caveat to notice here)
- **GPTQ:** Another INT4 method, it uses a slightly different calibration approach

Both gave us similar results for Qwen2.5-7B:
- a ~3 to 4 GB memory footprint (down from ~14GB FP16, hell yeah)
- ~1.6x throughput improvement (but we are latency optimizing!!!! not throughput optimizing!!!)

**Where accuracy issues showed up:**

1. **Seasonal/rare entity hallucinations:** the model would occasionally hallucinate product names for seasonal items (holiday-specific SKUs). These items had sparse training data, so quantization pushed them below the confidence threshold where the model "remembered" them correctly. This was the most common issue.

2. **Numeric precision:** for things like invoice amounts, order IDs, timestamps. INT4 quantization introduced occasional off-by-one errors in numeric outputs (e.g., "$123.45" → "$123.44"). We only found one instance of this but that was significant enough.

3. **Long-context degradation:** After turn 5-6 in a conversation, quantized model started losing coherence faster than FP16. This correlates with KV cache quantization compounding with weight quantization. You'd be surprised how many convos reach higher turn numbers. So if you're ordering for a big group, maybe choose the non-AI drive thru.

We caught these through _continuous log analysis_. Not A/B testing (too slow) nor manual QA (bc it doesn't catch rare failures). We streamed logs to an analysis pipeline that flagged:
- Responses with numeric discrepancies
- Entity names not in our catalog
- User corrections ("that's not right")

**Mitigation strategies:**

1. **Hybrid quantization:** Keep specific layers in FP16 (usually first/last few layers and attention layers). vLLM doesn't support this natively, but HuggingFace Optimum does (learned after the fact)

2. **Dynamic fallback:** When confidence scores drop below a threshold, re-run the request with FP16. Adds complexity, but catches edge cases (we would often hedge requests to lower latency in specific query complexity cases)

If you're working with financial data, legal documents, or anything where numeric precision is non-negotiable, _test quantization extensively_ before production. The memory savings are tempting, but the accuracy hit can be subtle and catastrophic.

### Concurrent Requests and Little's Law

Here's the math that determines your throughput ceiling:

```
Throughput (requests/sec) = Concurrent Requests / Average Latency (sec)
```

This is known as _Little's Law_. It's deceptively simple and governs _everything_ about your system's capacity.

**Example:**
- Average request latency: 2 seconds (TTFT + generation time)
- Concurrent requests: 30
- Throughput: 30 / 2 = **15 requests/sec**

To double throughput to 30 req/sec, you either:
1. Double concurrent capacity (30 → 60)
2. Halve latency (2s → 1s)

Doubling concurrent capacity means more GPU memory (for KV cache). Halving latency means faster model (smaller model, quantization, better hardware).

**The production constraint here is** you can't just increase `max_num_seqs` indefinitely. Each concurrent sequence consumes KV cache memory. Eventually you hit OOM or trigger constant preemption.

For Qwen2.5-7B on an A100 (80GB), with FP16 weights and FP16 KV cache:
- Model weights: ~14GB
- KV cache at 2048 tokens per conversation: ~128MB per conversation
- Available memory for KV cache: ~60GB (after weights, overhead)
- Max concurrent conversations: 60GB / 128MB ≈ **470 conversations**

But that's theoretical max. In practice, you need headroom for:
- Varying conversation lengths (some hit 4096 tokens)
- Fragmentation (free list doesn't pack perfectly)
- Transient spikes (burst traffic)

We ran at ~25-30 concurrent max per GPU. This gave us comfortable margins and zero preemptions under normal load.

### The Throughput Cliff

Around 200-300 concurrent requests across our regional deployment, we hit a wall. Throughput didn't scale linearly. Latency spiked. Preemption warnings flooded logs.

The cliff wasn't a single bottleneck. It was _three_ bottlenecks that compounded:

1. **KV cache fragmentation accelerated:** Higher concurrency = more varied sequence lengths = faster fragmentation. Memory pressure triggered preemptions, which worsened latency variance.

2. **CPU tokenization overhead:** vLLM V0's single-process API server became CPU-bound. Tokenization (especially for long prompts) blocked GPU from receiving new work. V1's multi-process architecture fixed this, but we hit the cliff on V0.

3. **Network saturation:** Regional hubs aggregate traffic from edge locations. At 200+ concurrent, network I/O between load balancer and vLLM instances started saturating. This added 10-20ms per request, which compounded with latency variance from preemption.

**How we diagnosed this:**

Correlated three metrics:
- GPU utilization _dropped_ from 85% to 60% (GPU was starved, not saturated)
- CPU utilization spiked to 95%+ (tokenization bottleneck)
- Network throughput hit the instance's bandwidth limit

**Solution:**

1. **Upgrade to vLLM V1:** Multi-process API server eliminated CPU tokenization bottleneck. GPU utilization returned to 80-90%.

2. **Horizontal scaling with client-side load balancing:** Instead of funneling all traffic through one load balancer, clients (edge locations) maintained connections to multiple vLLM instances and load-balanced locally. This distributed network I/O.

3. **Aggressive KV cache management:** Enabled FP8 KV cache quantization + 12-hour rolling restarts to prevent fragmentation from accumulating.

After these changes, the cliff moved from 200-300 concurrent to 500+. We never hit it again because our peak load topped out at ~400 concurrent across all regions.

**The lesson here is** throughput cliffs in production are _rarely_ single bottlenecks. It's usually 2-3 subsystems failing simultaneously. Diagnose with metrics from multiple layers (GPU, CPU, network, memory). Don't assume GPU saturation is your limiting factor.

---

## Part 3: System Design Decisions

The optimizations in Part 2 matter, but they sit on top of architectural choices. Here's how we structured the system.

### Regional Hub Architecture

We deployed vLLM instances regionally, not centrally. Each geographic region (think Northeast, Midwest, South, West) had its own set of GPU instances running vLLM. Traffic from edge locations (the actual stores) routed to the nearest regional hub.

**Why regional, not central:**
- _Latency budget._ Sub-second TTFT means every hop matters. Round-trip from California to Virginia adds 60-80ms minimum. And if you think that isn't noticeable, you'd be surprised
- _Network reliability._ Regional failures don't take down the entire system. If the West hub goes down, stores fail over to Midwest (higher latency, but still operational)(AVAILABILITY!!! CAP!!!!)
- _Traffic patterns._ Lunch and dinner rushes are timezone-dependent. West coast peak is 3 hours after East coast peak. Regional deployment smooths out global load.

**Trade-offs we accepted:**
- More infrastructure to manage (4 regional hubs instead of 1 central cluster)
- Model updates need to roll out regionally (can't update everything at once)
- Monitoring complexity (per-region dashboards, cross-region alerting)

At this scale (~100 stores per region, 20-30 concurrent per hub during peak), regional deployment was the right call. If you're serving fewer locations or latency isn't as tight, central deployment is simpler.

### Model Serving: One Model, Multiple Instances

We ran _one_ model (Qwen2.5-7B) across all instances. No A/B testing different models in production. No ensemble of models for different query types.

**Why single-model:**
- _Operational simplicity._ One model to optimize, one set of configs to tune, one deployment pipeline.
- _Prefix caching efficiency._ V1's automatic prefix caching works best when the system prompt is identical across requests. Multiple models = multiple system prompts = lower cache hit rates.
- _Resource predictability._ GPU memory requirements are consistent. No surprise OOMs from larger model variants.

We did evaluate smaller models (Qwen2.5-3B) and larger models (Qwen2.5-14B). The 3B had accuracy issues on multi-turn conversations (lost context after turn 3-4). The 14B didn't fit our latency budget (TTFT was 150-200ms, we needed sub-100ms).

Qwen2.5-7B hit the sweet spot: good enough accuracy, fast enough latency, fits on A100 with room for 25-30 concurrent.

### Monitoring and Observability

Production inference systems can often fail silently because it may not crash but it just starts giving worse answers. You need metrics that catch degradation _before_ customers complain.

**What we tracked:**

1. **Latency percentiles (p50, p90, p99, p99.9):** Averages hide preemption spikes. p99 drift is your early warning for KV cache fragmentation or CPU bottlenecks

2. **Preemption rate:** This SHOULD be zero under normal load. If preemptions are happening, you're oversubscribed. Either reduce `max_num_seqs` or add capacity.

3. **GPU utilization + memory usage:** These should move together. 

High GPU util + low memory = compute-bound (good)
Low GPU util + high memory = memory-bound (consider offloading or quantization)
Low GPU util + low memory = CPU-bound or network-bound (check tokenization overhead, network throughput)

4. **Token throughput (tokens/sec):** Normalized metric across batch sizes. If throughput drops but GPU util stays high, you're hitting memory bandwidth limits.

5. **Prefix cache hit rate:** V1 makes this a default metric. Should be >80% for conversational systems with repeated prompts. If it's low, your prompts aren't consistent or your cache is thrashing.

6. **Model accuracy proxies:** You can't measure "accuracy" directly in production (no ground truth). We tracked _user corrections_ ("that's not right", "no I said X"), _entity hallucinations_ (product names not in catalog), and _numeric discrepancies_ (parsed amounts vs. expected ranges).

**What we learned (after several incidents):**

Percentile-based alerting is non-negotiable. We initially alerted on p50 latency, which was a big mistake. p50 stayed under 500ms even when 5% of requests were hitting 2-3 seconds due to preemption. Customers complained before we saw the alert.

Switched to p99 alerts with a 10% drift threshold over 1 hour. Caught fragmentation issues 6-8 hours before they became critical.

### Load Balancing Strategy

Client-side load balancing worked better than centralized load balancers for our use case.

**How it worked:**
- Each edge location (store) maintained persistent HTTP/2 connections to 2-3 vLLM instances in its region
- Client library (running at the store) round-robins requests across available connections
- Health checks every 30 seconds; failed instances removed from rotation

**Why client-side:**
- _Eliminates single point of failure._ No load balancer to become a bottleneck or fail.
- _Lower latency._ Direct connection from store to vLLM instance, no extra hop.
- _Better failover._ Client detects instance failure within 30 seconds and reroutes. Centralized LB would need health checks + DNS updates + TTL expiry (90+ seconds).

**Trade-off:**
- Client library has more complexity (connection pooling, health checks, retry logic)
- Harder to centrally observe traffic patterns (no single LB to pull metrics from)

For high-concurrency, latency-sensitive systems, client-side load balancing is worth the complexity. For lower-scale deployments, stick with a centralized LB (simpler ops, easier debugging).

### Graceful Degradation and Fallbacks

Real-time conversational systems can't just return 503s when vLLM is overloaded. Customers are _literally sitting there waiting_. Here come our fallbacks.

**What we built:**

1. **Request queue with timeout (5 seconds):** If all vLLM instances are at `max_num_seqs`, queue the request. If it's not admitted within 5 seconds, fall back to rule-based responses.

2. **Rule-based fallback:** Hand-written responses for common queries ("What's the total?", "Add fries", "Cancel that"). Not great, but better than silence. Customers got _an_ answer even if it wasn't AI-generated.

3. **Graceful degradation for tool calls:** Some queries required tool calls (database lookups, inventory checks). If the tool call timed out, the model generated a response _without_ the tool result. Better to say "I couldn't check inventory, but typically that item is available" than to hang.

**Impact:**
- Fallback rate under normal load: <1%
- Fallback rate during incidents (regional outage, vLLM restart): 15-20%
- Customer satisfaction didn't crater during incidents bc they still got responses

The key here is fallbacks should be built in from day 1. Retrofitting graceful degradation after you're in production is way harder.

---

## Key Takeaways

If you're deploying vLLM at production scale, here's what actually matters:

1. **V1 architecture is a step-change improvement.** Prefix caching is default-on, multi-process API server eliminates CPU bottlenecks, 1.7x throughput improvement. Upgrade if you're still on V0.

2. **KV cache fragmentation is real.** p99 drift over 12-24 hours. Solution: FP8 quantization + offloading (if high cache hit rate) or rolling restarts (if low concurrency).

3. **Preemption is a production failure mode.** If you see preemption warnings regularly, you're oversubscribed. Reduce `max_num_seqs` or add capacity. Don't let it slide.

4. **Chunked prefill prevents head-of-line blocking.** Default is 512 tokens per chunk. Tune `max_num_batched_tokens` for your workload. Critical for multi-turn conversations.

5. **Speculative decoding doesn't always help.** Acceptance rate needs to be >70% to break even. Conversational AI with unpredictable responses = 50-60% acceptance = net latency increase. Test with YOUR traffic.

6. **Quantization accuracy degrades non-uniformly.** Rare entities, numeric precision, long-context conversations degrade first. Continuous log analysis catches these before A/B tests.

7. **Little's Law governs your capacity.** Throughput = Concurrent / Latency. To double throughput, either double concurrency (more GPU memory) or halve latency (faster model, better hardware).

8. **Throughput cliffs are multi-subsystem failures.** CPU tokenization + KV fragmentation + network saturation all hit simultaneously. Diagnose with metrics from GPU, CPU, network, memory layers.

9. **Monitor p99 latency, not p50.** Averages hide preemption spikes. Alert on p99 drift (10% over 1 hour) to catch fragmentation early.

10. **Build fallbacks from day 1.** Request queues with timeouts + rule-based responses. Graceful degradation is easier to build upfront than retrofit later.

---

## What Actually Mattered

vLLM gave us the primitives (PagedAttention, continuous batching, prefix caching)
V1 made them production-ready (automatic caching, multi-process server, unified scheduler).

The _production lessons_ came from running it at scale for months. Memory fragmentation creeping up over days. Throughput cliffs at 200-300 concurrent. Quantization degrading rare entities. Speculative decoding backfiring on conversational traffic.

The optimizations that mattered most:
- **Percentile-based alerting** (caught fragmentation 6-8 hours early)
- **Client-side load balancing** (eliminated LB bottleneck, 30-second failover)
- **Graceful degradation** (fallback rate <1% normally, 15-20% during incidents, kept customers served)

Honestly, the biggest lesson is _production inference is a distributed systems problem, not just a model optimization problem_. You need monitoring, load balancing, failover, graceful degradation. The model is one component in a system.

If you're building this, start with the system design (regional vs central, single vs multi-model, monitoring, fallbacks). Then optimize (quantization, offloading, chunked prefill, speculative decoding).

The system design decisions constrain what optimizations are even possible.

---

*(Draft complete)*
