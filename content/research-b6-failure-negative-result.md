Title: B6 Failure Case: Reliable Decisions, Blocked Internal Explanation
Date: 2026-02-25
Slug: research/failures/b6-negative-result
Category: Research
Tags: research, failures, activation-steering, governance
Summary: We built a reliable behavior-level decision pipeline, but we could not prove internal explanation quality was good enough for mechanism-level claims.

## What we were trying to do (plain terms)
We were trying to answer one question:

**Can we change refusal behavior in a model in a way that is both reliable and honestly explainable?**

That has two parts:
1. Behavior part: can we steer outputs predictably?
2. Explanation part: can we show internal evidence strong enough for mechanism-level claims?

## What worked
We made the behavior measurement pipeline trustworthy.
- We fixed scoring bugs.
- We used real persisted outputs.
- We locked decision rules and reran checks.

Result: we reached **decision-validity** for output-level decisions under current constraints.

## What failed
We failed the reconstruction quality gate needed for mechanism-level claims.
- nMSE missed threshold on all required setups.
- So we cannot honestly claim we understand the mechanism in this phase.

We then tried a bounded fix path (Option 2), but it terminated under K2.
- Why: the candidate SAE paths needed for required tuples did not exist.
- Candidate A coverage: 0/4
- Candidate B coverage: 0/4

So no further remediation run could start in that path.

## Why this still matters
This is a useful negative result, not just a failed attempt.
It shows exactly where the failure happened:
- not budget,
- not vague instability,
- but reconstruction gate failure plus candidate non-availability.

It also shows an important research lesson:
You can have valid behavior control without valid mechanism claims.
Those are separate gates and should be treated separately.

## What we can claim vs cannot claim
### We can claim
- We built a decision-valid behavioral pipeline.
- Mechanism-level interpretation is not supported in this phase.
- This branch is closed under limitation lock until new SAE coverage exists.

### We cannot claim
- Strong mechanistic-specificity claims.
- Unconstrained branch-robustness claims.
- Any phase-advance claim based on reconstruction success.

## Final state
- `active_path: limitation_lock_for_current_phase`
- `phase_movement_authorized: false`
- `decision_state: conditional_hold`

## Reopen condition
Reopen only if new SAE releases provide required tuple coverage.
