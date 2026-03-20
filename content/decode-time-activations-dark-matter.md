Title: Decode-Time Activations Are the Dark Matter of Interpretability Infrastructure
Date: 2026-03-20 13:20
Modified: 2026-03-20 13:20
Category: Research
Tags: mechanistic-interpretability, interpretability-infrastructure, saes, activation-steering, inference-systems, reasoning-models
Slug: research/experiments/decode-time-activations-dark-matter
Authors: Sohail Mohammad
Summary: Prefill-trained interpretability dictionaries are routinely deployed in decode-time regimes; this piece argues for a concrete measurement standard for prefill→decode drift before treating steering/monitoring as safety infrastructure.
Status: draft

---

Interpretability infrastructure is currently built on a quiet assumption: **features learned from prefill activations transfer cleanly to decode-time generation**.

Most SAE training pipelines collect activations during forward passes over text corpora (prefill). Most high-stakes use cases—steering, monitoring, safety classification—happen during autoregressive generation (decode). We use dictionaries trained in one regime to intervene in another.

**Core claim:** *Interpretability at frontier scale fails as safety infrastructure unless we explicitly measure how prefill-trained feature dictionaries degrade under decode-time dynamics.*

I’m writing this from both sides of the boundary. On the infrastructure side, I’ve run production inference systems where prefill and decode had to be optimized separately because they behave differently at the systems level. On the research side, my persona-circuits work on Llama-3.1-8B-Instruct found negative sufficiency results despite successful steering—exactly the kind of discrepancy this regime gap could confound.

I’m not claiming current methods are broken. I’m claiming we need a measurement standard for where they hold and where they fail.

## Why prefill and decode are different computational regimes

The systems distinction is familiar:

- **Prefill is compute-bound** (parallel token processing, high Tensor Core utilization)
- **Decode is memory-bandwidth-bound** (token-by-token, repeated weight reads from HBM)

At a QSR deployment where I ran three engines concurrently, this split dictated architecture. Prefill latency scaled with prompt length (2k–4k token system prompts: ~100–200ms). Decode sat around ~15–30ms/token, mostly insensitive to context length, limited by bandwidth. Prefix caching (SGLang RadixAttention) reduced prefill latency by 60–80%. Speculative decoding had mixed returns: 50–60% acceptance on conversational traffic, and higher p50 in some cases due to draft overhead.

But this is not just a performance story. It is a **representation story**.

- In **prefill**, activations are conditioned on human-written sequence tokens.
- In **decode**, activations are conditioned on the model’s own sampled outputs from step 1 onward.

That is exposure-bias territory: training-time conditioning and generation-time conditioning are distributionally distinct. The operational question is no longer “does steering work sometimes?” but “how much representational drift do we incur, where, and with what safety implications?”

## What evidence exists today

### 1) Goodfire’s R1 observations  
**Confidence: Observed**

Goodfire reports strong feature-distribution shifts across prompt, thinking trace, and assistant response in DeepSeek R1. They also report phase-sensitive steering behavior (e.g., naive early steering failure; dependence on model preamble dynamics).

That is direct evidence of within-generation regime heterogeneity under a shared SAE vocabulary.

### 2) Exposure-bias quantification literature  
**Confidence: Suggestive**

He et al. estimate relatively modest aggregate performance gaps (~3%) when removing train/infer mismatch. Encouraging—but aggregate metrics can hide local spikes at high-entropy or decision-critical positions, where sparse features are most brittle.

### 3) Degeneration and anisotropy results  
**Confidence: Suggestive**

Holtzman et al. and SimCTG-style work indicate generated text and human text occupy different statistical/representational structure. If generated-token trajectories live in a different region of representation space, downstream activations inherit that mismatch relative to prefill training distributions.

### 4) Speculative decoding acceptance behavior  
**Confidence: Suggestive**

In production, acceptance rates vary materially by domain (e.g., lower on conversational vs higher on code). Even closely related draft/target models diverge substantially at decode time. This implies structured decode-time complexity not captured by standard proxy objectives.

## Activation outliers as a plausible mechanism

Outlier-channel behavior in transformers is now well documented (LLM.int8(); later outlier/kurtosis studies). Outlier-sensitive SAE behavior (e.g., BOS-driven instability and cascading effects) is also documented in transfer analyses and practical training pipelines.

**Hypothesis (Speculative):** decode-time uncertainty and self-conditioning could alter outlier structure enough to perturb sparse dictionaries trained on prefill distributions.

I’m not asserting this as settled. I’m asserting it as a credible mechanism worth explicit measurement.

## Implications for steering reliability

If prefill and decode differ materially, prefill-calibrated steering can drift in predictable ways:

1. **Activation-rate drift**: a 2% sparse feature in prefill may fire at 0.5% or 5% in decode.
2. **Directional drift**: concept vectors may rotate between regimes.
3. **Mechanism split/merge**: one prefill feature may conflate multiple decode-time mechanisms.

Steering can still “work,” but calibration and confidence bounds change. For safety-critical use, “works in demos” is insufficient.

## Why this matters in my own negative sufficiency results

In persona-circuits experiments, contrastive directions extracted from prefill activations could steer behavior (concentration signal present), but sufficiency tests degraded strongly when preserving only identified components.

Two interpretations remain live:

- **Interpretation A:** I missed causal components (standard circuit incompleteness story).
- **Interpretation B:** prefill-identified components are insufficient in decode because decode recruits additional regime-specific computation.

My current design cannot separate A from B. That ambiguity itself is the point: without decode-aware measurement, we can’t tell whether we’re missing components or missing regimes.

## Reasoning models make the gap first-order

For reasoning models, long thinking traces keep the model in decode conditioning for hundreds/thousands of tokens. Internal dynamics are phase-structured, and chain-of-thought text is not consistently faithful to causal factors in final decisions.

So if the goal is to understand or monitor reasoning-time computation, decode activations are not optional—they are the object. Prefill-only instrumentation becomes increasingly misaligned with the behaviors we care most about.

## A practical measurement program (minimum viable standard)

Here’s a concrete, low-friction program:

### Experiment 1 — Distribution drift by position
Capture prefill activations and decode activations on matched prompts. Compare mean/variance/kurtosis/outlier frequency per layer and token position.

### Experiment 2 — Reconstruction gap
Evaluate prefill-trained SAE reconstruction on prefill vs decode activations (MSE, EV). Track drift over generation steps and entropy bands.

### Experiment 3 — Feature-set overlap
Compare top-k active features between regimes (e.g., Jaccard overlap, rank correlation).

### Experiment 4 — Steering fidelity over depth
Apply fixed steering at token 1, 10, 50, 200; measure effect size decay or instability.

### Experiment 5 — Sparse online probes
Lightweight decode-time snapshots (periodic or entropy-triggered) against a prefill reference profile; flag high-divergence trajectories.

**Method note:** KL on per-dimension marginals is a **diagnostic proxy**, not a full characterization of joint geometry. Use it for triage, not proof.

## The tooling gap is the blocker

Our mainstream mech-interp stack is optimized for fixed-input analysis (“microscope mode”). Decode-time monitoring requires streaming capture, low-overhead hooks, and KV-aware instrumentation (“telescope mode”).

A few efforts prove feasibility, but there is no broadly adopted, general-purpose workflow for:  
**stream decode activations → compare to reference distribution → alert on regime drift**.

That is an infrastructure opportunity, not just a research footnote.

## Where this leaves the field

This is not a critique of prefill-based SAE practice. It was the right engineering choice for scale.

But as systems become more reasoning-heavy, agentic, and long-horizon, the highest-leverage interpretability question shifts from:

> “Can we extract useful features from prefill data?”

to:

> “Can we trust prefill-learned features under decode-time dynamics where safety-critical behavior actually unfolds?”

We are still using microscopes calibrated for one room to study another. Sometimes that works. But we have not standardized how to measure when it stops working.

**If your steering or monitoring pipeline cannot report prefill-vs-decode reconstruction drift by position, it is not yet safety infrastructure.**

---

*Code and experiment logs: [github.com/Sohailm25/persona-circuits](https://github.com/Sohailm25/persona-circuits)*  
*Related: [Persona Circuits: Progress & Findings](https://sohailmo.ai/research/experiments/persona-circuits-current-state/)*  
*Related: [Inverse Scaling in Activation Steering](https://sohailmo.ai/research/activation-steering/)*
