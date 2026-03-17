Title: Research
Slug: research
Template: page

<div class="category-tabs" style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap; justify-content: center;">
  <button class="category-tab active" data-category="all" onclick="filterResearchCategory('all')">All</button>
  <button class="category-tab" data-category="papers" onclick="filterResearchCategory('papers')">Papers</button>
  <button class="category-tab" data-category="pilots" onclick="filterResearchCategory('pilots')">Pilots</button>
  <button class="category-tab" data-category="experiments" onclick="filterResearchCategory('experiments')">Experiments</button>
  <button class="category-tab" data-category="failures" onclick="filterResearchCategory('failures')">Failures</button>
</div>

## Papers

### [Depth-Dynamics Signatures of Conversational Collapse](/research/ftle/)
**Finite-Time Lyapunov Analysis of Transformer Forward Passes**

Sohail Mohammad · Preprint, 2026

This asks whether we can spot early warning signs of conversational breakdown by looking inside model layer dynamics.
If these signals hold up, they could help us diagnose unstable model behavior before it shows up in user-facing conversations.

[Paper (PDF)]({static}/papers/ftle-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/escape-velocity)

### [Condition-Dependent Collapse Dynamics in Multi-Turn LLM Self-Play](/research/escape-velocity/)
**Baseline collapse dynamics with transparent reliability limits**

Sohail Mohammad · Preprint, 2026

This baseline study asks a simple question: when LLMs talk over many turns, which setups stay coherent and which ones collapse into repetition?
The goal is to map the failure landscape clearly so future research can build better conversation stability tests and safeguards.

*Path B disclosure:* Detector reliability prereg gate was **not met**; no detector-validation claim is made.

[Paper (PDF)]({static}/papers/escape-velocity-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/escape-velocity)

### [Inverse Scaling in Activation Steering](/research/activation-steering/)
**Architecture and Scale Dependence of Refusal Manipulation**

Sohail Mohammad · Preprint, 2026

This tests how reliably we can nudge model refusal behavior using activation steering across different model sizes and families.
The purpose is to understand where steering is practical versus brittle, so safety and control methods are used with realistic expectations.

[Paper (PDF)]({static}/papers/activation-steering-2026.pdf) · [Code (GitHub)](https://github.com/Sohailm25/activation-steering-runs)


## Experiments

### [Persona Circuits Current State: What Held Up, What Broke, and What We Learned](/research/experiments/persona-circuits-current-state/)
**Current-state synthesis with explicit hypothesis boundaries (H1–H5)**

Sohail Mohammad · March 2026

Mainline synthesis of the persona-circuits experiment: robust steering and partial concentration support, but mixed-to-negative evidence for stronger distinctness, necessity, and sufficiency claims under current protocols.

[Write-up](/research/experiments/persona-circuits-current-state/) · [Code (GitHub)](https://github.com/Sohailm25/persona-circuits)

### [Persona Circuits Branch Report: What We Learned Trying GLP Activation Repair](/research/experiments/glp-persona-circuits-current-state/)
**Branch analysis of GLP as activation repair under explicit G1–G3 hypotheses**

Sohail Mohammad · March 2026

Branch report testing whether GLP can preserve steering semantics while repairing activation geometry. In this setting, public-checkpoint transfer failed, matched checkpoints were more stable but still nonselective, and mixed clean+edited training is now the key pending test.

[Write-up](/research/experiments/glp-persona-circuits-current-state/) · [Code (GitHub)](https://github.com/Sohailm25/persona-circuits)

### [Teaching an LLM to Trade Prediction Markets](/research/prediction-market-trader/)
**Chain-of-Thought Reasoning Solves Action Collapse in Low-Cardinality RL**

Sohail Mohammad · February 2025

This experiment explores why RL agents in trading settings often overfit to one repetitive action even when returns look fine.
It shows that adding reasoning steps can preserve better decision diversity, which matters for robustness in real sequential decision tasks.

[Write-up](/research/prediction-market-trader/) · [Code (GitHub)](https://github.com/Sohailm25/prime-v-tinker-trader)


## Pilots

### [Pilot study: Distributional bias shifts across preference-tuning stages](/research/rlhf-entropy/)
**Dataset-scoped pre-registered pilot with bounded empirical claims**

Sohail Mohammad · Draft, 2026

This pilot examines how model bias signals shift from base training to instruction tuning and preference tuning.
The aim is to separate real behavior changes from measurement artifacts so conclusions about alignment effects are more trustworthy.

[Pilot (Draft)](/research/rlhf-entropy/) · [Code (GitHub)](https://github.com/Sohailm25/rlhf-entropy-pilot)

## Failures

This section is for dead ends, null results, and failed hypotheses that still teach something important.
Publishing failures makes the research process more honest and helps others avoid repeating the same mistakes.

### [B6 Failure Case: Reliable Decisions, Blocked Internal Explanation](/research/failures/b6-negative-result/)
**Decision-valid behavioral pipeline achieved; mechanism-level path blocked**

Sohail Mohammad · February 2026

In plain terms: we succeeded in making behavior-level decisions reliable, but failed the internal reconstruction gate needed for mechanism-level claims. A bounded remediation path (Option 2) then terminated via K2 when required candidate coverage did not exist (A=0/4, B=0/4).

[Failure write-up](/research/failures/b6-negative-result/)

<style>
.category-tab {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.9em;
  transition: all 0.2s ease;
}

.category-tab:hover {
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.category-tab.active {
  background: var(--accent-color);
  color: var(--bg-primary);
  border-color: var(--accent-color);
}
</style>

<script>
function filterResearchCategory(category) {
  document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
  const activeTab = document.querySelector(`[data-category="${category}"]`);
  if (activeTab) activeTab.classList.add('active');

  const h2s = Array.from(document.querySelectorAll('h2'));
  const findSection = (name) => h2s.find(h => h.textContent.trim().toLowerCase() === name);

  const sections = {
    papers: findSection('papers'),
    experiments: findSection('experiments'),
    failures: findSection('failures'),
    pilots: findSection('pilots')
  };

  Object.entries(sections).forEach(([key, heading]) => {
    if (!heading) return;

    let node = heading;
    const visible = category === 'all' || category === key;
    while (node) {
      node.style.display = visible ? '' : 'none';
      node = node.nextElementSibling;
      if (node && node.tagName === 'H2') break;
    }
  });
}
</script>
