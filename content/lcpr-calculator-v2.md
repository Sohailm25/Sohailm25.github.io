Title: The LCPR Calculator
Date: 2026-04-29
Category: Writings
Slug: lcpr-calculator-v2
Summary: Open-source calculator for loaded cost per result. Three worked examples, cache break-even analysis, and KV memory sizing.
Featured: true
Template: longform_article
Status: published

*I work at Together AI. Technical details have been generalized from production experience; no proprietary information from any organization is disclosed.*

*Production Inference Economics — Part 2 of 3*

1. [The Denominator Problem]({filename}/denominator-problem.md)
2. **LCPR Calculator**
3. [Workload Costs]({filename}/workload-costs.md)

---

The LCPR Calculator implements the loaded-cost framework from [The Denominator Problem]({filename}/denominator-problem.md) as a Python tool. Trace data, provider invoice, eval results, and contract terms go in. LCPR, margin, cache-break-even, and sensitivity surfaces come out.
{: .has-dropcap}

Open source. MIT licensed. Three worked examples with seed YAML you can reproduce.

## Seven computations

Each isolates a different question.

**1. LCPR Comparison.** Loaded cost per accepted result across providers and deployment modes. Formula and definitions in [Article 1]({filename}/denominator-problem.md). The comparison surfaces which deployment minimizes loaded cost, usually not the one minimizing per-token cost.

**2. Sensitivity Analysis.** Vary one input (retry rate, quality gate pass rate, cache hit rate, engineering hours), hold others constant, see which lever matters most. On quality-sensitive workloads, the quality gate dominates the token price. A 10-point drop in eval pass rate moves LCPR more than a 2x change in per-token pricing.

**3. Break-Even Analysis.** At what daily output token volume does dedicated capacity beat serverless? The answer involves goodput (accepted work per second under SLO), not peak throughput. A dedicated GPU that processes 200 requests per second but only 140 pass your quality gate has a goodput of 140. The break-even calculation uses the number that hits your invoice, not the number that hits your dashboard.

**4. goodput frontier.** Accepted requests per second under latency and quality SLOs:

```
goodput = count(requests meeting ALL gates) / duration
```

Peak throughput is a hardware spec. Goodput is an engineering outcome. The full productive-capacity framework is developed in Chapter 9 of *Production Inference Economics: A Field Guide*.

**5. Trace-to-loaded-cost reconciliation.** From raw traces to reconciled loaded cost via the four-source join (Trace + Invoice + Eval + Contract). `delta = invoice - trace_derived_cost`. If delta exceeds 5%, investigate. Your traces are either missing calls, miscounting tokens, or the provider is billing something your instrumentation does not capture. The full reconciliation method is in Chapter 25 of the book.

**6. Cache Break-Even.**

```
N_break_even = (p_write - p_read) / (p_in - p_read)
```

Where `p_write` is the cache write cost per token, `p_read` is the cache read (hit) cost, and `p_in` is the standard input price. On Anthropic's 5-minute cache: 2 calls within TTL to break even. On their 1-hour cache: 3 calls. On OpenAI automatic caching: any hit saves money because there is no explicit write cost.

The formula is portable; provider numbers are not. Don't trust the pricing page discount percentage; trust the break-even count against your measured reuse rate. A 90% cache discount means nothing at a reuse rate of 1.3 hits per TTL.

**7. KV Memory Sizing.**

```
kv_bytes_per_token = 2 * layers * KV_heads * head_dim * element_bytes
```

For Llama 3 70B in bf16: 320 KiB per token per sequence. At 4K context with a 40GB KV pool: roughly 26 concurrent sequences after accounting for non-KV memory overhead. At 128K context: zero. You physically cannot fit a single 128K sequence in a 40GB KV budget on this architecture without quantized KV or offloading.

Context length is a capacity allocation, not just a model setting. Every token of context you allow costs memory that could serve another concurrent user. The calculator makes this trade-off explicit.

## Three Worked Examples

Each example ships with a seed YAML file. Clone the repo, run the seed, get the same numbers.

### Example 1: Support Answer trace-to-loaded-cost

**Seed:** `examples/support-answer.trace-margin.v1/calculator-seed.yaml`

The full breakdown is in [Article 1]({filename}/denominator-problem.md). The seed YAML reproduces the same numbers if you want to verify the calculator against them: daily fleet of 1,000 tickets submitted, 820 accepted answers delivered, total loaded cost $140.65, LCPR $0.172, naive cost per ticket $0.014.

Human escalation is 71% of loaded cost; inference is 10%. The non-token costs run 7x the inference bill on this workload. The team that switched providers to save on token price was optimizing the 10% while ignoring the 71%. The lever that moves LCPR on this workload is the quality gate pass rate; every percentage point improvement in automated acceptance moves 50 fewer tickets to human review at $2 each.

### Example 2: Coding Agent Task Lifecycle

**Seed:** `examples/coding-agent.lifecycle.v1/calculator-seed.yaml`

One accepted bug fix across an agent session: 20 LLM calls, 178K input tokens, 18K output tokens, 25 tool calls (file reads, test runs, grep searches). The user submitted a 2K-token bug report. Token fanout: 89x. A 2K prompt becomes 178K input tokens across the session because every subsequent turn re-sends the growing conversation context plus tool results.

Cache behavior is bimodal. The main agent loop hits 82% cache rate (stable system prompt, growing context window, high prefix overlap between turns). Sub-agent calls (linter, test runner, code search) hit 45% (fresh context each time, minimal prefix reuse). When a compaction event fires (context exceeds the window and gets summarized), the cached prefix is destroyed. The next turn pays full input price on the compacted context plus a cache write on the new prefix. Cache hit rate across the fleet dropped from 60% to 35% after a compaction policy change.

Fleet: 200 tasks per day, 90% acceptance rate (65% first-pass acceptance + 25% repaired by the agent's self-correction loop), 10% manual developer takeover.

Agent economics live at the task level, not the request level. A task that generates 20 model calls makes per-request cost noise. A single compaction event swings effective input rate 40%, which makes per-token cost noise. The calculator models the full task lifecycle.

### Example 3: Benchmark Audit

**Seed:** `examples/support-rag-answer-drafting.audit.v1/calculator-seed.yaml`

Two routes benchmarked for the same RAG answer-drafting workload. Route A wins on mean throughput: 45 requests per second vs. Route B's 38. The procurement recommendation goes to Route A.

Route B wins on goodput. Route A has a 72% eval pass rate. Route B has 91%. Under a 2-second P95 latency SLO and the quality gate, Route A's goodput is 28 accepted requests per second. Route B's is 33. The "slower" route produces more accepted work per second.

The benchmark that selected Route A contained eight methodology errors:

1. Closed-loop arrival process (no think time between requests; inflates throughput by 20-40% vs. production traffic patterns)
2. Cold cache (no prefix caching warmed; production runs 60%+ cache hit rate)
3. Excluded cold start latency from measurements
4. No retry policy applied to failed requests
5. No quality gate or eval pass rate measured
6. Reported only mean latency (hides tail behavior)
7. No P95/P99 tail percentiles
8. No cost-per-accepted-work calculation

The seed file documents exactly which gaps created the false winner. The missing metadata checklist in the YAML specifies what a production-grade benchmark must capture. Run the seed through the calculator and it produces the goodput-adjusted comparison that reverses the ranking.

## How the formula evolved

The calculator's LCPR formula matches the definition in Article 1: `C_inference + C_eval + C_human + C_ops + delta` over accepted-work units. The earlier field-guide formula collapsed eval, human, and ops costs into a single `engineering_cost` bucket; splitting them surfaced that 71% of `engineering_cost` was human escalation on the support workload, which is the lever a unified bucket hides.

200+ tests check every formula against the series derivations. Every worked example reproduces from its seed YAML. If a number in this post doesn't match what the calculator produces, the calculator is the source of truth.

## How to Use It

```bash
# Clone and install
git clone https://github.com/Sohailm25/inference-field-guide.git
cd inference-field-guide
pip install -e ".[dev]"

# Run the CLI
lcpr compare --profile saas_chat
lcpr crossover
lcpr sensitivity --vary retry_rate

# Run the worked examples
python -m examples.run_seeds

# Run the tests
pytest

# Launch the interactive app
streamlit run calculator/app.py
```

Or use the hosted Streamlit app: [inference-econ.streamlit.app](https://inference-econ.streamlit.app).

Bring your own numbers. Edit `calculator/provider_pricing.yaml` with your actual contracted rates (not the pricing page; your rates). Create a workload profile from your production traces: actual retry rate, actual eval pass rate, actual cache hit rate, actual human escalation volume. Run the sensitivity analysis.

The calculator is a hypothesis. It becomes useful when you replace the default assumptions with measurements from your stack. An LCPR model built on six assumptions is a thought experiment. One built on six measurements from your production logs is a budget.

## Where This Breaks

Not every workload needs LCPR. Be specific about when simpler analysis is sufficient.

**Simple single-turn classification.** If you send a prompt, get a label, and the pass rate is 98%+, token price is a fine proxy for cost. The loaded overhead is negligible. You do not need this calculator.

**Batch workloads with 50% discount.** Batch APIs (OpenAI, Anthropic) offer 50% discounts for async processing. Model cost at the batch level, not per-request. The cache and latency computations in the calculator do not apply to batch (no SLOs, no interactive cache reuse).

**Inference is less than 0.1% of operating cost.** If your inference bill is $200/month and your engineering payroll is $2M/month, spend your analysis time on whatever is 20% of cost. LCPR optimization on a $200 line item is not a productive use of engineering hours.

**Very low volume (under 100 requests per day).** The per-unit ops allocation becomes noisy. Eight engineering hours per month amortized over 3,000 monthly requests adds $0.27 per request in ops overhead alone. That noise overwhelms the signal from token pricing differences.

**Shared dedicated endpoints.** If multiple workloads share a GPU pool, the allocation model for attributing capacity cost to each workload is always wrong. The question is whether it is useful enough to inform decisions. The calculator assumes you can attribute capacity; if you cannot, the dedicated-vs-serverless comparison is directional, not precise.

## Close

The calculator returns the loaded-cost ranking and the dominant input that drove it. One number for procurement, one diagnostic for engineering.

The full argument is in [The Denominator Problem]({filename}/denominator-problem.md). The derivations and formal framework are in *Production Inference Economics: A Field Guide*. The calculator is at [github.com/Sohailm25/inference-field-guide](https://github.com/Sohailm25/inference-field-guide).

Contributions welcome: pricing updates as providers change rates, new workload profiles from production deployments, bug reports when the calculator disagrees with the derivations. File an issue or open a PR.

*Production Inference Economics — Part 2 of 3*

1. [The Denominator Problem]({filename}/denominator-problem.md)
2. **LCPR Calculator**
3. [Workload Costs]({filename}/workload-costs.md)

*Sohail Mohammad — April 2026*

---

*Numbers are anonymized and should not be attributed to any specific employer, customer, or deployment.*
