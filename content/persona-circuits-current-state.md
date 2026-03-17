Title: Persona Circuits Current State: What Held Up, What Broke, and What We Learned
Date: 2026-03-17 13:30
Modified: 2026-03-17 13:30
Category: Research
Tags: persona-circuits, mechanistic-interpretability, llm-research, steering, interpretability
Slug: persona-circuits-current-state
Authors: Sohail Mohammad
Summary: Current-state synthesis of persona-circuits: robust steering and partial concentration support, but weaker distinctness, necessity, and sufficiency evidence under current protocols.
Status: published

---

This is a current-state synthesis, not a final paper.

It is also not a placeholder. We have enough completed work to make concrete claims now, including mixed and negative findings that are worth publishing as first-class results.

**Companion branch report:** [/glp-persona-circuits-current-state/](/glp-persona-circuits-current-state/)

## Evidence Scope

This post summarizes the current mainline persona-circuits evidence stack:

- end-to-end pipeline development and validation
- core-lane results (`sycophancy`, reframed `machiavellian_disposition`, and `hallucination` as a weak lane)
- trait-lane expansion (`trait_lanes_v2`)
- concentration, distinctness, and causal-control analyses
- bounded claim-grade sufficiency checks

The scope is intentionally narrow: claims here are only for the evaluated model/protocol regime and current operationalizations.

## Project Context (for new readers)

Persona-circuits is an ongoing mechanistic interpretability project testing whether persona-like behavioral steering directions in LLMs correspond to sparse, causally meaningful internal structure. The current evidence supports robust steering and partial concentration structure, but several stronger causal claims (especially sufficiency and distinctness) remain mixed or negative under current protocols.

## What We Set Out To Test

The central question was:

Can we move from “this vector steers behavior” to “this behavior is mediated by a sparse, causally meaningful circuit”?

Prior work already supports key pieces of that story:

- representation engineering / ActAdd / CAA-style steering directions
- persona-vector decomposition into interpretable feature groupings
- circuit-tracing cases where specific behaviors are mechanistically localizable

The gap was the bridge between these ideas in one integrated, claim-disciplined workflow.

## What We Built

We now have a full stack covering:

- infrastructure and prompt generation
- contrastive vector extraction
- upgraded dual-judge behavioral validation
- held-out and control evaluations
- SAE decomposition and concentration analysis
- causal ablation analyses for necessity/sufficiency-style questions
- cross-persona and router exploratory tests
- trait-lane expansion when the original lane set looked bottlenecked

The original trio (`sycophancy`, `evil`, `hallucination`) evolved during the project:

- `sycophancy` remained the clearest anchor
- `evil` was reframed to `machiavellian_disposition` due to refusal confounding
- `hallucination` remained weak as a persona-like lane and moved toward negative-control status

## What Held Up

### 1) Robust steering directions are real

We consistently extracted directions that changed behavior in both the core line and trait-lane branch. That does **not** prove construct validity or causal distinctness, but it does rule out a pure-noise interpretation.

### 2) Core lanes show non-flat concentration structure

Stage 3 attribution concentration was meaningfully non-flat:

- `sycophancy`: Gini `0.5771`, top-20% mass `0.5298`
- `machiavellian_disposition`: Gini `0.6476`, top-20% mass `0.6173`

This is best interpreted as **partial support with caveats**, not full confirmation of a sparse-circuit claim.

### 3) Trait-lane expansion produced discriminative evidence

The branch screened:

- `assistant_likeness`
- `honesty`
- `politeness`
- `persona_drift_from_assistant`
- `lying`
- `optimism`

The branch did meaningful scientific work because it differentiated “we chose weak traits” from “strong steering does not automatically imply independent persona mechanisms.”

## Where the Strongest Positive Story Weakened

### `politeness` looked strong, then failed distinctness

`politeness` produced strong steering and passed several robustness checks. However, in deeper validation it repeatedly bled into `assistant_likeness` at near-parity levels.

Representative reads:

- target effect: `46.33`
- off-target assistant-likeness effect: `47.23`
- bleed ratio: `1.0194`

Follow-up checks did not resolve this:

- paraphrase retention stayed high (`0.9881` cosine retention)
- orthogonalized residual retained force (`31.4`) but still failed distinctness
- response-mean follow-up shifted layer/magnitude, not verdict

Current interpretation: `politeness` is a strong steering direction, but under current protocol it is better described as **assistant-style modulation** than an independently promotable persona lane.

### `lying` became a cleaner negative finding

`lying` survived early screening but degraded under deeper testing, especially in external smoke behavior where reversibility and construct alignment failed.

Key lesson: stable extraction can coexist with poor construct validity.

### `honesty` remains unresolved but non-trivial

`honesty` currently looks asymmetric and RLHF-shaped rather than a clean symmetric honesty/dishonesty axis. This is less tidy for the original persona-circuit narrative but scientifically important.

## Hypotheses: Current Read

### H1 (concentration / sparse-structure support)

Partial support with caveats.

### H2 (necessity)

Mixed-to-weak under current thresholds; below claim-grade confidence.

### H3 (sufficiency)

Negative under current operationalization. In bounded full-complement circuit-only execution, behavior degraded into repetitive/low-capability outputs.

At completed doses:

- `0.25`: preservation `0.2857`
- `0.50`: preservation `0.3571`

### H4/H5 (cross-persona and router)

Weak-negative / exploratory null under current tests.

## Claim Boundary

What is established:

- robust behavioral steering exists
- concentration is non-flat in important lanes
- stronger distinctness and sufficiency claims are not currently supported

What is **not** established:

- claim-grade sparse-circuit sufficiency
- cleanly separable independent persona lanes for key new candidates
- strong router-level persona mediation evidence

## Why This Result Is Still Valuable

The main contribution is not a clean positive bridge from steering vectors to circuit claims. The contribution is sharper:

- robust steering is a lower bar than mechanistic distinctness
- assistant-prior structure appears broader and more absorbing than expected
- stronger controls improved the *quality* of negative findings

That is scientifically useful and should be reported directly, not hidden behind optimistic framing.

## Next Steps

Default next move is synthesis, not breadth expansion:

- document supported vs unsupported claims clearly
- publish mixed/negative findings as first-class evidence
- limit new experiments to redesign-level questions (assistant-basin factorization, truthfulness reformulation under RLHF asymmetry, less-destructive sufficiency operationalizations)

## Current Bottom Line

We found real persona-like steering structure. But when we pushed toward stronger causal and mechanistic claims, the story became narrower, messier, and more assistant-shaped.

That is not the cleanest possible narrative. It is the most accurate one from the current evidence.

---

## Project Links

- Research hub: <https://sohailmo.ai/pages/research/>
- Code and artifacts: <https://github.com/Sohailm25/persona-circuits>
