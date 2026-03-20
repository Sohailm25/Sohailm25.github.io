Title: KV Cache Drift and the Interpretability Blind Spot
Date: 2026-03-20 16:35
Modified: 2026-03-20 18:03
Category: Case Studies
Tags: mechanistic-interpretability, kv-cache, inference-systems, saes, activation-steering, reasoning-models
Slug: research/experiments/consistency-model-kv-cache-interpretability-blind-spot
Authors: Sohail Mohammad
Summary: KV cache research and interpretability research are measuring the same prefill->decode shift from different angles. This post argues for a shared consistency-model framing and a concrete decode-aware measurement agenda.
Status: published

---

two communities are studying the same failure mode and mostly not citing each other.

- inference systems people call it query inconsistency in KV cache eviction
- interpretability people call it feature drift across prompt, thinking trace, and response

same shift. different vocabulary.

the systems side has been quantifying it aggressively. LAQ (Lookahead Q-Cache), DapQ, and LookaheadKV all target the same core issue: prefill-time attention patterns do not reliably predict decode-time importance.

meanwhile, interpretability workflows still train SAEs mostly on prefill activations and apply them during decode for steering and monitoring.

that should make you uncomfortable.

if you want my broader writing/research context, it is all linked in [/writings/](/writings/).

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

## the framing that makes this obvious

i think the right bridge concept is a **consistency model** in the distributed-systems sense.

not the diffusion-model meaning of consistency models. not output-level consistency metrics. i mean: what guarantees do we have across computational phases?

for transformers in autoregressive inference:

**the KV cache provides strong data consistency but weak query-distribution consistency.**

that sounds abstract, but it is practical.

### 1) strong data consistency

KV entries are append-only and immutable once computed.

position 47 stays position 47 whether you are at decode step 48 or 500. this is stable and reliable.

### 2) snapshot-isolated prefix behavior

with prefix caching, multiple generations branch from a shared frozen prefix and then append private histories. conceptually, this is copy-on-write behavior.

### 3) weak query-distribution consistency

this is the blind spot.

during prefill, queries are conditioned on human-written tokens.

during decode, queries are conditioned on model-generated tokens and evolving positional geometry.

the data store is stable, but the query workload drifts.

## this is not speculative anymore

LAQ made this painfully concrete: using prefill-stage signals for decode-time cache decisions leaves measurable performance on the table under constrained memory.

DapQ pushes further with a strong positional claim (where matters more than what): decode alignment depends heavily on positional encoding evolution, not only token semantics.

that matters for interpretability because if positional geometry is a first-order driver, then even "good" prefill features can be miscalibrated in late decode.

Goodfire independently observed a related effect from the interpretability side: feature distributions differ across prompt, reasoning trace, and final response, and steering behavior is phase-sensitive.

you do not need perfect cross-paper agreement to see the shape here.

the gap is real enough to change outcomes.

## why this should change how we talk about SAEs

i am not arguing SAEs are bad.

i am arguing the default deployment story is under-calibrated.

we train dictionaries in one regime and trust them in another regime without routinely reporting drift diagnostics.

that is fine for exploratory work.

it is weak for safety infrastructure claims.

three concrete consequences:

1. **feature calibration drift**
   prefill sparsity/activation rates do not necessarily hold in decode.

2. **steering reliability drift**
   a vector that behaves cleanly at early decode can decay, rotate, or invert later.

3. **monitoring sensitivity drift**
   monitors tuned to prefill structure likely catch blunt failures but can miss subtle regime-specific failures.

## the practical opportunity: use KV mechanics as an interp primitive

systems engineers already compute attention over the full cache at each decode step.

that means the raw ingredients for decode-native monitoring already exist in the serving path.

so instead of only asking "which SAE feature fired," we should also ask:

- how attention entropy evolves step to step
- whether top-attended regions jump (phase transitions)
- how much mass stays on prefix vs generated history
- whether trajectory signatures shift before output quality collapses

this is cheap compared to heavyweight post-hoc analysis because these statistics come from values already computed during inference.

## what i would run next (minimum viable plan)

if this were my production interp roadmap this quarter:

### A) add decode attention telemetry

log per-step entropy, top-k attention positions, and prefix-vs-generated mass.

### B) run reconstruction drift checks

take a prefill-trained SAE and evaluate reconstruction quality at decode step 1, 8, 50, 200.

### C) compare feature overlap across regimes

track top-k feature-set overlap and rank stability between prefill and decode.

### D) measure steering effect decay by depth

apply identical steering at multiple decode depths and quantify effect-size degradation.

### E) test hybrid SAE training data

run a mixed prefill/decode corpus variant and compare monitoring + steering stability to prefill-only.

none of this requires waiting for a new paradigm. it is engineering and measurement discipline.

## why this piece is opinionated

because the field is drifting toward stronger claims than the measurement stack currently supports.

"it works in practice" is a useful start.

"we know where it fails and can detect when we cross that boundary" is what safety infrastructure actually requires.

right now, we are closer to the first statement than the second.

## closing

the interesting part is not that one community is right and the other is wrong.

the interesting part is that both communities found the same crack from different directions.

KV cache folks quantified the crack as query inconsistency.

interpretability folks observed the crack as regime-dependent feature behavior.

we should stop treating those as separate stories.

if your interpretability pipeline has no decode-regime calibration report, you are shipping with an unmeasured consistency assumption.

and eventually that assumption will bill you.

---

## Related posts

- [Decode-Time Activations Are the Dark Matter of Interpretability Infrastructure](/research/experiments/decode-time-activations-dark-matter/)
- [What Continuous Batching Does to Your Activations (And Why Your SAE Might Not Know)](/research/experiments/continuous-batching-activations-sae/)
- [Backpressure Kills Silently: Failure Modes in Heterogeneous-Throughput Capture Pipelines](/research/experiments/backpressure-kills-silently-capture-pipelines/)
- [Persona Circuits: Progress & Findings](/research/experiments/persona-circuits-current-state/)
- [More writing and essays](/writings/)
