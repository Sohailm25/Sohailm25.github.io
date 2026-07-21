Title: Inference Economics
Slug: inference-economics
Template: inference-economics
Summary: The math, diagnostics, and tools for measuring what production LLM inference actually costs: loaded cost per accepted result (LCPR), not price per million tokens. Includes the Field Guide book and the LCPR calculator.

Production inference costs more than your token bill suggests. This work develops the math, the diagnostics, and the tools to measure what inference actually costs --- loaded cost per accepted result, not price per million tokens.

## The Book

**[Production Inference Economics: A Field Guide](/book/)** is the canonical reference. Twenty-seven chapters across five parts: the economic unit (LCPR), serving physics, workload economics, migration gates, and operating the decision. Covers how to measure, model, and operate production inference so you pick the cheapest reliable architecture that still meets quality, latency, and reliability requirements. Start [at the Opener](/book/opener/) and read straight through, or use Part 0 to pick a reading path.

## The Long Essay

**[The Honest Field Guide to Production Inference](/inference-field-guide/)** is the single-essay version: TCO frameworks, vendor evaluation, architecture patterns, and a staged playbook from API to dedicated GPU. Read this if you want the framework in one sitting.

## Production Inference Economics Series

Three articles develop the measurement methodology in depth. Each stands alone; together they form a sequence.

1. **[The Denominator Problem](/denominator-problem/)** --- The most common mistake in inference economics is dividing by the wrong number. Loaded cost per result (LCPR) exposes the gap between naive token cost and actual production cost on a quality-sensitive workload.

2. **[The LCPR Calculator](/lcpr-calculator-v2/)** --- Open-source calculator implementing the four-source join (trace + invoice + eval + contract) as code. Three worked examples, cache break-even analysis, and KV memory sizing.

3. **[What Your Workload Actually Costs](/workload-costs/)** --- Not all inference is the same. Per-workload LCPR exposes the cross-subsidy that blended averages hide, with cost models for conversational, agentic, RAG, extraction, voice, and batch workloads.

## Companion Pieces

Two longer essays expand on specific chapters of the book.

- **[Trace Autopsy](/trace-autopsy/)** --- A repeatable diagnostic for going from raw trace events to loaded cost per accepted result. Companion to Chapter 25 of the book (which develops the method on a different anonymized regulated-workload scenario).

- **[Goodput or It Didn't Happen](/goodput/)** --- GPU utilization can be 78% while 30% of requests fail SLO constraints. The goodput frontier replaces single-number benchmarks with decision-grade surfaces. Excerpted from Chapter 9 of the book.

## Tools

**[LCPR Calculator](https://inference-econ.streamlit.app)** --- Interactive Streamlit app for LCPR comparison, sensitivity analysis, break-even analysis, migration readiness, and goodput frontier testing. [Source code on GitHub.](https://github.com/Sohailm25/inference-field-guide)
