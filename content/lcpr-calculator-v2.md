Title: The LCPR Calculator
Date: 2026-04-29
Category: Writings
Slug: lcpr-calculator-v2
Summary: Open-source calculator for loaded cost per result. Three worked examples, cache break-even analysis, KV memory sizing, and the LCPR-2026 framework.
Featured: true
Template: longform_article
Status: published

*I work at Together AI. Technical details have been generalized from production experience; no proprietary information from any organization is disclosed.*

*Production Inference Economics --- Part 3 of 5*

1. [The Denominator Problem]({filename}/denominator-problem.md)
2. [Trace Autopsy]({filename}/trace-autopsy.md)
3. **LCPR Calculator**
4. [Workload Costs]({filename}/workload-costs.md)
5. [Goodput]({filename}/goodput.md)

---

A team I advised ran a support answer pipeline on two routes. Route A: a frontier closed API at $3.00/M input tokens. Route B: a serverless open-weights endpoint at $1.80/M input tokens. The spreadsheet said Route B was 40% cheaper. They switched. Thirty days later, the invoice was higher.

The naive cost per ticket was $0.014. The loaded cost per accepted answer was $0.172. That is a 12x gap between the number the spreadsheet optimized and the number the finance team actually paid.

The gap exists because the spreadsheet measured token price. Token price is the billing meter. It is not the cost model. The cost model includes retries (30% of requests needed re-prompting after schema failures), eval grader calls (every answer ran through a quality gate), human escalation ($2 per case for the 50 tickets per day that failed automated QA), the ops overhead of keeping two inference routes healthy during migration, and the output/input pricing asymmetry (2-6x across major providers) that makes generation-heavy retries disproportionately expensive. None of those costs appear on a pricing page. All of them appear on the invoice.

The LCPR Calculator exists to make this measurement repeatable. It takes your actual workload numbers --- retry rates, quality gate pass rates, human escalation costs, cache hit rates --- and produces the loaded cost per accepted result. Not cost per token. Not cost per request. Cost per result your system actually accepted and served to a user.

This is the tool. Open source. MIT licensed. 239 tests. Three worked examples with seed data you can reproduce. Here is what it does and how to run it.

## What the Calculator Does

Seven computations. Each one isolates a different question about inference economics.

**1. LCPR Comparison.** Loaded cost per accepted work unit across providers and deployment modes (serverless, dedicated, closed API). The formula:

```
LCPR = (C_inference + C_eval + C_human + C_ops + delta) / A
```

Not "cost per token." Not "cost per request." Cost per accepted result. `A` is the count of work units that passed every quality gate and reached the end user. Everything above the line is what you spent to produce them.

**2. Sensitivity Analysis.** Vary one input --- retry rate, quality gate pass rate, cache hit rate, engineering hours --- hold others constant, see which lever matters most. On most quality-sensitive workloads, the quality gate dominates. Not the token price. A 10-point drop in eval pass rate moves LCPR more than a 2x change in per-token pricing.

**3. Break-Even Analysis.** At what daily output token volume does dedicated capacity beat serverless? The answer involves goodput (accepted work per second under SLO), not peak throughput. A dedicated GPU that processes 200 requests per second but only 140 pass your quality gate has a goodput of 140. The break-even calculation uses the number that hits your invoice, not the number that hits your dashboard.

**4. Goodput Frontier.** Accepted requests per second under latency and quality SLOs (see [Goodput or It Didn't Happen]({filename}/goodput.md) for the full derivation):

```
goodput = count(requests meeting ALL gates) / duration
```

The correct capacity metric. Peak throughput is a hardware spec. Goodput is an engineering outcome.

**5. Trace-to-Margin Reconciliation.** From raw traces to account margin via the four-source join (see [The Trace Autopsy]({filename}/trace-autopsy.md)): Trace + Invoice + Eval + Contract. `delta = invoice - trace_derived_cost`. If delta exceeds 5%, investigate. Your traces are either missing calls, miscounting tokens, or the provider is billing something your instrumentation does not capture.

**6. Cache Break-Even.**

```
N_break_even = (p_write - p_read) / (p_in - p_read)
```

Where `p_write` is the cache write cost per token, `p_read` is the cache read (hit) cost, and `p_in` is the standard input price. On Anthropic's 5-minute cache: 2 calls within TTL to break even. On their 1-hour cache: 3 calls. On OpenAI automatic caching: any hit saves money because there is no explicit write cost.

The formula is portable. The numbers are provider-specific. Do not trust the pricing page discount percentage --- trust the break-even count against your measured reuse rate. A 90% cache discount means nothing if your reuse pattern hits the same prefix 1.3 times within the TTL window.

**7. KV Memory Sizing.**

```
kv_bytes_per_token = 2 * layers * KV_heads * head_dim * element_bytes
```

For Llama 3 70B in bf16: 320 KiB per token per sequence. At 4K context with a 40GB KV pool: 26 concurrent sequences. At 128K context: zero. You physically cannot fit a single 128K sequence in a 40GB KV budget on this architecture without quantized KV or offloading.

Context length is a capacity allocation, not just a model setting. Every token of context you allow costs memory that could serve another concurrent user. The calculator makes this trade-off explicit.

## Three Worked Examples

Each example ships with a seed YAML file. Clone the repo, run the seed, get the same numbers.

### Example 1: Support Answer Trace-to-Margin

**Seed:** `examples/support-answer.trace-margin.v1/calculator-seed.yaml`

The 12-request trace from [The Trace Autopsy]({filename}/trace-autopsy.md). Eight customer tickets generate twelve inference calls: six first attempts, two retries after schema validation failures, one eval grader call to score answer quality, one repair call for a grader-rejected response, and two embedding lookups for the RAG retrieval step. Daily fleet: 1,000 tickets submitted, 820 accepted answers delivered.

The numbers:

| Line item | Daily cost | % of total |
|-----------|----------:|----------:|
| Inference (all calls from trace) | $14.20 | 10.1% |
| Invoice delta (rounding, timing) | $0.65 | 0.5% |
| Eval grader cost | $0.80 | 0.6% |
| Human escalation (50 cases at $2.00) | $100.00 | 71.1% |
| Ops overhead allocation | $25.00 | 17.8% |
| **Total loaded** | **$140.65** | **100%** |
| **Accepted answers** | **820** | |

Naive cost per ticket: $14.20 / 1,000 = **$0.014**. You divide inference spend by total tickets and call it the unit cost.

LCPR: $140.65 / 820 = **$0.172**. You divide total loaded cost by accepted results and get the number that matches the invoice.

The 12x gap comes from measuring the wrong thing. The naive calculation excludes 90% of the cost and inflates the denominator by 22% (1,000 tickets submitted vs. 820 accepted).

Human escalation is 71% of total loaded cost. Inference is 10%. Human cost runs roughly 7x inference cost on this workload. The team that switched providers to save on token price was optimizing the 10% while ignoring the 71%. The lever that moves LCPR on this workload is the quality gate pass rate --- every percentage point improvement in automated acceptance moves 50 fewer tickets to human review at $2 each.

### Example 2: Coding Agent Task Lifecycle

**Seed:** `examples/coding-agent.lifecycle.v1/calculator-seed.yaml`

One accepted bug fix across an agent session: 20 LLM calls, 178K input tokens, 18K output tokens, 25 tool calls (file reads, test runs, grep searches). The user submitted a 2K-token bug report. Token fanout: 89x. A 2K prompt becomes 178K input tokens across the session because every subsequent turn re-sends the growing conversation context plus tool results.

Cache behavior is bimodal. The main agent loop hits 82% cache rate --- stable system prompt, growing context window, high prefix overlap between turns. Sub-agent calls (linter, test runner, code search) hit 45% --- fresh context each time, minimal prefix reuse. When a compaction event fires (context exceeds the window and gets summarized), the cached prefix is destroyed. The next turn pays full input price on the compacted context plus a cache write on the new prefix. Cache hit rate across the fleet dropped from 60% to 35% after a compaction policy change.

Fleet: 200 tasks per day, 90% acceptance rate (65% first-pass acceptance + 25% repaired by the agent's self-correction loop), 10% manual developer takeover.

The point: agent economics are multi-turn, multi-model, and cache-dependent. Per-request cost is meaningless when one task generates 20 requests. Per-token cost is meaningless when a single compaction event can swing your effective input rate by 40%. The calculator models the full task lifecycle, not individual calls.

### Example 3: Benchmark Audit

**Seed:** `examples/support-rag-answer-drafting.audit.v1/calculator-seed.yaml`

Two routes benchmarked for the same RAG answer-drafting workload. Route A wins on mean throughput: 45 requests per second vs. Route B's 38. The procurement recommendation goes to Route A.

Route B wins on goodput. Route A has a 72% eval pass rate. Route B has 91%. Under a 2-second P95 latency SLO and the quality gate, Route A's goodput is 28 accepted requests per second. Route B's is 33. The "slower" route produces more accepted work per second.

The benchmark that selected Route A contained eight methodology errors:

1. Closed-loop arrival process (no think time between requests --- inflates throughput by 20-40% vs. production traffic patterns)
2. Cold cache (no prefix caching warmed --- production runs 60%+ cache hit rate)
3. Excluded cold start latency from measurements
4. No retry policy applied to failed requests
5. No quality gate or eval pass rate measured
6. Reported only mean latency (hides tail behavior)
7. No P95/P99 tail percentiles
8. No cost-per-accepted-work calculation

The seed file documents exactly which gaps created the false winner. The missing metadata checklist in the YAML specifies what a production-grade benchmark must capture. Run the seed through the calculator and it produces the goodput-adjusted comparison that reverses the ranking.

## What Changed From the Field Guide

The field guide calculator used a simpler formula:

```
LCPR = (token_cost + repair_cost + engineering_cost) / successful_requests
```

The current calculator aligns with the LCPR-2026 framework from Production Inference Economics:

```
LCPR = (C_inference + C_eval + C_human + C_ops + delta) / A
```

Three changes matter.

**First: split engineering_cost into three terms.** The field guide lumped eval grader calls (inference spend), human escalation (labor), and ops overhead (amortized engineering time) into one bucket called `engineering_cost`. On the support workload, that bucket was 71% human escalation. You cannot see the dominant cost lever until you split the bucket. A team optimizing "engineering cost" might hire faster SREs when the actual problem is that 18% of answers fail the quality gate and land on a human's desk.

**Second: added delta.** The reconciliation term. Trace-derived cost and invoice cost always differ by 2-5%. Sometimes more. The delta captures cache discount application differences, rounding behavior, token count discrepancies between your instrumentation and the provider's billing system, and any API calls your traces missed. The delta is diagnostically important: if it exceeds 5%, your traces are not trustworthy for cost modeling. Fix the instrumentation before optimizing the model.

**Third: added derivation-based computations.** Cache break-even and KV memory sizing give hardware and pricing foundations to decisions that teams currently make by intuition. "Should we enable caching?" is now a formula with a break-even count. "Can we serve 128K context on this GPU?" is now a capacity calculation, not a guess.

239 tests. Every formula is checked against the derivations in the Production Inference Economics series. Every worked example is reproducible from the seed YAML. If a number in this post does not match what the calculator produces from the seed file, the calculator is the source of truth and this post has a bug.

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

# Run all 239 tests
pytest

# Launch the interactive app
streamlit run calculator/app.py
```

Or use the hosted Streamlit app: [inference-econ.streamlit.app](https://inference-econ.streamlit.app).

Bring your own numbers. Edit `calculator/provider_pricing.yaml` with your actual contracted rates (not the pricing page --- your rates). Create a workload profile from your production traces: actual retry rate, actual eval pass rate, actual cache hit rate, actual human escalation volume. Run the sensitivity analysis.

The calculator is a hypothesis. It becomes useful when you replace the default assumptions with measurements from your stack. An LCPR model built on six assumptions is a thought experiment. One built on six measurements from your production logs is a budget.

## Where This Breaks

Not every workload needs LCPR. Be specific about when simpler analysis is sufficient.

**Simple single-turn classification.** If you send a prompt, get a label, and the pass rate is 98%+, token price is a fine proxy for cost. The loaded overhead is negligible. You do not need this calculator.

**Batch workloads with 50% discount.** Batch APIs (OpenAI, Anthropic) offer 50% discounts for async processing. Model cost at the batch level, not per-request. The cache and latency computations in the calculator do not apply to batch --- there are no SLOs and no interactive cache reuse.

**Inference is less than 0.1% of operating cost.** If your inference bill is $200/month and your engineering payroll is $2M/month, spend your analysis time on whatever is 20% of cost. LCPR optimization on a $200 line item is not a productive use of engineering hours.

**Very low volume (under 100 requests per day).** The per-unit ops allocation becomes noisy. Eight engineering hours per month amortized over 3,000 monthly requests adds $0.27 per request in ops overhead alone. That noise overwhelms the signal from token pricing differences.

**Shared dedicated endpoints.** If multiple workloads share a GPU pool, the allocation model for attributing capacity cost to each workload is always wrong. The question is whether it is useful enough to inform decisions. The calculator assumes you can attribute capacity; if you cannot, the dedicated-vs-serverless comparison is directional, not precise.

## Close

The calculator tells you which provider produces accepted work at the lowest loaded cost --- and shows you which input dominates the answer. The difference between those two statements is the difference between a procurement exercise and an engineering decision.

The full argument is in [The Denominator Problem]({filename}/denominator-problem.md). The derivations and formal framework are in the [Production Inference Economics series]({filename}/denominator-problem.md). The calculator is at [github.com/Sohailm25/inference-field-guide](https://github.com/Sohailm25/inference-field-guide).

Contributions welcome: pricing updates as providers change rates, new workload profiles from production deployments, bug reports when the calculator disagrees with the series derivations. File an issue or open a PR.

*Production Inference Economics --- Part 3 of 5*

1. [The Denominator Problem]({filename}/denominator-problem.md)
2. [Trace Autopsy]({filename}/trace-autopsy.md)
3. **LCPR Calculator**
4. [Workload Costs]({filename}/workload-costs.md)
5. [Goodput]({filename}/goodput.md)

*Sohail Mohammad --- April 2026*

---

*Numbers are anonymized and should not be attributed to any specific employer, customer, or deployment.*
