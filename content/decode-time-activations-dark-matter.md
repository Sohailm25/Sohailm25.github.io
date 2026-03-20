Title: Why Prefill-Trained Interpretability Breaks in Decode
Date: 2026-03-20 13:20
Modified: 2026-03-20 18:03
Category: Case Studies
Tags: mechanistic-interpretability, interpretability-infrastructure, saes, activation-steering, inference-systems, reasoning-models
Slug: research/experiments/decode-time-activations-dark-matter
Authors: Sohail Mohammad
Summary: Prefill-trained interpretability dictionaries are routinely deployed in decode-time regimes; this piece argues for a concrete measurement standard for prefill->decode drift before treating steering and monitoring as safety infrastructure.
Status: published

---

i keep seeing the same pattern.

we train SAE dictionaries on prefill activations, then deploy those dictionaries during decode for steering, monitoring, and safety workflows. this is now normal practice. it also hides a core assumption most of us are not measuring directly:

**features learned in prefill transfer cleanly to decode.**

my claim is simple and opinionated: **interpretability at frontier scale is not safety infrastructure until we measure prefill->decode drift explicitly.**

if you want the broader context of how i think about this line of work, i keep related pieces in [/writings/](/writings/), including the experiment logs that informed this post.

## in plain english

here is the non-jargon version.

imagine a student who studies using textbook problems, then is graded on a very different kind of exam.

the student is still smart. the memory is still there. but the question style changed, so performance can drift.

that is basically what is happening here:

- **prefill** is the textbook phase (model reading human-written text)
- **decode** is exam-time improvisation (model generating its own next steps)
- **SAE features** are the study notes we built from textbook behavior

we then use those study notes to judge or steer behavior during exam-time generation.

sometimes this works great. sometimes it misses what changed.

so this piece is arguing for one simple standard: before we call this safety infrastructure, we should measure how much the model's internal behavior drifts from study-time to exam-time.

## why this matters now

for small demos, you can get away with implicit assumptions.

for reasoning models and long-horizon agents, you cannot.

decode is where the important behavior happens: long chain-of-thought traces, tool decisions, multi-step planning, and safety-relevant branching. if your interpretability stack is calibrated on prefill but trusted during decode, your confidence intervals should be different by default.

that is not anti-SAE. i use SAE workflows myself. this is about calibration discipline.

## i am writing this from both sides

on infra: i have run production inference systems where prefill and decode had to be optimized separately because they behave differently at the hardware and scheduler level.

on research: in my persona-circuits work on Llama-3.1-8B-Instruct, i extracted contrastive directions from prefill activations and got robust steering during generation, but negative sufficiency outcomes under stricter tests.

so yeah, this is not abstract philosophy. this is where the paper story and the production story collide.

## prefill vs decode is not just a latency story

everyone knows the basic systems split:

- **prefill is compute-bound** (parallel token processing, high Tensor Core use)
- **decode is memory-bandwidth-bound** (token-by-token, repeated reads from HBM)

in one QSR deployment, this split dictated architecture:

- prefill for 2k to 4k-token prompts sat around 100 to 200ms
- decode sat around 15 to 30ms/token
- prefix caching (SGLang RadixAttention) cut prefill latency by 60 to 80%
- speculative decoding gave mixed outcomes (50 to 60% acceptance on conversational traffic, sometimes worse p50 after draft overhead)

but this is the part people underweight: performance asymmetry is a symptom of representational asymmetry.

during prefill, the model is conditioned on human-written tokens.

during decode, from generated token 1 onward, the model is conditioned on its own sampled outputs.

that is exposure-bias territory. different conditioning distribution, potentially different activation geometry.

## evidence today: strong hints, incomplete measurement

### direct signal: Goodfire R1 observations

Goodfire has already reported strong feature-distribution shift across prompt, thinking trace, and final response in R1-style reasoning behavior.

that is not a tiny footnote. that is three internal regimes under one shared vocabulary.

### indirect signal: generation distribution work

exposure-bias literature and degeneration/anisotropy results keep pointing in the same direction: generated trajectories and human-written trajectories are statistically and representationally different enough to matter locally, even when aggregate metrics look fine.

aggregate 3% gaps can still hide ugly local failures at high-entropy and decision-critical positions.

### production signal: speculative acceptance behavior

i have seen acceptance rates vary materially by domain. code often accepts more than open-ended conversational traffic. that alone suggests decode dynamics are structured in ways our usual training objectives do not fully capture.

## plausible mechanism: outlier behavior can amplify regime mismatch

transformer outlier channels are well documented.

SAE sensitivity to outlier-heavy regions is also documented.

so the hypothesis is straightforward (and still speculative): if decode-time self-conditioning shifts outlier structure at key positions, prefill-trained sparse dictionaries can become miscalibrated exactly where steering confidence matters most.

not guaranteed. not proven. absolutely worth measuring.

## what this changes for steering claims

if prefill and decode diverge materially, then prefill-calibrated steering can drift in at least three ways:

1. **activation-rate drift**: feature sparsity levels move (2% in prefill becomes 0.5% or 5% in decode)
2. **directional drift**: feature directions rotate enough to reduce precision
3. **mechanism split/merge**: one prefill feature maps onto multiple decode-time mechanisms

this is why "it worked in a demo" is weaker than people think for safety framing.

## why this was a live confound in my persona-circuits results

in my own runs, steering signal was real. sufficiency signal was weak to negative.

that leaves two live interpretations:

- i missed causal components (classic incompleteness)
- i extracted components in prefill that do not fully mediate behavior during decode

my current pipeline cannot separate those cleanly.

that ambiguity is the point. if we do not instrument decode drift, we cannot tell whether we are missing components or missing regimes.

for related context on those experiments:

- [Persona Circuits: Progress & Findings](/research/experiments/persona-circuits-current-state/)
- [Inverse Scaling in Activation Steering](https://sohailmo.ai/research/activation-steering/)

## minimum viable measurement standard (what teams should actually run)

not a giant moonshot. a practical stack:

### 1) drift by position

capture matched prefill and decode activations. compare per-layer and per-position stats (mean, variance, kurtosis, outlier frequency).

### 2) reconstruction gap

evaluate prefill-trained SAE reconstruction on prefill vs decode (MSE, explained variance). track drift over generation depth and entropy bands.

### 3) feature overlap

compare top-k active feature sets across regimes (Jaccard, rank correlation).

### 4) steering effect decay

apply the same steering vector at token 1, 10, 50, 200. measure effect-size decay and instability.

### 5) sparse online probes

sample decode activations periodically (or entropy-triggered), compare against a prefill reference profile, and flag high-divergence trajectories.

method caveat: per-dimension KL is a useful diagnostic proxy, not a full joint-geometry proof. use it for triage, not final truth claims.

## the tooling problem is real

most mainstream mech-interp tooling is microscope mode: fixed input, full capture, offline analysis.

decode monitoring is telescope mode: streaming capture, low overhead hooks, KV-aware instrumentation, and alerting logic that does not tank latency.

we have pieces of this. we do not have a clean, common workflow that teams can adopt quickly.

that is an infra gap, not just a research gap.

## closing position

prefill-first capture was a good engineering choice for scale.

it is not enough for the safety claims people now attach to steering and monitoring.

we are still using microscopes calibrated for one room to study another. sometimes that works. sometimes it probably does not. right now we are mostly guessing where that boundary sits.

**if your pipeline cannot report prefill-vs-decode reconstruction drift by position, it is not safety infrastructure yet.**

---

*Code and experiment logs: [github.com/Sohailm25/persona-circuits](https://github.com/Sohailm25/persona-circuits)*

## Related in this trilogy

- [Backpressure Kills Silently: Failure Modes in Heterogeneous-Throughput Capture Pipelines](/research/experiments/backpressure-kills-silently-capture-pipelines/)
- [What Continuous Batching Does to Your Activations (And Why Your SAE Might Not Know)](/research/experiments/continuous-batching-activations-sae/)
- [More writing and research notes](/writings/)
