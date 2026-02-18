Title: Advanced vLLM Deployment, Part 1: Hardware and Stack Choices
Date: 2026-02-18 14:00
Category: Case Studies
Slug: vllm-advanced-deployment-hardware-stack
Summary: GPU selection, inference framework choice, and the upstream decisions that determine what optimizations are even possible in production vLLM deployments.

# Advanced vLLM Deployment, Part 1: Hardware and Stack Choices

*This post reflects patterns and lessons learned from building inference systems at production scale. Technical details have been generalized, and no proprietary information from any specific organization is disclosed.*

<style>
#back-to-toc {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  background: rgba(40, 44, 52, 0.95);
  border: 1px solid rgba(152, 195, 121, 0.3);
  color: #98c379;
  padding: 10px 16px;
  border-radius: 24px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  white-space: nowrap;
}
#back-to-toc.visible {
  opacity: 1;
  pointer-events: auto;
}
#back-to-toc:hover {
  background: rgba(50, 54, 62, 0.98);
  border-color: #98c379;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  transform: translateX(-50%) translateY(-1px);
}
@media (max-width: 768px) {
  #back-to-toc {
    font-size: 12px;
    padding: 9px 14px;
  }
}
</style>

<a href="#table-of-contents" id="back-to-toc">↑ Back to Contents</a>

<script>
window.addEventListener('scroll', function() {
  var btn = document.getElementById('back-to-toc');
  if (window.scrollY > 500) {
    btn.classList.add('visible');
  } else {
    btn.classList.remove('visible');
  }
});
</script>

<div id="table-of-contents"></div>

**Table of Contents:**

1. [Hardware First](#hardware-first)
2. [GPU Selection Framework](#gpu-selection-framework)
3. [KV Cache Eviction Under Mixed Workloads](#kv-cache-eviction-under-mixed-workloads)
4. [Stack Choices: vLLM vs TRT-LLM vs SGLang](#stack-choices)
5. [Production Gotchas When You Ship vLLM](#production-gotchas-when-you-ship-vllm)

---

In my [previous article](https://sohailmo.ai/vllm-production-scale-lessons), i covered the production nuances of running vLLM (KV cache fragmentation, chunked prefill, the throughput cliff). But i glossed over the decisions that came *before* those optimizations: which GPU to buy, which inference stack to use.

Four infrastructure decisions determine what's even possible when you deploy: hardware, stack, parallelism, and custom silicon. Each one constrains the next. Get hardware wrong and your framework options narrow. Choose the wrong framework and your parallelism strategies shift. Make a parallelism mistake and custom silicon stops making economic sense.

Here's what building those decisions looked like across three real deployments.

---

## Hardware First {#hardware-first}

We deployed conversational AI across 100+ QSR locations, each with a single T4 GPU. The model was Qwen2.5-7B quantized to INT4 (~3.6GB), well within the T4's 16GB. Latency looked good in testing. We shipped it.

Two weeks in, i noticed p99 latency spiking during lunch rush. Not catastrophic (150ms instead of 80ms) but enough to make the drive-thru experience feel sluggish. The pattern was weird: spikes would start around 11:30am, persist through 1pm, then linger for another 20-30 minutes even after traffic dropped. Classic load-related issue, right?

i pulled up `nvidia-smi` on a few stores during peak hours. Temperature: 83°C. Clock speed: throttled. The T4 was hitting its thermal limit.

Here's what i didn't expect: the ambient temperature in a QSR kitchen is 30-35°C. The T4's thermal throttle threshold is 83°C. That's only 48-53°C of headroom. Under sustained inference load during lunch rush, the GPU was cooking itself.

The hysteresis is what really hurt. The T4 throttles at 83°C but doesn't unthrottle until it cools to 78°C. So even after the lunch rush ended and request volume dropped, the GPU was still throttled. Sitting at 80°C, below the throttle threshold but above the unthrottle threshold, running at reduced clocks. This created a sawtooth throughput pattern where performance didn't recover until the GPU fully cooled, which could take 30+ minutes in poor airflow.

i ran this to confirm:

```bash
nvidia-smi --query-gpu=temperature.gpu,clocks_throttle_reasons.sw_thermal_slowdown,clocks_throttle_reasons.hw_thermal_slowdown --format=csv
```

Throttle reason `0x0000000000000020` (SW Thermal Slowdown) was active on 40+ stores during peak. Not gonna lie this can be hard to catch if you're only looking at request latency metrics and not GPU telemetry. 40+ simultaneous locations throttled, and the dashboards looked fine until someone noticed the drive-thru times creeping up.

The fix: `nvidia-smi -pl 60`. This caps the T4's power limit from 70W to 60W. You trade ~15% peak performance for thermal stability. The GPU runs cooler under load, stays below the throttle threshold, and delivers consistent latency. We pushed this config to all stores and p99 stabilized.

That deployment taught me something i've carried into every infrastructure decision since: **your production environment constrains your hardware choices more than benchmarks do**. The T4 looked great in testing. It failed in production because we didn't account for ambient temperature in retail kitchens.

Edge deployment constraints aren't just about network latency. They're about physical environment. A T4 in a data center with active cooling is a different beast than a T4 in a passively cooled enclosure sitting next to a fryer. If you're deploying to retail, industrial, or edge locations, thermal management is a first-class concern.

### The GPU Selection Framework {#gpu-selection-framework}

The T4 story highlights a broader point: GPU selection is about constraints, not just specs. Here's the decision tree i wish i'd had before deploying.

#### When T4 Wins

T4 makes sense when:
- Your model fits in 16GB after quantization (≤7B INT4, ≤3B FP16)
- You're deploying to edge locations with passive cooling
- Cost per location matters more than throughput per GPU
- You can tolerate 25-35 tokens/sec at batch=1

The counterintuitive finding: **T4 is the cheapest per token for small models**. At batch=32, a T4 delivers ~250 tokens/sec. At $0.20/hr (RunPod pricing), that's ~$0.22 per 1M tokens. An A100 at ~900 tokens/sec and $1.59/hr costs ~$0.49 per 1M tokens. The H100 at about 2200 tokens/sec and $3.99/hr costs ~$0.50 per 1M tokens.

If your model fits and your latency budget allows, T4 wins on cost. The thermal throttling issue is solvable with power capping. The real constraint is memory. Once you need more than 16GB, you're forced up the stack.

#### When A100 Wins

A100 (80GB) makes sense when:
- You're serving multiple models simultaneously
- Your model is 13-70B and doesn't fit on T4
- You need research flexibility (swap models without redeploying hardware)
- Throughput matters more than cost per token

The A100's 2,039 GB/s memory bandwidth (vs T4's 320 GB/s) directly translates to better inter-token latency. Autoregressive decode is memory-bandwidth-bound. You're loading model weights from HBM every token. The A100's 6.4x bandwidth advantage over T4 means proportionally better ITL.

At batch=32, an A100 delivers ~900 tokens/sec. That's 3.6x the T4's throughput. If you're running a regional hub serving 20-30 concurrent requests, the A100's higher absolute throughput justifies the higher cost.

#### When H100 Wins

H100 makes sense when:
- You need maximum throughput at scale
- You're using FP8 quantization (H100 has native FP8 Tensor Cores)
- You're running large batch production workloads (batch=64+)
- Cost per token matters less than requests per second

The H100's 3,350 GB/s bandwidth (SXM) or 2,000 GB/s (PCIe) is 10.5x or 6.25x the T4's bandwidth. At batch=32, an H100 delivers ~2200 tokens/sec (8.8x the T4). The cost per token is similar to the A100 (~$0.50/1M), but the absolute throughput is 2.4x higher.

One detail worth knowing: **H100 PCIe vs SXM for inference**. The PCIe variant delivers 85-90% of SXM performance at significantly lower cost and power (350W vs 700W). For single-GPU inference, PCIe is often the better value. SXM's NVLink advantage matters for multi-GPU training, not single-model inference.

#### The Decision Tree

**Does your model fit in 16GB after quantization?**
- Yes → Consider T4 if cost-constrained or edge deployment
- No → A100 or H100

**Are you serving multiple models or need research flexibility?**
- Yes → A100 (80GB gives you headroom)
- No → Continue

**Is your workload throughput-bound (batch=32+) or latency-bound (batch=1-8)?**
- Throughput-bound → H100
- Latency-bound → A100 or T4 depending on model size

**Are you deploying to edge locations with thermal constraints?**
- Yes → T4 with power capping
- No → A100 or H100

This is as of early 2025. GPU pricing and availability shift constantly. The framework holds, but run the numbers for your specific deployment.

### Bandwidth is Destiny

The spec that matters most for inference: memory bandwidth. Not CUDA cores. Not Tensor Cores. Not even FP8 support (though that helps).

Every token generated requires loading the entire model's weights from HBM. For a 7B FP16 model, that's ~14GB of data per token. At 320 GB/s (T4), you're limited to ~23 tokens/sec theoretical max. At 2,039 GB/s (A100), you're at ~146 tokens/sec. At 3,350 GB/s (H100 SXM), you're at ~239 tokens/sec.

Real-world performance is lower due to kernel overhead, memory access patterns, and batch size effects. But the bandwidth ceiling is the hard limit. This is why the H100's 10.5x bandwidth advantage over T4 directly maps to ITL improvement.

Batch size changes the bottleneck. At batch=1, you're memory-bandwidth-bound. At batch=32+, you're compute-bound (Tensor Cores matter). At batch=128+, you're often scheduler-bound (vLLM's continuous batching overhead). The GPU you choose determines which regime you're operating in.

### Cost Per Token Table

Here's the math that determines your infrastructure budget (as of early 2025, cloud pricing shifts constantly):

| GPU | tokens/sec (batch=32) | $/hr (RunPod) | $/1M tokens |
|-----|----------------------|---------------|-------------|
| T4 | ~250 | $0.20 | ~$0.22 |
| A100 80GB | ~900 | $1.59 | ~$0.49 |
| H100 | ~2200 | $3.99 | ~$0.50 |

For comparison, Together.ai charges $0.18/1M tokens for Llama 3.1 8B (serverless). Self-hosted T4 is competitive. Self-hosted A100/H100 is 2-3x more expensive per token but gives you control, lower latency (no network hop), and the ability to run custom models.

Hardware selection is an economic decision, not just a technical one. At 1B tokens/day, the difference between $0.22 and $0.49 per 1M tokens is $80k/year vs $179k/year. The T4's thermal constraints are worth solving for that delta.

And here's what most people miss: the GPU you choose determines which optimizations are even possible. T4 forces you into quantization (16GB limit). A100 gives you multi-model flexibility. H100 unlocks FP8 native. The hardware decision cascades into every downstream choice.

### KV Cache Eviction Under Mixed Workloads {#kv-cache-eviction-under-mixed-workloads}

One more failure mode the GPU specs don't tell you about: KV cache eviction cascades.

In any deployment mixing short requests (chat, classification, sub-4k tokens) with long-context requests (RAG, summarization, 32k+), the KV cache becomes a shared resource under contention. When a long-context request arrives and GPU memory is near capacity, vLLM evicts blocks from other requests to make room. If those evicted blocks contain a cached system prompt shared across many short requests, all of those short requests have to re-prefill. Re-prefill consumes compute. The long request might get preempted again in the meantime. The cycle repeats.

Neither workload class completes efficiently. The monitoring signal is subtle: `gpu_cache_usage_perc` near 100% while `num_preemptions` spikes and `num_requests_running` drops simultaneously. Standard latency dashboards look bad but don't tell you why.

The fix isn't always more GPU memory. It's routing. A gateway layer that routes by request length (short context to one vLLM pool, long context to another) gives you separate cache pools and eliminates the cascade entirely. We ended up implementing this at the financial institution's RAG deployment after diagnosing this exact pattern.

This has real implications for hardware sizing. A T4 with 16GB handling genuinely mixed request lengths will hit this. An A100 with 80GB has more headroom but will hit it too at scale. The right answer is hardware sizing PLUS workload routing, not just bigger GPUs.

Monitor with: `vllm:num_preemptions` correlated with `vllm:gpu_cache_usage`. A spike in preemptions at high cache usage means cascade, not load.

---

## Stack Choices {#stack-choices}

Hardware chosen, the next question was which inference framework to run on it.

We evaluated TensorRT-LLM for the QSR edge deployment. The numbers were compelling: 21,413 tokens/sec for Llama 3.1 8B in FP8 on an H100. NVIDIA's kernel fusion and FP8 optimizations are legitimately impressive. For raw throughput on a single model configuration, TRT-LLM is unmatched.

What attracted us initially was the promise of maximum performance. We were deploying to 100+ locations, and every millisecond of latency mattered for the drive-thru experience. TRT-LLM's pre-compiled engines looked like the finishing move. Squeeze every drop of performance out of the hardware.

What killed it was the compilation step. TRT-LLM requires pre-built engines for every model configuration. That means every time you change the model, you recompile. Every time you adjust batch size or sequence length, you recompile. For a 100+ location rollout where we were iterating on models weekly, this was a non-starter.

The decision moment came when we mapped out the operational reality. We were testing Qwen2.5-3B, 7B, and 14B variants. We were experimenting with quantization. We were tuning system prompts. Each change would require recompiling engines and pushing them to 100+ edge devices. (lmao imagine deploying a model update and blocking on engine compilation for every location before any of them can run the new version.)

Debugging was the other issue. When something goes wrong with a pre-compiled engine, you're staring at CUDA errors with limited visibility into what's happening. vLLM's Python-first architecture meant we could add logging, inspect state, and iterate quickly.

We chose vLLM. Model iteration speed mattered more than peak throughput for a 100+ location rollout.

**TRT-LLM is a finishing move, not a starting move.** If you have a stable model, fixed configuration, and maximum performance is the priority, TRT-LLM is the right choice. But if you're still iterating (and most teams are), the compilation overhead will slow you down more than the performance gains help.

### Decision Framework

Most framework comparisons are written by framework maintainers, so you get a lot of "it depends" hedging. Four branching questions cut through it:

**1. How often do you change models?**
- Weekly or more → vLLM (no compilation, swap models instantly)
- Monthly → Consider TRT-LLM if performance justifies compilation overhead
- Rarely (quarterly+) → TRT-LLM is viable, compilation is one-time cost

**2. Single model or multi-model serving?**
- Multi-model → vLLM (dynamic batching across models, no engine per model)
- Single model → Any framework works, but TRT-LLM has edge if stable

**3. Complex LLM programs (agents, tree-of-thought, multi-step reasoning)?**
- Yes → SGLang (RadixAttention gives 5x throughput on ReAct agent tasks)
- No → vLLM or TRT-LLM depending on iteration speed needs

**4. Hardware vendor lock-in acceptable?**
- NVIDIA only → TRT-LLM is fine, you're already locked in
- Multi-vendor (AMD, AWS Inferentia, future chips) → vLLM or SGLang (broader hardware support)

#### SGLang: The Agent Workload Specialist

SGLang is the framework most people haven't heard of but should know about. It's built for complex LLM programs (agents, tree-of-thought, multi-turn reasoning). The key innovation is **RadixAttention**, which automatically reuses KV cache across different execution paths.

For ReAct agent tasks, SGLang gets 5x throughput vs vLLM. For DeepSeek MLA models, it's 7x. Different performance class entirely.

Why? Agent workloads have massive KV cache reuse. You're running the same system prompt, the same tool definitions, the same reasoning steps across multiple branches. RadixAttention builds a prefix tree and shares cache blocks automatically. vLLM's prefix caching requires identical prefixes; SGLang handles partial overlaps.

SGLang powers LMSYS Chatbot Arena. If you're building agent platforms (and i am now in my current role), SGLang is the framework to watch. As agent workloads grow, the 5x throughput advantage becomes the difference between viable and unviable.

#### Benchmark Reality Check

Numbers as of early 2025:

**TensorRT-LLM:**
- Llama 3.1 8B FP8 on H100: 21,413 tok/sec
- Maximum throughput for single-model, fixed-config deployments
- Compilation overhead: 10-30 minutes per model configuration

**vLLM:**
- v0.6.0: 2.7x throughput improvement over v0.5.3 on Llama 8B
- Zero compilation, instant model swaps
- 70.5k GitHub stars, 200+ supported models

**SGLang:**
- 7x throughput on DeepSeek MLA models
- 5x on ReAct agent tasks vs vLLM
- RadixAttention: automatic KV cache reuse across execution paths

The raw numbers favor TRT-LLM for single-model throughput. But throughput isn't the only metric. Iteration speed, operational complexity, and workload characteristics matter more in production.

### Migration Cost Matrix

Switching frameworks isn't free. Here's what you're signing up for:

**API Layer:**
- vLLM → TRT-LLM: Rewrite serving layer, different API contracts
- vLLM → SGLang: Mostly compatible, but agent-specific features require refactor
- TRT-LLM → vLLM: Rip out engine compilation, rebuild deployment pipeline

**Deployment Scripts:**
- TRT-LLM: Engine compilation step in CI/CD, artifact storage for engines
- vLLM: Model weights only, simpler pipeline
- SGLang: Similar to vLLM, but agent program definitions need versioning

**Monitoring:**
- TRT-LLM: Engine-level metrics, less visibility into internals
- vLLM: Rich Python-level metrics, easy to add custom instrumentation
- SGLang: Prefix tree hit rates, agent-specific metrics

**Model Artifacts:**
- TRT-LLM: Engines are hardware-specific (H100 engine won't run on A100)
- vLLM/SGLang: Model weights are portable across hardware

The hidden cost is **organizational learning**. Your team knows one framework. Switching means relearning failure modes, debugging techniques, and performance tuning. Only switch if the performance or feature gap is significant.

### What i'd Choose Today

If i were starting the QSR deployment today, i'd still choose vLLM for the same reasons: model iteration speed during a 100+ location rollout. The ability to swap models without recompilation was worth more than TRT-LLM's throughput advantage.

But if i were deploying a stable model at massive scale (say, 10,000+ requests/sec on a single model that won't change for 6 months), i'd seriously consider TRT-LLM. The compilation overhead becomes negligible, and the 21K tok/sec throughput pays for itself.

For the agent platform work i'm doing now in my current role, SGLang is the framework i'm watching. The 5x throughput on agent tasks isn't hype. It's the difference between agents that feel responsive and agents that feel sluggish.

**Framework choice is a system design decision, not a performance optimization.** Choose based on your operational constraints (iteration speed, multi-model, agent workloads) first. Optimize for throughput second.

### Production Gotchas When You Ship vLLM {#production-gotchas-when-you-ship-vllm}

Two vLLM issues that didn't show up during framework evaluation but bit us in production.

**V0 to V1 migration.** vLLM V1 (default in 0.8.0+) changed preemption behavior in a way that isn't obvious from the changelog. V0 handled memory pressure by *swapping* KV cache blocks to CPU RAM. V1 defaults to *recompute*: evict the blocks, restart that request's prefill from scratch when resources free up.

If your workloads survived load spikes because V0 quietly swapped blocks to CPU, V1 will now burn GPU compute recomputing instead. Your P99 latency will show it in ways that are confusing to diagnose because the request didn't fail, it just got mysteriously slow.

Also: `num_scheduler_steps` and `multi_step_stream_outputs` from V0 configs behave differently or get ignored in V1's async scheduler. Clean those from your config before migrating or they'll cause weird interactions. There's a `VLLM_USE_V1=0` escape hatch if V1 instability is blocking production, but it's deprecated and will eventually disappear.

**CUDA graph capture failures with TP.** When vLLM starts up, it captures CUDA graphs (pre-compiled execution traces that reduce kernel launch overhead). With tensor parallelism, this capture process requires stable, fixed memory addresses for all kernel arguments. NCCL communicator buffers combined with graph capture overhead can exceed available VRAM if `gpu_memory_utilization` is at the default 0.90.

Manifests as `cudaErrorIllegalAddress` on startup or a hang during "Capturing CUDA graphs" with no useful error message. Not gonna lie, i spent an embarrassingly long time on this before finding the fix.

First diagnostic: `--enforce-eager`. Disables CUDA graphs entirely. 10-20% throughput hit, but stable. If that resolves the hang, reduce `gpu_memory_utilization` to 0.80-0.85 and try re-enabling graphs. If they still hang, add `--disable-custom-all-reduce` to switch to standard PyTorch primitives instead of custom NCCL kernels inside the graph (slower but more robust on complex hardware configs).

---

Hardware and stack are the decisions you make before the first request is served. In Part 2: what happens when the model doesn't fit on one GPU, and whether NVIDIA is even the right call at scale.

---

*If you're building inference systems and this resonated, i'm always happy to talk shop. My experience spans edge deployments to enterprise-scale agent platforms, and the interesting problems are always where systems engineering meets ML. You can find me at [sohailmo.ai](https://sohailmo.ai) or on LinkedIn.*

