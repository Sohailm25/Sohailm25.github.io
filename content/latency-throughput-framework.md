Title: Latency-Bound vs Throughput-Bound: The Missing Dimension
Date: 2026-02-07 19:00
Category: Thoughts
Slug: latency-throughput-framework
Summary: CAP theorem gives you a lens for distributed systems. There's a missing dimension for infrastructure decisions: whether your system is latency-bound or throughput-bound. Most performance advice assumes one without saying which.

---

We've all frantically gone through Hello Me system design interviews before that critical technical round. We've been bullied into learning CAP theorem early. You can't have consistency, availability, and partition tolerance simultaneously. Pick two. It's a lens that shapes how you think about distributed systems.

Product people learn the speed/quality/cost triangle. You can optimize for two, but the third suffers.

There's a missing dimension for infrastructure decisions that nobody explicitly names: **whether your system is fundamentally latency-bound or throughput-bound.**

Most performance advice implicitly assumes throughput optimization. "Use batching!!!" "Maximize GPU utilization!!" "Connection pooling!!!!"

All throughput-oriented. If you're latency-bound, following this advice is actively harmful.

i didn't have this framework whilst building these systems. The aha came in hindsight (even while writing this piece) looking back at different production environments and recognizing why certain optimizations worked in one context and failed in another.

---

## How to Know Which Bound You're Under

**Latency-bound signals:**

- Hard deadline per request (1.5 seconds for drive-thru AI, sub-100ms for retrieval)
- User waiting synchronously where they feel every millisecond and theres no room for multitasking
- p99 matters more than average
- Individual request failure = user-visible failure

**Throughput-bound signals:**

- Batch processing, async workflows
- Cost per unit matters more than individual latency
- GPU utilization is your north star
- Can tolerate individual slow requests if aggregate improves

The distinction sounds obvious stated plainly. In practice, it's easy to miss because performance advice rarely specifies which paradigm it assumes.

---

## The Cascade Effect

Once you know which bound you're under, it cascades through every decision. This is where the framework becomes useful.

### Latency-Bound: Drive-Thru Inference

At a QSR chain, we had 1.5 seconds end-to-end for the full voice pipeline:

```
Customer speaks → ASR → LLM → TTS → Speaker
├── ASR (speech-to-text):     200-500ms
├── LLM inference:            300-800ms  ← our window
├── TTS (text-to-speech):     100-300ms
├── Network + audio I/O:      100-200ms
└── Total budget:             < 1500ms
```

300-800ms for LLM inference. That's a hard ceiling, not a target to optimize toward. It's a constraint that shapes everything else.

**How latency-bound cascaded through decisions:**

**Batching:** Continuous batching is good for throughput, but it can hurt tail latency. We tuned `max_num_batched_tokens` carefully. Too high and p99 spiked as long prefills blocked other requests. Chunked prefill helped (splitting long prompts into 512-token chunks so decode steps for other customers could interleave).

**Engine routing:** We ran three inference engines simultaneously (vLLM, TensorRT-LLM, and SGLang). During peak hours when latency was critical, requests routed to TensorRT-LLM (lowest TTFT at ~8ms). When system prompts were shared across sessions, SGLang's RadixAttention cached the prefix and cut first-token latency by 60-80%.

**Parallelism:** Tensor parallelism within a single node only. NVLink between GPUs on the same node gives ~600 GB/s. PCIe across nodes gives ~32 GB/s. That's a 19x difference. For throughput-bound training, you can tolerate cross-node communication overhead. For latency-bound inference, you can't.

**Monitoring:** p99 latency alerts, not average throughput. Averages hide the problem completely. We learned this the hard way with memory fragmentation (p99 drifted 5-10% per hour while averages looked fine). By the time we noticed, we were 36 hours into degradation.

**Caching:** Aggressive prefix caching with SGLang. Every drive-thru conversation starts with the same system prompt (menu, hours, promotions). That's 2,000-4,000 tokens repeated across hundreds of concurrent sessions. Cache it once, prefill only the unique tokens per session.

(Full details in [Ray in Production](/ray-production-lessons))

### Throughput-Bound: Distributed Training

Same infrastructure (Ray), completely different optimization strategy.

Training a model on dozens of GPUs is throughput-bound. Individual step latency matters less than aggregate GPU utilization over the training run.

**How throughput-bound cascaded through decisions:**

**Checkpointing:** Every 30 minutes instead of every step. Checkpointing has overhead. In latency-bound systems, you checkpoint frequently because losing one request's progress is user-visible. In throughput-bound training, you batch checkpoints to maximize GPU time. We learned this wrong first (lost 18 hours of PPO training when the driver process died between checkpoints).

**Spot instances:** Worth the interruption risk. Spot instances cost 70% less than on-demand. For latency-bound inference, a spot interruption means dropped customer requests. For throughput-bound training, it means rolling back to the last checkpoint and resuming. Acceptable tradeoff.

**Batching:** Maximize batch size. Fill every GPU. The goal is cost-per-training-hour, not latency-per-step.

**Monitoring:** GPU utilization, not latency percentiles. If GPUs are idle, you're wasting money.

### Mixed Systems: RAG Infrastructure

Here's where it gets tricky. The same codebase can have both bounds.

RAG retrieval at a financial institution: analysts querying for data discovery. The retrieval path was latency-bound (an analyst is waiting, staring at a loading spinner). Sub-100ms for vector retrieval, 10-15 seconds end-to-end for complex agentic queries.

But the embedding pipeline that populated the vector store? Throughput-bound. Batch processing millions of documents overnight. Maximize GPU utilization, minimize cost per document embedded.

Same system, same codebase, different optimization strategies for different paths.

If you apply throughput-oriented batching to the retrieval path, analysts wait longer. If you apply latency-oriented caution to the embedding pipeline, you waste GPU time and money.

(Full details in [RAG Infrastructure at Scale](/rag-infrastructure-pgvector))

---

## Why Performance Advice Contradicts Itself

"Use batching!" and "Batching hurts latency!" are both correct. They assume different bounds.

| Advice | Throughput-Bound | Latency-Bound |
|--------|------------------|---------------|
| "Use batching" | ✅ Maximize batch size | ⚠️ Tune carefully, hurts tail latency |
| "Maximize GPU utilization" | ✅ North star metric | ⚠️ Leave headroom for burst |
| "Connection pooling" | ✅ Reduce overhead | ✅ But size for p99, not average |
| "Cache aggressively" | ✅ Long TTLs acceptable | ⚠️ Freshness often matters more |
| "Retry on failure" | ✅ Eventually consistent | ⚠️ Timeout budget shrinks with each retry |
| "Checkpoint frequently" | ⚠️ Overhead adds up | ✅ Losing progress is visible |

The advice isn't wrong. It's incomplete without specifying which bound it assumes.

---

## The Framework

**Step 1: Identify your constraint.**

Is there a hard latency budget per request? A user waiting synchronously? Then you're latency-bound.

Is aggregate throughput or cost-per-unit your metric? Can you tolerate individual slow requests? Then you're throughput-bound.

**Step 2: Let it cascade.**

Once you know your bound, every other decision follows. Batching strategy, parallelism approach, caching TTLs, retry policies, monitoring metrics. Don't mix advice from the wrong paradigm.

**Step 3: Watch for mixed systems.**

Most real systems have both bounds in different paths. Identify which path you're optimizing. The retrieval path and the indexing path have different constraints even if they share infrastructure.

---

## The Meta-Lesson

i spent three years building these systems without this framework explicit in my head. The decisions were right (you develop intuition in the trenches) but the framework was implicit.

Making it explicit helps in two ways:

1. **Faster decisions.** Instead of rediscovering the tradeoffs each time, you pattern-match to your bound and let the cascade follow.

2. **Better communication.** When someone proposes an optimization, you can ask: "Are we latency-bound or throughput-bound here?" It cuts through a lot of debate.

CAP theorem didn't make distributed systems easier. It gave engineers a shared vocabulary for discussing tradeoffs. 

This is the same. Name the dimension, and the decisions clarify.

---

*Related: [Ray in Production](/ray-production-lessons), [Optimizing vLLM at Production Scale](/vllm-production-scale-lessons), [RAG Infrastructure at Scale](/rag-infrastructure-pgvector)*
