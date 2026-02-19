Title: Research
Slug: research
Template: page

## Papers

### [Condition-Dependent Collapse Dynamics in Multi-Turn LLM Self-Play](/research/paper-a-escape-velocity/)
**Paper A (Path B): Baseline closure with transparent reliability limits**

Sohail Mohammad · Preprint, 2026

Preregistered baseline study across four interaction conditions with full confirmatory baseline closure (720/720 tuples). Results are reported under Path B framing after the preregistered reliability gate was not met (κ=0.566 vs 0.80 threshold), limiting conclusions to descriptive and condition-comparative findings.

[Distill page](/research/paper-a-escape-velocity/)

### [Inverse Scaling in Activation Steering](/research/activation-steering/)
**Architecture and Scale Dependence of Refusal Manipulation**

Sohail Mohammad · Preprint, 2025

Activation steering modifies language model behavior by adding learned direction vectors at inference time. We systematically evaluate two extraction methods across seven models (2B–32B parameters) and find that steering effectiveness decreases monotonically with model scale: coherent refusal rates drop from 100% at 3B to 77% at 32B. Simple mean-difference extraction matches or exceeds complex SVD-based methods at every scale tested, while architecture acts as a binary gate on steerability.

[Paper (PDF)]({static}/papers/activation-steering-2025.pdf) · [Code (GitHub)](https://github.com/Sohailm25/activation-steering-runs)

## Experiments

### [Teaching an LLM to Trade Prediction Markets](/research/prediction-market-trader/)
**Chain-of-Thought Reasoning Solves Action Collapse in Low-Cardinality RL**

Sohail Mohammad · February 2025

Language models trained with standard PPO on prediction market trading collapse to degenerate policies (0% HOLD rate) despite achieving positive returns. Adding chain-of-thought reasoning before action selection completely prevents this collapse: CoT agents maintain 15-30% HOLD rates and ~0.95 policy entropy throughout training while achieving comparable performance (+$0.060 vs +$0.063 for simple baselines).

[Write-up](/research/prediction-market-trader/) · [Code (GitHub)](https://github.com/Sohailm25/prime-v-tinker-trader)
