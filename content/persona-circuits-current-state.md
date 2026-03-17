Title: Persona Circuits: Progress & Findings (3-17-2026)
Date: 2026-03-17 13:30
Modified: 2026-03-17 17:30
Category: Research
Tags: persona-circuits, mechanistic-interpretability, llm-research, steering, interpretability
Slug: research/experiments/persona-circuits-current-state
Authors: Sohail Mohammad
Summary: Current-state synthesis of the persona-circuits project: robust steering and partial concentration support, but weaker-than-expected distinctness, necessity, and sufficiency evidence under current protocols.
Status: published

---

Persona-like steering results are often easy to demonstrate and hard to interpret mechanistically. This write-up is organized to answer one practical question for readers: **what is actually supported today, and what is not?**

The goal is to make the claim boundary clear before diving into technical details.

**Companion branch report:** [/research/experiments/glp-persona-circuits-current-state/](/research/experiments/glp-persona-circuits-current-state/)

## Why This Matters

If steering directions are robust but mechanistically diffuse, then “we can steer behavior” and “we found a causal persona circuit” are different scientific statements. This project is about separating those statements rigorously.

## Evidence Scope

This post summarizes the current mainline persona-circuits evidence stack:

- end-to-end pipeline development and validation
- core-lane results (`sycophancy`, reframed `machiavellian_disposition`, and `hallucination` as a weak lane)
- trait-lane expansion (`trait_lanes_v2`)
- concentration, distinctness, and causal-control analyses
- bounded claim-grade sufficiency checks

The scope is intentionally narrow: claims here are only for the evaluated model/protocol regime and current operationalizations.

## Project Context (for new readers)

Persona-circuits is an ongoing mechanistic interpretability project testing whether persona-like behavioral steering directions in LLMs correspond to sparse, causally meaningful internal structure. The current evidence supports robust steering and partial concentration structure, but several stronger causal claims, especially sufficiency and distinctness, remain mixed or negative under current protocols.

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

- prompt-last target effect: `46.33`
- prompt-last assistant-likeness bleed: `47.23`
- prompt-last bleed ratio: `1.0194`

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

![Claim boundary matrix for the current persona-circuits read](/images/persona-circuits-claim-boundary-matrix.svg)

### H1 (concentration / sparse-structure support)

Partial support with caveats.

### H2 (necessity)

Mixed-to-weak under current thresholds; below claim-grade confidence.

### H3 (sufficiency)

Negative under current operationalization. In bounded full-complement circuit-only execution, behavior degraded into repetitive, low-capability outputs.

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

## Methods Snapshot

- **Primary model:** `meta-llama/Llama-3.1-8B-Instruct`
- **Primary seed in the current closeout stack:** `42`
- **Core prompt budgets:** extraction `100` pairs/trait, behavioral validation `50` prompts/trait, circuit analysis `20` prompts/trait, ablation validation target `100` prompts/trait
- **Judge setup:** primary `claude-sonnet-4-6`, secondary calibration `claude-opus-4-6`; audited on `90` prompt pairs / `180` scored responses per judge with mean kappa `0.7727`
- **Main claim thresholds from config/policy:** necessity `0.80`, sufficiency `0.60`, significance `0.01`, `A12 >= 0.71`, stability Jaccard `0.30`
- **Trait-lane deeper-validation profile:** `30` held-out prompts/lane split into `10` sweep / `10` confirm / `10` test, relative coherence max-drop gate `10.0`, cross-trait bleed enabled against `sycophancy` and `assistant_likeness`

This is the minimum reproducibility payload for the claims in this post. It is not the full methods section.

## Uncertainty and Variance Notes

I do not want the averages in this post to imply false precision.

- The strongest concentration claims are based on `50` prompts per core trait in Stage 3.
- The distinctness failure for `politeness` is based on `10` held-out test prompts in the deeper-validation runs, so the effect is real enough to flag but still small-sample.
- Judge reliability is not hand-waved here: the audit covers `90` prompt pairs with mean kappa `0.7727`, but the manual human concordance layer is still only a low-power sanity check (`n=15`).
- The H3 closeout is a real negative under the executed protocol, but it is still one bounded operationalization, not a universal impossibility proof for sufficiency-style work.
- Multi-seed replication remains limited. The current closeout stack is still centered on the seed-`42` artifact family.

Representative variance for the headline `politeness` lane:

| Run | Test steering mean | Test steering std | Test reversal mean | Test reversal std | `n_test_prompts` |
|---|---:|---:|---:|---:|---:|
| prompt-last deeper validation | `40.43` | `16.21` | `5.90` | `5.94` | `10` |
| response-mean deeper validation | `30.93` | `16.86` | `7.10` | `4.86` | `10` |
| orthogonalized prompt-last | `26.93` | `13.71` | `4.47` | `5.78` | `10` |

That is enough variance that I am comfortable writing “strong steering, weak distinctness,” but not enough to inflate these into stronger claims than the protocol earned.

## Artifact Index For Numeric Claims

- **Core concentration is non-flat**
  - Numeric claim: `sycophancy` Gini `0.5771`, top-20% mass `0.5298`; `machiavellian_disposition` Gini `0.6476`, top-20% mass `0.6173`
  - Artifact: `week3_stage3_activation_delta_attribution_20260304T164549Z.json`

- **Judge reliability is nontrivial**
  - Numeric claim: `90` prompt pairs, `180` responses/judge, mean kappa `0.7727`
  - Artifact: `week2_judge_reliability_audit_packet_20260314T160930Z.json`

- **`politeness` prompt-last fails distinctness**
  - Numeric claim: target effect `46.33`, assistant-likeness bleed `47.23`, bleed ratio `1.0194`
  - Artifact: `week2_trait_lane_deeper_validation_validation_20260312T134851Z.json`

- **`politeness` response-mean still fails distinctness**
  - Numeric claim: target effect `38.03`, assistant-likeness bleed `39.7`, bleed ratio `1.0438`
  - Artifact: `week2_trait_lane_deeper_validation_validation_20260313T182007Z.json`

- **Orthogonalization did not rescue `politeness` distinctness**
  - Numeric claim: target effect `31.4`, assistant-likeness bleed `32.83`, bleed ratio `1.0456`
  - Artifact: `week2_trait_lane_orthogonalization_validation_20260313T151437Z.json`

- **H2 strict claim-grade necessity fails**
  - Numeric claim: best zero-ablation mean reduction `0.5627`; best resample mean reduction `0.2585`; all below `0.80` necessity bar
  - Artifact: `week3_stage4_policy_decision_packet_20260310T142000Z.json`

- **H3 fails under executed full-complement protocol**
  - Numeric claim: preservation `0.2857` at dose `0.25`; `0.3571` at dose `0.50`; coherence drop `73.2`; capability proxy `0.0`
  - Artifact: `week3_stage4_behavioral_sufficiency_claimgrade_trancheA_closeout_20260311T1919Z.json`

- **H4 is weak-negative**
  - Numeric claim: early Jaccard `0.1696`, late Jaccard `0.1236`, delta `0.0460`, proposal pattern pass `false`
  - Artifact: `week3_stage5_policy_decision_packet_20260310T200937Z.json`

- **H5 is exploratory null / weak negative**
  - Numeric claim: `n_tested=62`, `n_rejected=0`, `min_q_value=0.0465`
  - Artifact: `week3_stage5_policy_decision_packet_20260310T200937Z.json`

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
