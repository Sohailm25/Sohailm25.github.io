Title: What Continuous Batching Does to Your Activations (And Why Your SAE Might Not Know)
Date: 2026-03-20 13:25
Modified: 2026-03-20 13:39
Category: Case Studies
Tags: interpretability-infrastructure, continuous-batching, sglang, vllm, saes, activation-capture, systems
Slug: research/experiments/continuous-batching-activations-sae
Authors: Sohail Mohammad
Summary: Continuous batching is algorithmically activation-safe under per-token normalization and masked attention, but hardware nondeterminism, prefix caching, and data-methodology sensitivity can still shape SAE outcomes.
Status: published

---

Goodfire’s infrastructure write-up on large-scale activation harvesting is one of the strongest pieces of interpretability systems engineering I’ve seen this year.

It also surfaces a question that deserves a direct answer:

> **Do inference-serving optimizations change activation values in ways that matter for SAE training?**

Not metadata. Not provenance. The tensors themselves.

I’ve spent the last few years building production inference stacks (vLLM/SGLang, high-volume conversational systems, distributed training) while also running mechanistic interpretability experiments (contrastive directions, SAE decomposition, behavioral ablation). This question sits exactly at that boundary.

**Core claim:** continuous batching is algorithmically equivalent to independent-sequence processing for activations; the real risks are hardware-level nondeterminism, prefix-caching-induced coverage gaps, and downstream SAE sensitivity to data methodology.

---

## The concern, precisely

In continuous batching, tokens from multiple requests are flattened into a shared token axis for throughput. Attention masking prevents cross-request token interaction inside attention.

The classic worry is whether non-attention operations (especially normalization) leak across co-batched samples.

If normalization were batch-coupled, identical prompts could produce different activations depending on neighbors. That would make scheduler composition a hidden confound in activation datasets.

---

## LayerNorm/RMSNorm: per-token, not batch-coupled

For standard transformer usage, LayerNorm and RMSNorm normalize over hidden features per token, not across batch tokens.

- **LayerNorm:** normalized over the specified feature dimensions (typically hidden dim)
- **RMSNorm:** per-token root-mean-square over hidden dim only

So adding/removing unrelated sequences in the same continuous batch does **not** change the normalization statistics for an existing token.


This is architectural/implementation behavior, not a hypothesis.

---

## Where equivalence breaks: floating-point execution paths

Algorithmic equivalence is not bitwise equivalence.

Different effective matrix shapes can trigger different kernel/tiling paths (e.g., cuBLAS heuristics), changing accumulation order under reduced precision. Chunked prefill likewise can alter reduction order relative to monolithic passes.

In floating-point arithmetic, that can produce small numeric drift, and occasionally output divergence near decision boundaries. Note that often-cited batch-size sensitivity results came from an OpenReview submission (not a peer-reviewed venue) and were strongest under TF32 settings; treat them as suggestive rather than settled.


The mechanism is real and well-understood in numerical computing. Magnitude in this exact activation-harvesting setup is still under-measured.

---

## Prefix caching: the bigger practical confound

Prefix caching can skip forward computation for repeated prefixes by reusing cached KV state. If forward compute is skipped, intermediate activations for those cached tokens are not newly produced during that run.

That means activation harvesting in a cache-heavy serving mode can systematically under-sample repeated prompt segments (system prefixes, boilerplate exemplars, recurring headers).

This is not activation-value contamination. It is **coverage missingness / coverage bias**.


Observed that caching skips compute; suggestive that resulting token-class undercoverage materially shifts SAE feature learning unless explicitly corrected.

---

## Why SAE methodology sensitivity makes this matter

SAEs are useful, but they are not invariant to data-collection and formatting choices.

Across recent work, we’ve seen:

- substantial feature-set variability across training seeds/protocols
- sensitivity to data formatting/sequence construction
- performance deltas on OOD/safety tasks from methodology shifts alone

So “activations were harvested from the same base model” is not enough. The path from model to training corpus (serving mode, caching behavior, batching dynamics, chunking policy) can affect what the SAE learns.

---

## What I would measure immediately

### 1) Batch-composition drift baseline
Fix input text; vary co-batched neighbors/scheduling; measure activation deltas (L2, cosine, variance bands) at capture layer.

### 2) Deterministic-vs-default floor
Repeat under deterministic settings versus default mixed-precision fast path to estimate hardware nondeterminism envelope.

### 3) Prefix-caching coverage map
Log computed tokens vs cache-hit tokens by token class/position; quantify undercoverage in repeated prefixes.

### 4) SAE stability under harvest perturbation
Train SAEs from datasets differing only by scheduler/caching policy; compare feature overlap and reconstruction behavior.

These are cheap relative to full-scale harvest runs and convert “probably negligible” into measured bounds.

---

## Practical guidance for production-grade harvesting

1. **If you want completeness, disable prefix caching during harvest** (or run a dedicated non-cache harvest pass).  
2. **Log compute coverage metadata** (computed vs reused tokens) as first-class training-data provenance.  
3. **Document precision/determinism settings** in every activation dataset release.  
4. **Treat serving config as part of the data method**, not an infra footnote.

---

## Bottom line

The reassuring part: continuous batching itself is not algorithmically “polluting” activations through cross-sample normalization or attention leakage.

The important part: inference-time systems choices still shape activation datasets through numerical execution path differences and, more significantly, token-coverage effects like prefix caching.

If interpretability is becoming infrastructure, these details belong in the methods section - not the appendix.

**Evidence-quality note:** This draft incorporates pre-publication fact-check corrections (2026-03-20), including attribution fixes and explicit separation of algorithmic equivalence from floating-point nondeterminism.

---

*Code and experiment logs: [github.com/Sohailm25/persona-circuits](https://github.com/Sohailm25/persona-circuits)*  
*Related: [Persona Circuits: Progress & Findings](https://sohailmo.ai/research/experiments/persona-circuits-current-state/)*

## Related in this trilogy

- [Decode-Time Activations Are the Dark Matter of Interpretability Infrastructure](/research/experiments/decode-time-activations-dark-matter/)
- [Backpressure Kills Silently: Failure Modes in Heterogeneous-Throughput Capture Pipelines](/research/experiments/backpressure-kills-silently-capture-pipelines/)
