Title: Research
Slug: research
Template: page

## Papers

### [Depth-Dynamics Signatures of Conversational Collapse](/research/ftle/)
**Finite-Time Lyapunov Analysis of Transformer Forward Passes**

Sohail Mohammad · Preprint, 2026

We estimate the top-1 finite-time Lyapunov exponent (λ₁) for transformer depth dynamics via JVP tangent propagation and test whether depth-dynamics summaries are associated with conversational collapse behavior observed in multi-turn self-play. Across 720 preregistered trajectories and 7,200 FTLE computations on three 7B-parameter model families, λ₁ profile features (depth-profile slope, ρ = −0.536; layerwise variance, ρ = +0.511) show medium-to-large predictive associations with collapse metrics from Escape Velocity. Mean λ₁ alone is insufficient. We interpret this as conditional correlational support under preregistered thresholds—no causal or mechanistic identity is claimed. Escape Velocity collapse labels carry a reliability caveat (κ = 0.566, threshold 0.80 not met).

[Paper (PDF)]({static}/papers/ftle-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/escape-velocity)

### [Condition-Dependent Collapse Dynamics in Multi-Turn LLM Self-Play](/research/escape-velocity/)
**Baseline collapse dynamics with transparent reliability limits**

Sohail Mohammad · Preprint, 2026

Preregistered baseline study across four interaction conditions (Llama-3.1-8B self-play, Qwen2.5-7B self-play, Mistral-7B-v0.3 self-play, and heterogeneous round-robin rotation) with full confirmatory baseline closure (720/720 tuples). Under fixed protocol settings, collapse rates were strongly condition-dependent, with Qwen-homogeneous highest and Mistral-homogeneous lowest. Because the preregistered detector reliability gate was not met (κ=0.566 vs 0.80 threshold), conclusions are intentionally limited to descriptive and condition-comparative findings.

*Path B disclosure:* Detector reliability prereg gate was **not met**; no detector-validation claim is made.

[Paper (PDF)]({static}/papers/escape-velocity-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/escape-velocity)

### [Inverse Scaling in Activation Steering](/research/activation-steering/)
**Architecture and Scale Dependence of Refusal Manipulation**

Sohail Mohammad · Preprint, 2026

Activation steering modifies language model behavior by adding learned direction vectors at inference time. We systematically evaluate two extraction methods across seven models (2B–32B parameters) and find that steering effectiveness decreases monotonically with model scale: coherent refusal rates drop from 100% at 3B to 77% at 32B. Simple mean-difference extraction matches or exceeds complex SVD-based methods at every scale tested, while architecture acts as a binary gate on steerability. Phase-2 transfer experiments show that within the tested same-family pair (Qwen 14B↔32B), extracted directions transfer with efficiency ≥ 1.0, while cross-family transfer (Qwen 7B↔Gemma 9B) collapses to near-zero despite matched hidden dimensionality.

[Paper (PDF)]({static}/papers/activation-steering-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/activation-steering-runs)


### [Pilot study: Distributional bias shifts across preference-tuning stages](/research/rlhf-entropy/)
**Dataset-scoped pre-registered pilot with bounded empirical claims**

Sohail Mohammad · Draft, 2026

Pre-registered pilot decomposing bias-shift contributions across base, SFT, and preference tuning stages, with falsification-first controls and corrective replacement provenance. Findings are explicitly dataset-scoped: v1.0 contradiction remains immutable, while v2/v3 provide bounded artifact-supported interpretation under BBQ corrective closure. No universal mechanism claims are made.

[Paper (Draft)](/research/rlhf-entropy/) · [Code (GitHub)](https://github.com/Sohailm25/rlhf-entropy-pilot)

## Failures

### [B6 Negative Result: Decision-Valid Pipeline, Blocked Mechanistic Path](/research/failures/b6-negative-result/)
**High-quality negative result with strict claim boundaries**

Sohail Mohammad · February 2026

We established a decision-valid behavior pipeline for SAS vs DIM under strict governance, but failed reconstruction unlock for mechanism-level interpretation. A bounded remediation path (Option 2) was preregistered and then terminated via K2 after auth-resolved definitive candidate checks found no required tuple coverage. This branch is closed for now under a limitation lock, with explicit reopen conditions.

[Plain-language writeup](/research/failures/b6-negative-result/)

## Experiments

### [Teaching an LLM to Trade Prediction Markets](/research/prediction-market-trader/)
**Chain-of-Thought Reasoning Solves Action Collapse in Low-Cardinality RL**

Sohail Mohammad · February 2025

Language models trained with standard PPO on prediction market trading collapse to degenerate policies (0% HOLD rate) despite achieving positive returns. Adding chain-of-thought reasoning before action selection completely prevents this collapse: CoT agents maintain 15-30% HOLD rates and ~0.95 policy entropy throughout training while achieving comparable performance (+$0.060 vs +$0.063 for simple baselines).

[Write-up](/research/prediction-market-trader/) · [Code (GitHub)](https://github.com/Sohailm25/prime-v-tinker-trader)
