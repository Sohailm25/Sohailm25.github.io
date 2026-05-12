Title: Research
Slug: research
Template: page

A curated index of publications, experiments, and negative results.

## Recent Publications and Reports

### [Persona Circuits: Progress & Findings (3-17-2026)](/research/experiments/persona-circuits-current-state/)
**Steering, concentration, and selectivity analysis**

Current-state synthesis of persona-circuits: robust steering and partial concentration support, but mixed-to-negative evidence for stronger distinctness, necessity, and sufficiency claims under current protocols.

[Write-up](/research/experiments/persona-circuits-current-state/) · [Code (GitHub)](https://github.com/Sohailm25/persona-circuits)

### [Persona Circuits: Exploring GLP Application](/research/experiments/glp-persona-circuits-current-state/)
**GLP transfer for activation geometry repair**

Branch report testing whether GLP can preserve steering semantics while repairing activation geometry. In this setting, public-checkpoint transfer failed, matched checkpoints were more stable but still nonselective, and mixed clean+edited training is the key pending test.

[Write-up](/research/experiments/glp-persona-circuits-current-state/) · [Code (GitHub)](https://github.com/Sohailm25/persona-circuits)

### [Latent Depth-Routing Spectroscopy in Standard Transformers](/research/latent-depth-routing/)
**Oracle evidence for input-dependent effective depth mixtures in frozen Gemma-2-2b**

Sohail Mohammad · Preprint, 2026

Oracle-alpha recovers input-dependent effective depth mixtures from frozen Gemma-2-2b without modifying model weights. On 1024 stratified prompts, oracle routing improves next-token loss by +1.63 nats (1024/1024 positive), with held-out predicted routing generalizing positively (R^2 = 0.24). Softmax-constrained routing outperforms unconstrained and top-k alternatives via a competition mechanism. Extension lanes (tool-breakage, safety, OIH) provide bounded evidence with explicit caveats.

[Distill page](/research/latent-depth-routing/) · [Paper (PDF)]({static}/papers/latent-depth-routing-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/latent-depth-routing)

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
