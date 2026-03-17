Title: Persona Circuits Branch Report: What We Learned Trying GLP Activation Repair
Date: 2026-03-17 12:00
Modified: 2026-03-17 12:00
Category: Research
Tags: persona-circuits, glp, activation-steering, mechanistic-interpretability, llm-research
Slug: glp-persona-circuits-current-state
Authors: Sohail Mohammad
Summary: Branch report on using Generative Latent Priors (GLP) for activation repair in persona steering: public-checkpoint transfer failed in this setting, matched checkpoints were more stable but still nonselective, and mixed clean+edited training is now the key unresolved test.
Status: published

---

This is a current-state branch report inside the broader persona-circuits project, not a final paper conclusion.

I’m writing this now because the branch has already produced a useful result shape: not a clean win, not a trivial null, but a legible failure mode that changes what we should test next.

**Mainline synthesis:** [/persona-circuits-current-state/](/persona-circuits-current-state/)

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

Representative validated reads:

#### matched `response_all`

| Trait | `selected_raw` | `selected_glp` | `raw` coherence | `glp` coherence | `baseline_glp_control` | `random_glp` |
|---|---:|---:|---:|---:|---:|---:|
| `evil` | `-59.6` | `-54.65` | `34.75` | `33.08` | `-61.5` | `-59.5` |
| `sycophancy` | `-71.9` | `-72.25` | `50.98` | `44.98` | `-77.3` | `-74.75` |

#### matched `response_last`

| Trait | `selected_raw` | `selected_glp` | `raw` coherence | `glp` coherence | `baseline_glp_control` | `random_glp` |
|---|---:|---:|---:|---:|---:|---:|
| `evil` | `-60.25` | `-54.15` | `34.4` | `31.93` | `-62.45` | `-58.67` |
| `sycophancy` | `-72.15` | `-71.0` | `50.8` | `49.45` | `-73.5` | `-75.65` |

Interpretation: GLP effects are not selective enough relative to nuisance controls.

### 4) Geometry suggests generic projection behavior

Observed ranges across matched runs:

- repair-to-edit ratio: ~`2.0`–`2.16`
- edit-retention cosine: ~`0.39`–`0.42`

In practice, GLP often makes moves larger than the original edit while preserving under half of its directional alignment. This looks more like a generic denoising projector than direction-preserving repair.

### 5) Better optimization did not resolve selectivity

After addressing undertraining critiques and improving validation loss materially, behavior-level selectivity still did not improve enough. This removes “insufficient optimization” as a primary explanation.

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
