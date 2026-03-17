Title: Research
Slug: research
Template: page

A curated index of active work, recent publications, experiments, and negative results.

## Active Research

### [Persona Circuits: Progress & Findings (3-17-2026)](/research/experiments/persona-circuits-current-state/)
**Status:** Active synthesis

Current-state synthesis of persona-circuits: robust steering and partial concentration support, but mixed-to-negative evidence for stronger distinctness, necessity, and sufficiency claims under current protocols.

[Write-up](/research/experiments/persona-circuits-current-state/) · [Code (GitHub)](https://github.com/Sohailm25/persona-circuits)

### [Persona Circuits: Exploring GLP Application](/research/experiments/glp-persona-circuits-current-state/)
**Status:** Active branch analysis

Branch report testing whether GLP can preserve steering semantics while repairing activation geometry. In this setting, public-checkpoint transfer failed, matched checkpoints were more stable but still nonselective, and mixed clean+edited training is the key pending test.

[Write-up](/research/experiments/glp-persona-circuits-current-state/) · [Code (GitHub)](https://github.com/Sohailm25/persona-circuits)

---

## Recent Publications and Reports

### [Depth-Dynamics Signatures of Conversational Collapse](/research/ftle/)
**Finite-Time Lyapunov Analysis of Transformer Forward Passes**

Sohail Mohammad · Preprint, 2026

This asks whether we can detect early warning signals of conversational collapse from internal depth dynamics.

[Paper (PDF)]({static}/papers/ftle-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/escape-velocity)

### [Condition-Dependent Collapse Dynamics in Multi-Turn LLM Self-Play](/research/escape-velocity/)
**Baseline collapse dynamics with transparent reliability limits**

Sohail Mohammad · Preprint, 2026

This baseline maps which interaction setups remain stable versus collapse in multi-turn model conversations.

*Path B disclosure:* Detector reliability prereg gate was **not met**; no detector-validation claim is made.

[Paper (PDF)]({static}/papers/escape-velocity-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/escape-velocity)

### [Inverse Scaling in Activation Steering](/research/activation-steering/)
**Architecture and Scale Dependence of Refusal Manipulation**

Sohail Mohammad · Preprint, 2026

This evaluates when activation steering remains reliable across scale and architecture changes.

[Paper (PDF)]({static}/papers/activation-steering-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/activation-steering-runs)

---

## Pilots

### [Pilot study: Distributional bias shifts across preference-tuning stages](/research/rlhf-entropy/)
**Dataset-scoped pre-registered pilot with bounded empirical claims**

Sohail Mohammad · Draft, 2026

This pilot examines how behavior shifts across base, SFT, and preference-tuning stages while controlling for measurement artifacts.

[Pilot (Draft)](/research/rlhf-entropy/) · [Code (GitHub)](https://github.com/Sohailm25/rlhf-entropy-pilot)

---

## Experiments

### [Teaching an LLM to Trade Prediction Markets](/research/prediction-market-trader/)
**Chain-of-Thought Reasoning Solves Action Collapse in Low-Cardinality RL**

Sohail Mohammad · February 2025

This experiment shows how reasoning steps can preserve action diversity and reduce policy-collapse behavior in sequential decision settings.

[Write-up](/research/prediction-market-trader/) · [Code (GitHub)](https://github.com/Sohailm25/prime-v-tinker-trader)

---

## Negative Results

Publishing dead ends and blocked paths is part of the research process here.

### [B6 Failure Case: Reliable Decisions, Blocked Internal Explanation](/research/failures/b6-negative-result/)
**Decision-valid behavioral pipeline achieved; mechanism-level path blocked**

Sohail Mohammad · February 2026

Behavior-level decisions were made reliable, but mechanism-level reconstruction gates did not pass. A bounded remediation path then terminated via K2 due to missing required candidate coverage.

[Failure write-up](/research/failures/b6-negative-result/)