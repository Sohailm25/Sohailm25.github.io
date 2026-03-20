Title: Backpressure Kills Silently: Failure Modes in Heterogeneous-Throughput Capture Pipelines
Date: 2026-03-20 13:24
Modified: 2026-03-20 16:45
Category: Case Studies
Tags: interpretability-infrastructure, data-pipelines, systems, saes, activation-capture, reliability
Slug: research/experiments/backpressure-kills-silently-capture-pipelines
Authors: Sohail Mohammad
Summary: Activation-capture pipelines can look healthy in steady state while silently dropping the most informative samples under transient pressure; this piece maps the main failure cascades and proposes practical instrumentation.
Status: published

---

Goodfire’s write-up on harvesting billions of activations from frontier models presents a clean three-stage asynchronous design: GPU staging buffer, sidecar D2H transfer, CPU writer/compression to disk. It’s a strong architecture.

This piece is about what happens when reality stops being steady-state.

Across production inference, Ray data systems, and distributed training, I keep seeing the same pattern: when pipeline stages run at different effective speeds, transient pressure turns buffers into bias generators. The pipeline keeps running. Aggregate metrics still look good. But drops become correlated with data properties.

**Core claim:** for activation harvesting, backpressure-induced drops are often **MNAR** (missing not at random), which can systematically bias SAE training toward easy/common activations and away from rare/high-information ones.

## in plain english

here is the non-jargon version.

imagine filming a football game, but your camera drops frames only during the fastest, most chaotic plays.

you still get plenty of footage, and the recording looks mostly fine.

but the exact moments you miss are the ones that mattered most.

that is what backpressure does in activation pipelines:

- the system looks healthy on average
- under bursts, buffers overflow and something gets dropped
- drops are usually not random, so your dataset skews quietly

so this is less about "did we collect a lot of data" and more about "did we systematically miss the hard cases."

---

## The three throughput mismatches

### Stage 1  -  GPU forward pass → GPU staging buffer
Device-to-device copy in HBM is usually not the limiter. Preallocated pools avoid allocator jitter. Metadata records are tiny.

### Stage 2  -  GPU staging → pinned CPU memory
D2H over PCIe is slower and burst-sensitive. Practical throughput is good, but no longer “free.” Correctness depends on pinned memory + explicit event discipline.

Reference numbers worth grounding here: PCIe Gen4 x16 is ~31.5 GB/s theoretical after encoding overhead; real-world 25–27 GB/s transfer rates are still excellent practical efficiency.

### Stage 3  -  CPU path (reshape/provenance/compress) → disk
This is where most pipelines become adversarial under load:

- variable batch sizes
- variable compression work per tensor
- variable filesystem/device latency
- background SSD garbage collection

Averages hide this. Bursts expose it.

---

## Why average disk numbers are misleading

Goodfire-scale capture rates can look comfortable on paper per node. But writer load is bursty, not smooth. Consumer NVMe SLC caches can absorb short bursts and then collapse into lower sustained rates; enterprise media is better, but still exhibits periodic stalls/GC effects. For example, consumer 990 Pro-class behavior can show a steep post-cache drop (commonly into roughly ~1.4–1.8 GB/s ranges depending on SKU/test), while enterprise PM9A3 numbers vary materially by form factor and benchmark method.

So the relevant question is not “is mean write bandwidth enough?” It is:

> Can the writer absorb worst-case burst duration without causing upstream queue saturation?

If not, your queueing policy becomes your sampling policy.

---

## Compression is a systems tradeoff, not just a storage win

bf16 streams are compressible enough to matter, especially with exponent-aware approaches. That saves serious I/O and storage. But compression introduces CPU variance exactly where your pipeline is already vulnerable.

Practical design choice:
- **Inline compression:** better steady-state bytes, more latency variance in the writer.
- **Raw write + offline compression:** larger footprint, cleaner capture-time timing.

A robust compromise is a bounded compressed-output path with graceful fallback to raw blocks + metadata flag for later recompression when compression lag exceeds threshold.

---

## Ring-buffer saturation is the fork in the road

When upstream outpaces downstream and the ring fills, you eventually choose one of three policies:

1. **Block producer** (protect integrity, sacrifice throughput)
2. **Drop oldest** (preserve recency, risk partial temporal bias)
3. **Drop newest** (preserve continuity of already-enqueued work)

There is no free default. But pretending saturation “won’t happen” is the worst option.

In activation capture, blocking can idle expensive GPU paths; dropping can silently bias the sample. Either way, this is a first-class design decision and should be explicit in both code and docs.

---

## Why correlated drops are dangerous for interpretability

Random loss (MCAR) is usually tolerable at low rates. Correlated loss (MNAR) is different:

- larger batches are more likely to drop
- longer contexts are more likely to drop
- harder-to-compress payloads are more likely to drop

Those properties are not neutral. They often track the exact slices where representations are richer, less frequent, or safety-relevant. So a “99.5% capture rate” can still produce a qualitatively biased dataset.

This is how pipelines fail silently in science: metrics say healthy, distribution says skewed.

---

## Failure cascade (typical shape)

A representative cascade under transient I/O pressure:

1. disk stall / GC pause
2. writer falls behind
3. pinned-memory backlog grows
4. sidecar blocks or lags
5. ring fills
6. producer blocks or drops begin

Every component can be individually correct. The failure is in cross-stage coupling under burst.

---

## What to measure (minimum instrumentation)

If you only add five things, add these:

1. **Drop logs with metadata** (batch size, token count, timestamp, path reason)
2. **Drop probability vs batch properties** (monotonicity check)
3. **Captured vs source distribution checks** (length/tokens/complexity)
4. **Time-local capture-rate traces** (not just global average)
5. **Queue occupancy histograms + stall events** per stage

If drop probability rises with workload intensity, you are in MNAR territory.

### Minimal observability schema (recommended)

- `drop_reason` (queue_full, writer_timeout, dma_backpressure, etc.)
- `batch_tokens`
- `max_seq_len`
- `queue_depth_stage1/2/3`
- `disk_write_latency_p99`
- `compression_backlog_bytes`
- `cache_hit_ratio` (if prefix caching is enabled)

---

## Practical design guidance

1. **Instrument drops, not only throughput.**  
   Throughput tells you what survived; science needs to know what vanished.

2. **Size for burst, not mean.**  
   Buffer for transient peaks (e.g., several seconds at high-percentile ingress), not average rate.

3. **Choose and document an explicit overflow policy.**  
   Hidden defaults become hidden sampling bias.

4. **Stress with adversarial distributions.**  
   Uniform synthetic traffic is a false comfort. Include realistic long-tail sequence mixes.

5. **Separate failure domains where possible.**  
   Isolate activation write path from unrelated host pressure (OS temp, swap, logs, etc.).

---

## Confidence labels on the core claims

- **Observed:** transient saturation happens in heterogeneous-throughput pipelines.  
- **Observed:** queue policy determines which data is lost when pressure occurs.  
- **Suggestive:** activation-capture drops are often correlated with workload intensity.  
- **Speculative (but testable):** these correlated drops can degrade SAE quality specifically on rare/high-information regimes.

**Evidence-quality note:** All hard numbers should be treated as source-bounded, with model/SKU/form-factor caveats preserved (especially for SSD sustained-write claims and compression throughput estimates).

---

## What remains open

I don’t yet have a universal “correct” buffer size or queue policy for trillion-parameter capture - those are deployment-specific and workload-specific.

I also don’t think the right stance is alarmist. Good teams likely carry hidden margins and unpublished mitigations. The point is simpler:

> if your pipeline cannot prove that losses are either negligible or statistically non-correlated with sample properties, you don’t yet know what dataset you trained on.

For interpretability infrastructure, that’s not a minor ops detail. It is part of claim validity.

---

*Related: [Ray in Production: What Dozens of GPUs and a Lot of 3am Pages Taught Me](https://sohailmo.ai/ray-production-lessons/)*  
*Related: [Optimizing vLLM at Production Scale](https://sohailmo.ai/vllm-production-scale-lessons/)*

## Related in this trilogy

- [Decode-Time Activations Are the Dark Matter of Interpretability Infrastructure](/research/experiments/decode-time-activations-dark-matter/)
- [What Continuous Batching Does to Your Activations (And Why Your SAE Might Not Know)](/research/experiments/continuous-batching-activations-sae/)
