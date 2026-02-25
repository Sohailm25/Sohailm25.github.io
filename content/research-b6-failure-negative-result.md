Title: B6 Failure Case: Reliable Decisions, Blocked Internal Explanation
Date: 2026-02-25
Slug: research/failures/b6-negative-result
Category: Research
Tags: research, failures, activation-steering, governance
Summary: We built a reliable behavior-level decision pipeline, but we could not prove internal explanation quality was good enough for mechanism-level claims.

## Purpose in one sentence
We used SAEs to see if we could steer refusal behavior through sparse internal features and still keep claims scientifically honest.

## Original hypothesis
We believed SAE features could provide a sparse, interpretable control handle for refusal behavior.

Hypothesis: SAS (using SAE features) could match or improve behavioral control vs DIM, and also support stronger mechanistic interpretation **if** reconstruction quality passed the gate.

## Why SAEs were central in this experiment
SAEs are a tool that breaks model activations into sparse features. We used them for three concrete jobs: identify candidate refusal-related features, intervene on those features with SAS to steer outputs, and then test whether reconstruction quality was strong enough to justify mechanism-level claims. The key outcome is that the reconstruction gate failed, so we cannot claim SAEs provided mechanistic specificity in this phase.

## What we were trying to do
We were trying to do two things at the same time:

1. Make refusal behavior steering reliable at the output level.
2. Verify internal explanation quality before making mechanism-level claims.

In simple terms: we wanted control that works, and evidence strong enough to explain *why* it works.

## What the actual experiment was
We ran a fixed SAE-centered pipeline in this order:

1. Run model outputs on the locked evaluation setup to collect behavior and activation traces.
2. Use SAE features to define SAS interventions, then score outputs with a locked generation metric (after scorer fixes).
3. Test stability of the SAE-based intervention pipeline across seeds and paraphrases.
4. Test SAE reconstruction unlock to see if internal explanation quality clears the gate.
5. If unlock fails, run a bounded remediation attempt for alternative SAE candidates with hard stop rules.

That means this was not one single test. It was a gated process where each step had to pass before stronger claims were allowed.

## How we executed (timeline)
- We fixed scorer logic and moved from v1 to v2.
- We achieved decision-valid status for behavior-level decisions.
- We failed reconstruction unlock.
- We launched Option 2 remediation with fixed rules and stop criteria.
- We terminated Option 2 via K2 when candidate coverage was not available.

## What failed and why
Two concrete failures blocked mechanism-level progress:

- Reconstruction quality failed on nMSE across all required tuples (`0.163–0.195` vs threshold `<= 0.12`).
- Remediation candidates were unavailable for required coverage (A=`0/4`, B=`0/4`).

Important: this was **not** a budget or time stall. The path ended because required candidate assets did not exist for the needed tuple coverage.

## What we learned (for other researchers)
- Keep behavioral validity separate from mechanism validity.
- Do not let output success automatically become mechanism claims.
- Add leakage/overclaim guardrails early.
- Define hard stop criteria before remediation starts.
- Publish negative results with full provenance and clear claim limits.

## What we can and cannot claim
### We can claim
- The behavior-level decision pipeline is reliable under current constraints.
- Mechanism-level support did not pass in this phase.
- This branch is closed for now under limitation lock.

### We cannot claim
- Mechanistic-specific or causal mechanism conclusions for this phase.
- Unconstrained robustness claims.
- Phase advancement based on reconstruction success.

## What would reopen this work
Only one condition reopens this path:
- New SAE releases must provide required tuple coverage.

## Final state
- `active_path: limitation_lock_for_current_phase`
- `phase_movement_authorized: false`
- `decision_state: conditional_hold`
