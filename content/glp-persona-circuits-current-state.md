Title: Persona Circuits: Exploring GLP Application
Date: 2026-03-17 12:00
Modified: 2026-03-17 17:30
Category: Research
Tags: persona-circuits, glp, activation-steering, mechanistic-interpretability, llm-research
Slug: research/experiments/glp-persona-circuits-current-state
Authors: Sohail Mohammad
Summary: Branch report on using Generative Latent Priors (GLP) for activation repair in persona steering: public-checkpoint transfer failed in this setting, matched checkpoints were more stable but still nonselective, and mixed clean+edited training is now the key unresolved test.
Status: published

---

The GLP branch was designed to answer one concrete question: when steering fails, are we seeing a **bad semantic direction** or a **geometrically invalid edited state**?

This post is organized to answer that question directly before moving into branch details.

## Why This Branch Matters

If a repair prior can preserve semantic edits while restoring plausibility, then some apparent circuit failures may be geometric rather than semantic. If it cannot, we should be more cautious about using latent priors as mechanistic disambiguation tools.

## GLP Reference and Why We Tried It

- **Paper context:** Luo et al., *Generative Latent Priors* (GLP). Reference link: <https://arxiv.org/html/2602.06964v1>
- **High-level idea:** train a latent denoiser/prior over activations, then use that prior to project edited activations back toward plausible manifold states.
- **Why we applied it here:** in persona-circuits, we needed to separate two failure modes:
  1. semantic insufficiency (the steering direction/circuit is wrong), versus
  2. geometric invalidity (the edited activation is off-manifold).

GLP was a natural candidate because, in principle, it can repair geometry while preserving intended directional edits.

## Evidence Scope

This post covers one bounded branch question:

Can a learned latent prior (GLP) repair steered activations in a way that preserves intended semantic edits while improving geometric validity?

Included evidence:

- public-checkpoint transfer tests
- matched model/layer GLP checkpoints
- Week 2 steering sidecar controls
- geometry diagnostics (repair/edit ratio, retention cosine)
- conditional pilot objective
- mixed clean+edited training path (trained; behavioral evaluation pending)

Claims are limited to this branch, in this model/layer/protocol setting.

## Project Context (for new readers)

Persona-circuits is an ongoing mechanistic interpretability project testing whether persona-like behavioral steering directions in LLMs correspond to sparse, causally meaningful internal structure. The current evidence supports robust steering and partial concentration structure, but several stronger causal claims (especially sufficiency and distinctness) remain mixed or negative under current protocols.

## Why We Ran This Branch

In persona-circuits, the central challenge is not only moving a trait score. It is distinguishing:

- semantic insufficiency (the direction/circuit is wrong), versus
- geometric invalidity (the intervention pushes activations off-manifold)

GLP was promising as a disambiguation tool: repair geometry without erasing meaningful directional edits.

## Explicit Branch Hypotheses

This branch tests three explicit hypotheses:

- **G1 (Selective repair):** GLP should improve selected steering outcomes more than baseline or random-control GLP conditions.
- **G2 (Direction preservation):** GLP repair should keep substantial alignment with the intended edit direction while improving plausibility.
- **G3 (Train/eval match sensitivity):** mixed clean+edited training should improve selectivity relative to clean-only training if distribution mismatch is the main bottleneck.

## Naming Note (Consistency With Mainline)

This branch contains historical metrics labeled `evil` from earlier branch-stage naming. In the mainline synthesis, that construct is reframed as `machiavellian_disposition` due to refusal confounding. The GLP tables below preserve original branch labels for traceability.

## What We Built

This became a full sidecar rather than a single checkpoint test:

- GLP runtime (unconditional + conditional)
- geometry and next-token diagnostics
- Week 2 steering evaluation with controls
- Week 3 sufficiency sidecar support
- neutral corpus generation
- memmap activation export pipeline
- Modal training launcher
- paired conditional data path
- mixed clean+edited training path

Controls that matter most:

- `selected_raw`
- `selected_glp`
- `baseline_glp_control`
- `random_glp`

## Main Findings So Far

### 1) Public GLP checkpoint did not transfer cleanly

In this setting, the released checkpoint produced large local predictive distortion and overly strong GLP-only/random controls. That behavior is inconsistent with a selective repair interpretation.

### 2) Matched checkpoints helped stability, not selectivity

Model/layer-matched checkpoints were less pathological than the public checkpoint. But the key branch question remained unresolved:

Does GLP help selected steering **more** than baseline/random controls?

So far, mostly no.

### 3) Control competitiveness remains too high

Representative validated reads (compact format):

- **Matched `response_all` — `evil`**
  - selected_raw: `-59.6`
  - selected_glp: `-54.65`
  - raw coherence: `34.75`
  - glp coherence: `33.08`
  - baseline_glp_control: `-61.5`
  - random_glp: `-59.5`

- **Matched `response_all` — `sycophancy`**
  - selected_raw: `-71.9`
  - selected_glp: `-72.25`
  - raw coherence: `50.98`
  - glp coherence: `44.98`
  - baseline_glp_control: `-77.3`
  - random_glp: `-74.75`

- **Matched `response_last` — `evil`**
  - selected_raw: `-60.25`
  - selected_glp: `-54.15`
  - raw coherence: `34.4`
  - glp coherence: `31.93`
  - baseline_glp_control: `-62.45`
  - random_glp: `-58.67`

- **Matched `response_last` — `sycophancy`**
  - selected_raw: `-72.15`
  - selected_glp: `-71.0`
  - raw coherence: `50.8`
  - glp coherence: `49.45`
  - baseline_glp_control: `-73.5`
  - random_glp: `-75.65`

Interpretation: GLP effects are not selective enough relative to nuisance controls.

![Selected GLP versus baseline and random control effects in the validated Week 2 runs](/images/glp-selected-vs-controls-comparison.svg)

### 4) Geometry suggests generic projection behavior

Observed ranges across matched runs:

- repair-to-edit ratio: ~`2.0`–`2.16`
- edit-retention cosine: ~`0.39`–`0.42`

In practice, GLP often makes moves larger than the original edit while preserving under half of its directional alignment. This looks more like a generic denoising projector than direction-preserving repair.

### 5) Better optimization did not resolve selectivity in the matched `response_all` lane

After addressing undertraining critiques and improving validation loss materially in the matched `response_all` lane, behavior-level selectivity still did not improve enough. That weakens “insufficient optimization” as the main explanation for that lane, even though it does **not** fully settle the training-adequacy question for `response_last`.

### 6) Conditional pilot worked technically, but likely targeted the wrong objective

`prompt_last -> response_last` conditional training functioned as infrastructure, but likely optimized a normal-response mapping rather than edit-preserving repair.

## Most Important New State

We now have a mixed clean+edited `response_last` checkpoint that directly addresses the clean-train / edited-eval mismatch criticism.

Dataset:

- `8600` total
- `6880` clean (`80%`)
- `1720` edited (`20%`)
- balanced across:
  - `sycophancy_plus`
  - `sycophancy_minus`
  - `evil_plus`
  - `evil_minus`

Training note:

- validation loss improved from `1.877` (clean-only) to `1.855` (mixed), under matched compute

This is not the branch result by itself. The key pending result is Week 2 behavioral evaluation on this mixed checkpoint.

## Claim Boundary

What is supported now:

- naive reuse of the released GLP checkpoint is not supported for this lane
- matched GLP reduces gross mismatch pathology
- current GLP behavior is still nonselective in the Week 2 branch framing
- failure mode appears structured (generic projection), not random

What is not yet supported:

- selective, direction-preserving repair at claim-grade confidence
- broad anti-GLP claims outside this task regime

## Methods Snapshot

- **Primary model and hook:** `meta-llama/Llama-3.1-8B-Instruct`, layer `12`, `blocks.12.hook_resid_post`
- **Validated Week 2 comparison setting:** `20` held-out prompts per trait, `max_new_tokens=32`, `temperature=0`, `random_direction_draws=3`
- **Traits in the branch-local claim lane:** `sycophancy` and historical `evil` branch naming
- **Judge setup:** `claude-sonnet-4-6` for scored branch evaluation; the mainline dual-judge audit uses `claude-opus-4-6` as the secondary calibration model
- **Training defaults for the matched checkpoints:** `lr=5e-5`, `batch_size=512`, `validation_fraction=0.05`, cosine scheduler with warmup, `3` epochs in the validated comparison runs
- **Training datasets used in the current post:**
  - `response_all`: `92,422` activations from `3,000` prompts
  - clean `response_last`: `8,600` activations from `8,600` prompts
  - mixed `response_last`: `8,600` activations with `20%` edited samples
- **Mixed-data composition:** `1,720` edited samples, balanced `430` each across `sycophancy_plus`, `sycophancy_minus`, `evil_plus`, `evil_minus`

Branch interpretation rule of thumb:

- a checkpoint is only treated as claim-aligned when model and layer match the target lane
- behavioral repair is only interesting if `selected_glp` beats the nuisance baselines, not merely if it looks okay in isolation
- NLL / geometry metrics are treated as diagnostics, not as validated behavioral surrogates

## Uncertainty and Variance Notes

The current branch read is mean-based, but the prompt-level variance is large enough that I do not want readers to infer more stability than the artifacts support.

Validated `20`-prompt runs:

| Checkpoint | Trait | GLP-minus-raw effect delta mean | Std | Range | GLP-minus-raw coherence delta mean | Std | Range |
|---|---|---:|---:|---:|---:|---:|---:|
| matched `response_all` | `sycophancy` | `-0.35` | `11.54` | `[-13, 23]` | `-6.00` | `9.55` | `[-27.0, 11.5]` |
| matched `response_all` | `evil` | `4.95` | `13.50` | `[-12, 37]` | `-1.68` | `8.94` | `[-20.0, 16.5]` |
| matched `response_last` | `sycophancy` | `1.15` | `9.02` | `[-18, 20]` | `-1.35` | `11.20` | `[-28.5, 21.5]` |
| matched `response_last` | `evil` | `6.10` | `15.38` | `[-17, 52]` | `-2.48` | `9.08` | `[-17.0, 12.0]` |

What this means:

- GLP is not uniformly harmful or uniformly helpful across prompts.
- The current failure mode looks unstable and generic, not cleanly trait-selective.
- Random-direction controls are now averaged over `3` draws, which is better than the original single-draw control, but still not enough to claim seed-level stability.

Proxy-metric warning:

- `evil` NLL-vs-coherence delta Spearman: `0.096`
- `evil` repair-ratio-vs-coherence delta Spearman: `-0.218`
- `sycophancy` NLL-vs-coherence delta Spearman: `0.298`

Those are too weak to justify treating the proxy metrics as behavioral stand-ins.

## Artifact Index For Numeric Claims

- **Released checkpoint failed to transfer cleanly**
  - Numeric claim: large distortion on `evil` alpha-3 diagnostic: `delta_target_nll_vs_clean=4.725`, `kl_clean_to_hooked=5.184`
  - Artifact: `week2_glp_sidecar_validation_20260311T012700Z_evil_frontier_alpha3_nlldiag_20260310a.json`

- **Matched `response_all` still looked nonselective**
  - Numeric claim: `evil`: selected GLP `-54.65` vs baseline `-61.5` vs random `-59.5`; `sycophancy`: selected GLP `-72.25` vs baseline `-77.3` vs random `-74.75`
  - Artifact: `week2_glp_sidecar_validation_20260312T151500Z_matched_responseall_val3e_rowdiag20_20260312a.json`

- **Matched `response_all` geometry looked like generic projection**
  - Numeric claim: repair-to-edit ratio `2.0092` / `2.0222`; retention cosine `0.4182` / `0.4235`
  - Artifact: `week2_glp_sidecar_analysis_20260312T155851Z.json`

- **Matched `response_last` still looked nonselective**
  - Numeric claim: `evil`: selected GLP `-54.15` vs baseline `-62.45` vs random `-58.67`; `sycophancy`: selected GLP `-71.0` vs baseline `-73.5` vs random `-75.65`
  - Artifact: `week2_glp_sidecar_validation_20260313T135047Z_matched_responselast_val3e_rowdiag20_20260313b.json`

- **Matched `response_last` geometry still looked like generic projection**
  - Numeric claim: repair-to-edit ratio `2.1577` / `2.1620`; retention cosine `0.3932` / `0.3948`
  - Artifact: `week2_glp_sidecar_analysis_20260313T135951Z.json`

- **Better `response_all` optimization did not translate into selective repair**
  - Numeric claim: validation loss improved to `1.5969` at epoch `2` and `1.5795` at epoch `3`, but Week 2 selectivity still failed
  - Artifacts: `train_glp_matched_modal_20260312T133750Z_responseall_val3e_20260312a.json`; `week2_glp_sidecar_validation_20260312T151500Z_matched_responseall_val3e_rowdiag20_20260312a.json`

- **Clean `response_last` remained a low-step regime**
  - Numeric claim: `8,170` train examples, `430` val examples, `15` gradient steps/epoch, final val loss `1.8770`
  - Artifact: `train_glp_matched_modal_20260313T023542Z_response_last_tranches1234_val3e_20260312a.json`

- **Mixed clean+edited checkpoint is now trained**
  - Numeric claim: `8,600` total samples, `1,720` edited (`20%`), balanced `430` per edit label, final val loss `1.8551`
  - Artifacts: `glp_export_mixed_edited_memmap_dataset_20260315T075043Z_response_last_mixed20_tranches1234_20260313a.json`; `train_glp_matched_modal_20260315T075513Z_response_last_mixed20_tranches1234_val3e_20260313a.json`

## What To Do Next

1. Evaluate Week 2 behavior on the mixed-trained checkpoint.
2. If still nonselective, substantially lower confidence in unconditional GLP for this application.
3. Only if mixed training improves selectivity should we invest in larger targeted-objective work (edit-fraction sweeps, stronger conditional/edit-aware repair objectives).

## Current Bottom Line

We tested GLP as a geometry disambiguation tool for persona steering. The public checkpoint failed to transfer cleanly in this setting. Matched checkpoints were more stable but still too nonselective, with geometry consistent with generic projection behavior. The mixed clean+edited checkpoint is now trained and creates a real next inflection test; its behavioral evaluation is the decisive next step.

---

## Project Links

- Research hub: <https://sohailmo.ai/pages/research/>
- Code and artifacts: <https://github.com/Sohailm25/persona-circuits>
