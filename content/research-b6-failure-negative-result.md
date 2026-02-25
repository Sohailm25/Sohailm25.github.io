Title: B6 Negative Result: Decision-Valid Pipeline, Blocked Mechanistic Path
Date: 2026-02-25
Status: draft
Slug: research/failures/b6-negative-result
Category: Research
Tags: research, failures, mechanistic-interpretability, governance, reproducibility
Summary: We built a decision-valid behavior pipeline for SAS vs DIM, but reconstruction unlock failed and bounded remediation terminated via candidate non-availability (K2). This is a high-quality negative result with explicit claim boundaries.

# B6 Negative Result: Reliable Decisions, Honest Limits

## If you only read one section, read this
We built a reliable behavior-level decision pipeline. We could trust decisions from outputs after fixing scoring and gate logic. But we could not prove internal explanation quality was good enough for mechanistic claims. A bounded remediation attempt ended under a hard stop rule (K2) because required candidate paths were not available. So this branch is closed for now under a limitation lock.

---

## What we were trying to do
We tested SAS vs DIM with two separate goals:
1) make behavior-level decisions reliable, and
2) support mechanism-level interpretation only if strict internal gates passed.

We separated those goals on purpose to avoid overclaiming.

## What worked
- Decision-valid pipeline passed under v2 scoring.
- Stability logic was corrected (branch agreement, not score equality).
- Full required stability coverage was completed under governance lock.

### Figure 1 — Decision-validity pass summary
![Decision-validity pass summary]({static}/images/research/failures/decision_validity_pass_summary_v2.png)

## What did not work
Reconstruction unlock failed for all four required tuple setups on nMSE.

### Figure 2 — Reconstruction unlock failure (nMSE vs threshold)
![Reconstruction unlock nMSE failure]({static}/images/research/failures/reconstruction_unlock_nmse_failure_v1.png)

## Why Option 2 ended
Option 2 was a bounded remediation path with fixed thresholds and hard stop rules. It terminated under **K2** after definitive Stage 0 checks:
- Candidate A: 0/4 coverage
- Candidate B: 0/4 coverage

### Figure 3 — Option 2 K2 termination path
![Option 2 K2 termination]({static}/images/research/failures/option2_k2_termination_diagram_v1.png)

## Beyond “necessary/sufficient”: validity ladder
We use a stricter ladder:
1. Behavioral effect
2. Decision validity
3. Selectivity/leakage checks
4. Alternative-cause checks (X′)
5. Mechanistic specificity

Current phase reached 1–2 strongly, built part of 3 discipline, and is blocked before 5.

### Figure 4 — Validity ladder position
![Validity ladder position]({static}/images/research/failures/validity_ladder_position_v1.png)

---

## What we can claim / cannot claim
### We can claim
- The behavior-level decision pipeline is decision-valid under current governance.
- Reconstruction unlock failed under fixed prereg thresholds.
- Option 2 terminated via K2 after auth-resolved definitive checks.

### We cannot claim
- Mechanistic-specific or causal mechanism claims for this phase.
- Unconstrained branch robustness.
- Phase advancement based on reconstruction success.

---

## Scientific integrity box
**This is a negative result with preserved value.**

Why this still matters:
- It shows how to separate behavior validity from mechanism validity.
- It demonstrates anti-overclaim governance in practice.
- It gives a reusable framework for strict gates, clear stop rules, and transparent closeout.

---

## Final state and reopen condition
- `active_path: limitation_lock_for_current_phase`
- `phase_movement_authorized: false`
- `decision_state: conditional_hold`

Reopen only if new SAE releases provide required tuple coverage.
