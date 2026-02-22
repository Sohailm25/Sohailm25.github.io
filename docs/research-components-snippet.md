# Research Components Snippet (Reusable)

Use this drop-in block on any research page to add:
- 4-card KPI grid
- Collapsible findings

---

## 1) HTML (drop into page body)

```html
<!-- KPI GRID -->
<section>
  <h2 id="topline-metrics">Topline Metrics</h2>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Samples / Runs</div>
      <div class="kpi-value">720</div>
      <div class="kpi-note">optional context</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Primary Effect</div>
      <div class="kpi-value">ρ = 0.62</div>
      <div class="kpi-note">optional context</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Significance</div>
      <div class="kpi-value">p &lt; 0.01</div>
      <div class="kpi-note">optional context</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Compute Cost</div>
      <div class="kpi-value">14.3 GPUh</div>
      <div class="kpi-note">optional context</div>
    </div>
  </div>
</section>

<!-- COLLAPSIBLE FINDINGS -->
<section>
  <h2 id="findings">Findings</h2>

  <details class="finding" open>
    <summary>Finding 1 — headline insight</summary>
    <div class="finding-body">
      Expanded detail: interpretation, caveat, implication, and pointer to figure/table.
    </div>
  </details>

  <details class="finding">
    <summary>Finding 2 — secondary result</summary>
    <div class="finding-body">
      Expanded detail for the second finding.
    </div>
  </details>

  <details class="finding">
    <summary>Finding 3 — deployment/transfer implication</summary>
    <div class="finding-body">
      Expanded detail for the third finding.
    </div>
  </details>
</section>
```

---

## 2) CSS (drop into page `<style>`)

```css
/* 4-card KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 1.25rem 0 1.75rem;
}

@media (max-width: 720px) {
  .kpi-grid { grid-template-columns: 1fr; }
}

.kpi-card {
  background: var(--card, #343f44);
  border: 1px solid var(--border, #4a555b);
  border-radius: 10px;
  padding: 16px;
}

.kpi-label {
  color: var(--muted, #9aa79f);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.kpi-value {
  color: var(--green, #a7c080);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.2;
}

.kpi-note {
  color: var(--muted, #9aa79f);
  font-size: 0.9rem;
  margin-top: 6px;
}

/* Collapsible findings (native details/summary, no JS) */
details.finding {
  background: var(--card, #343f44);
  border: 1px solid var(--border, #4a555b);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 10px 0;
}

details.finding summary {
  cursor: pointer;
  color: var(--text, #d3c6aa);
  font-weight: 600;
  list-style: none;
}

details.finding summary::-webkit-details-marker { display: none; }

details.finding summary::before {
  content: "▸ ";
  color: var(--yellow, #dbbc7f);
  font-weight: 700;
}

details.finding[open] summary::before { content: "▾ "; }

.finding-body {
  color: var(--muted, #9aa79f);
  margin-top: 8px;
}
```

---

## 3) Authoring rules (keep pages consistent)

1. Keep exactly **4 KPI cards** for scannability.
2. KPI labels are short noun phrases (2–4 words).
3. KPI values are single-line where possible.
4. Open only the first finding by default (`open`).
5. Finding summary = one sentence headline; body = interpretation + caveat + implication.
6. Do not add JS unless absolutely necessary (native `<details>` is preferred).
