Title: Inference Economics
Slug: inference-economics
Template: inference-economics

Production inference costs more than your token bill suggests. This series develops the math, the diagnostics, and the tools to measure what inference actually costs --- loaded cost per accepted result, not price per million tokens.

## The Field Guide

[The Honest Field Guide to Production Inference](/inference-field-guide/) is the comprehensive overview: TCO frameworks, vendor evaluation, architecture patterns, and a staged playbook from API to dedicated GPU. Start here if you want the full picture.

## Production Inference Economics Series

The series develops the measurement methodology in depth. Each article stands alone, but they build on each other.

1. **[The Denominator Problem](/denominator-problem/)** --- The most common mistake in inference economics is dividing by the wrong number. LCPR reveals a 12x gap between naive token cost and actual production cost.

2. **[Trace Autopsy](/trace-autopsy/)** --- A repeatable diagnostic for going from raw trace events to loaded cost per accepted result. Four data sources, one reconciliation protocol.

3. **[LCPR Calculator](/lcpr-calculator-v2/)** --- Open-source calculator implementing the four-source join as code. Three worked examples, cache break-even analysis, and KV memory sizing.

4. **[What Your Workload Actually Costs](/workload-costs/)** --- Not all inference is the same. Per-workload LCPR exposes the cross-subsidy that blended averages hide, with cost models for conversational, agentic, RAG, extraction, voice, and batch workloads.

5. **[Goodput or It Didn't Happen](/goodput/)** --- GPU utilization can be 78% while 30% of requests fail SLO constraints. The Goodput Frontier Test replaces single-number benchmarks with decision-grade surfaces.

## Tools

**[LCPR Calculator](https://inference-econ.streamlit.app)** --- Interactive Streamlit app for LCPR comparison, sensitivity analysis, break-even analysis, migration readiness, and goodput frontier testing. [Source code on GitHub.](https://github.com/Sohailm25/inference-field-guide)

## Book

The full book will be available as a free PDF and EPUB. Sign up for [The Forge](mailto:sohailmo.ai@gmail.com) to be notified when it ships.
