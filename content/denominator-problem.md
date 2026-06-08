Title: The Denominator Problem
Date: 2026-04-15
Category: Writings
Slug: denominator-problem
Summary: The most common mistake in inference economics is dividing by the wrong number. LCPR (loaded cost per accepted result) reveals a 12x gap between naive token cost and actual production cost.
Template: longform_article
Status: published

*I work at Together AI. Technical details have been generalized from production experience; no proprietary information from any organization is disclosed.*

*Production Inference Economics — Part 1 of 3*

1. **The Denominator Problem**
2. [LCPR Calculator]({filename}/lcpr-calculator-v2.md)
3. [Workload Costs]({filename}/workload-costs.md)

The full framework is in *Production Inference Economics: A Field Guide*. Chapter 25 develops the trace-to-margin reconciliation method; Chapter 9 develops the productive-capacity and cache-local routing framework.

---

A support team runs an answer-drafting workload. Roughly 1,000 tickets a day. Each ticket triggers RAG retrieval, an LLM generation pass, and a quality check. The system works. The margins are fine. Then someone opens the procurement spreadsheet.
{: .has-dropcap}

Route A (the current provider) charges $3.00 per million input tokens and $15.00 per million output tokens. Route B charges $1.80 per million input and $8.00 per million output. That is 40% cheaper on input and 47% cheaper on output. The spreadsheet says: switch to Route B, save roughly $4,200 per month.

The team switches.

Thirty days later, the inference bill is higher than before. The support burden has increased. The product manager is asking what happened.

Across three workloads I've audited (customer support, document extraction, and an agentic workflow) the same shape recurs. The per-token comparison is correct on its own terms. The arithmetic checks out. The conclusion is wrong, because the spreadsheet is answering a question nobody actually asked.

The spreadsheet answers "which provider charges less per token?" The question that matters is "which provider produces accepted work at a lower total cost?" The gap between those two questions is the denominator problem, and it is the most common mistake in inference economics.

---

## The trace that explained everything

When the bill came in wrong, the team did what every engineering team does. They pulled traces. Not aggregate dashboards. Not the provider's usage summary. The actual request-level event log, call by call.

Here is a representative slice from a single day on Route B. The trace is illustrative; I simplified it to eight rows. The field shapes, billing grammar, and cache semantics come from real provider documentation. The failure modes come from production.

| # | Type | Input tok | Cached | Output tok | TTFT (time to first token) ms | E2E (end-to-end latency) ms | Eval | Notes |
|---|------|-----------|--------|------------|---------|--------|------|-------|
| 1 | First attempt | 2,400 | 1,800 | 220 | 380 | 2,100 | Pass | Cache hit on system prompt |
| 2 | First attempt | 3,100 | 0 | 340 | 920 | 3,800 | Pass | Cache miss, new retrieval context |
| 3 | First attempt | 2,600 | 2,100 | 280 | 350 | 2,400 | Fail | Answer missed key constraint |
| 4 | First attempt | 2,800 | 0 | 510 | 1,100 | 5,200 | Fail | TTFT exceeded 800ms SLO (service-level objective) |
| 5 | First attempt | 2,200 | 1,600 | 190 | 410 | 1,900 | Pass | — |
| 6 | First attempt | 4,500 | 0 | 380 | 1,400 | 4,800 | Pass | Long retrieval context, cache miss |
| 7 | Retry of #4 | 2,800 | 0 | 290 | 850 | 3,400 | Pass | Same input, no cache (TTL expired) |
| 8 | Repair of #3 | 3,800 | 0 | 350 | 650 | 3,200 | Pass | Regenerated with corrected context |

Eight rows. Six first attempts, one retry, one repair. The team expected six requests to serve six tickets. The system generated eight.

Look at the "Cached" column. Requests 2, 4, and 6 show zero cached tokens. These are cache misses — the system prompt prefix should have been cached, but was not. Requests 1, 3, and 5 got cache hits. That is a 50% hit rate on this slice. Across the full day, the hit rate was 35%. On Route A, it had been 60%.

Look at the "Output tok" column. Request 4 generated 510 tokens. Request 6 generated 380. The team had modeled 250 as the median. Output tokens are the expensive side of the invoice.

Now look at the bottom of the table. Request 7 is a retry of request 4, resubmitted because the first attempt blew through the 800ms TTFT SLO. Request 8 is a repair. The system detected that request 3 gave a bad answer, pulled corrected retrieval context, and re-prompted. Both consumed fresh input tokens, generated fresh output tokens, and burned fresh latency budget.

On the full day, this pattern repeats across all 1,000 tickets. Some first attempts pass all gates. Some fail quality. Some fail latency. Some fail both. The failures generate retries, repairs, and eval grader calls. Each of those costs tokens. None of them appear on the pricing comparison page.

---

## What the spreadsheet missed

Five things broke the spreadsheet's logic.

### 1. The cache hit rate was worse than expected

The team designed the prompt with a stable system prompt and tool definitions at the top, roughly 1,800 tokens of cache-eligible prefix. On Route A, 60% of requests hit the cache. On Route B, the hit rate dropped to 35%.

Route B uses a different cache implementation with a shorter effective TTL. Requests arriving more than a few minutes apart saw cold cache. The retrieval context changes per ticket, and when that context sits inside the cache-eligible prefix, every new document set breaks the prefix match. Route B's load balancer also distributes across more replicas than Route A. Cache is per-replica. Fewer requests land on the same replica within the TTL window.

The pricing page said cache reads were 50% cheaper than uncached input. That discount matters only when cache hits actually happen. At 35% instead of 60%, the effective input cost is higher than the spreadsheet assumed. The team had budgeted for a cache discount that, in production, was applied to barely a third of their traffic.

Cache economics are not on the pricing page. They are in the cache implementation, the TTL policy, the replica topology, and the prefix stability of your prompt. Two providers with identical cache discount rates can produce radically different effective input costs depending on these four variables.

### 2. Output tokens were longer

Route B's model produced longer outputs on average. The trace shows output lengths of 510, 380, and 350 tokens on several requests, well above the 250-token median the team modeled. Output tokens are the expensive side of the bill. On most major API providers, output costs 2-6x more than input per token. A 40% increase in average output length can erase a 47% discount on the per-token output price.

This happens because different models have different verbosity profiles, and the support prompt was tuned for Route A's model. When you move a prompt from one model to another, the output distribution shifts. Sentence structure changes. Explanation depth changes. Hedging language shows up where it was not before. The token rate is cheaper, but more tokens come out. Prompt portability is not free.

### 3. Retries and repairs are invisible on the pricing page

Two of six first attempts in the trace above failed. One on latency SLO (request 4), one on quality (request 3). Both were recovered. The retry consumed tokens. The repair consumed tokens. An eval grader call (not shown in this eight-row slice but present in the full trace) checked the failed outputs and consumed additional tokens.

These recovery requests added roughly 30% to the inference bill for the full trace. On workloads with 5-10% first-attempt failure rates, retries alone add 5-10% to the inference bill. Add repairs and eval grader calls, and the overhead climbs. This cost is invisible if you divide total spend by total requests instead of by accepted work. Retries and repairs inflate both numerator and denominator, and the ratio looks stable.

The pricing comparison between Route A and Route B did not include a line item for "what happens when the answer is wrong."

### 4. Quality failures have downstream costs

Request 3 failed the quality gate. Its answer missed a key constraint from the customer's account. The repair call (request 8) fixed it, but the customer waited an extra 3.2 seconds. If the repair had also failed, the ticket would have escalated to a human agent.

On this workload, approximately 5% of tickets escalate to humans. Each human escalation costs roughly $2 in agent time. On 1,000 tickets per day, 50 escalations cost $100. The daily inference bill is about $14.

Human escalation costs 7x the inference bill. It doesn't appear on any provider dashboard. It's invisible to anyone comparing token prices.

A model with a lower first-attempt pass rate generates more retries, more repairs, and more escalations. Each retry is an inference call that does not appear in the pricing comparison. Each escalation is a cost that does not appear on the inference bill at all. Route B's lower quality rate didn't just cost more tokens; it cost human labor at 50-200x the per-request inference price.

### 5. The SLO gate changes the denominator

The team's SLO says: TTFT under 800ms, E2E under 5 seconds, eval score above 0.85. Of the first attempts across a full day, 75% passed all three gates on the first try. Another 7% were recovered by retries and repairs. The remaining 18% either escalated to humans or were unrecovered failures.

The right denominator is "accepted answers that passed quality, latency, and compliance gates." Not "requests sent to the provider." Not "tickets attempted." Eight hundred twenty accepted answers out of 1,000 tickets. Cost per accepted answer is higher than cost per request.

This is the denominator problem in its purest form. The team measured cost per ticket. They should have measured cost per accepted answer. The difference between those two denominators (1,000 versus 820) accounts for a 22% inflation in per-unit cost, before you even adjust the numerator.

---

## The reveal

The procurement spreadsheet did this:

```
Daily inference cost on Route B:  ~$14.20   
Daily tickets served:              1,000
Cost per ticket:                   $0.014
```

This calculation divides total inference spend by total tickets. It treats every request as equally valuable. It ignores retries, repairs, eval grader calls, human escalation, and operational overhead. It uses the wrong numerator and the wrong denominator.

Here is the loaded calculation:

| Cost component | Daily amount | % of total |
|----------------|-------------|-----------|
| Inference (all calls from trace) | $14.20 | 10.1% |
| Invoice delta (rounding, timing) | $0.65 | 0.5% |
| Eval grader cost | $0.80 | 0.6% |
| Human escalation (50 cases x $2) | $100.00 | 71.1% |
| Ops overhead allocation | $25.00 | 17.8% |
| **Total loaded cost** | **$140.65** | **100%** |

And the denominator:

| Denominator | Value |
|-------------|-------|
| Total tickets attempted | 1,000 |
| First-attempt pass | 750 |
| Recovered by retry/repair | 70 |
| **Accepted answers** | **820** |
| Escalated to human | 50 |
| Unrecovered failures | 130 |

```
Naive cost per ticket:              $14.20 / 1,000 = $0.014
Loaded cost per accepted answer:    $140.65 / 820  = $0.172
```

The loaded cost is 12x the naive cost.

Inference is $14 per day, 10.1% of the loaded cost. The other 90% is the bill people don't see: human escalation, eval grader calls, ops overhead. The 12x gap is the gap between the visible cost and the actual cost.

Optimizing the token price while ignoring the quality-driven escalation rate is optimizing a lever that controls 10% of the outcome. The team switched providers to save 40% on the component that contributes 10% of cost. The result was predictable, in hindsight.

Here is the part the team did not expect: Route A was more expensive per token, but it had a 60% cache hit rate, shorter average outputs, a 91% first-attempt quality pass rate, and fewer retries. The loaded cost per accepted answer on Route A was $0.135. Route B, at $0.172, was 27% more expensive per accepted answer despite being 40-47% cheaper per token.

The spreadsheet picked the wrong route.

---

## The denominator problem

The most common mistake in inference economics is dividing by the wrong number.

Here is the taxonomy. Every denominator hides something.

| Denominator | What it hides |
|-------------|--------------|
| Per million tokens | Whether those tokens produced useful work |
| Per request | Whether the request succeeded |
| Per API call | Retries, repairs, and multi-step workflows |
| Per user | Variance across user behavior and workload mix |
| Per GPU-hour | Whether the GPU produced accepted work or wasted cycles |

The first row is the cloud console view. You log into your provider dashboard, see cost per million tokens, and think you understand your economics. You do not. You understand the provider's billing meter. The billing meter measures throughput. Your product needs outcomes.

Your observability dashboard shows the second row: average cost per request is $0.014. But "request" includes first attempts, retries, repairs, and eval grader calls, all of which cost money and none of which produced accepted work on their own. A retry that succeeds is a cost of producing the accepted work. A retry that fails is a cost of producing nothing. Both show up as "$0.014 per request" in the average.

Multi-step workflows make the third row dangerous. Agent loops, chain-of-thought with tool use, retrieval-generation-evaluation pipelines generate dozens of API calls per task. Dividing total cost by total API calls produces a number so small that it obscures the actual cost per completed task. An agent that makes 40 API calls to resolve one ticket costs 40x what the per-call metric suggests.

Per-user cost is the product view. It averages away the power users who drive 80% of the inference spend and the light users who drive 5%. When the product team says "we spend $0.03 per user per month," they are right on average and wrong for every user who matters economically.

At the infrastructure level, the fifth row looks healthy: GPU utilization at 65%. But if 30% of those cycles are processing requests that will fail the quality gate and get retried, the effective utilization, measured in accepted work per GPU-hour, is lower than you think.

The denominator depends on the workload. But the structure is always the same:

> **The accepted work unit**: one task that clears the quality gate, the latency SLO, and the compliance constraints — and that didn't need a human in the loop.

For the support team, it is one accepted answer. For a coding agent, it is one merged fix that passes tests and review. For a document extraction pipeline, it is one correctly extracted record set.

Defining the accepted work unit requires answering four questions. What is the task? (Not "an API call"; the smallest unit of work that produces value.) What is the quality gate? (Without a quality gate, every completion counts as accepted and the denominator is meaningless.) What is the latency SLO? (A correct answer that arrives after the deadline may not count.) What are the compliance constraints? (A response generated on the wrong infrastructure is not accepted work regardless of quality.)

If you cannot define what an accepted work unit is for your workload, your cost model is measuring activity, not value. Every metric you report will be accurate. None of them will be useful.

---

## LCPR: Loaded Cost Per Result

> **LCPR — Loaded Cost Per Result.** The total cost of producing one accepted work unit, including all inference calls, eval grader costs, human escalation, and operational overhead. Cost per result your system accepted and served to a user.

```
LCPR = (C_inference + C_eval + C_human + C_ops + delta) / A
```

| Symbol | Unit | Meaning |
|--------|------|---------|
| C_inference | USD | Trace-derived inference cost. All calls: first attempt, retry, repair |
| C_eval | USD | Eval grader cost. LLM grader calls, rubric checks |
| C_human | USD | Human review, escalation, and repair labor |
| C_ops | USD | Amortized operational overhead allocated to this workload |
| delta | USD | Discrepancy between trace-derived cost and provider invoice |
| A | count | Accepted work units. Tasks passing quality, latency, and compliance gates |

The numerator includes all costs incurred in producing the output, including costs of failed attempts. The denominator includes only accepted output. LCPR is a definition, not an approximation. It is what it costs to produce accepted work.

**C_inference** is not your provider invoice. It is the cost you can derive from your traces: every API call, priced at the current rate, including calls that failed. Your traces see retries, repairs, and eval grader calls as individual requests with input tokens, output tokens, and cache state. Your invoice sees aggregate tokens for a billing period. The trace gives you attribution (which workload, which customer, which route). The invoice gives you the ground truth charge. Both matter. Neither alone is sufficient.

**C_eval** is the cost of knowing whether an answer was good. On quality-sensitive workloads, the eval itself is an LLM call. Sometimes a second model used as a judge, sometimes the same model with a grading prompt. On the support workload, eval cost was $0.80 per day. Small relative to human escalation, but real inference spend that produces zero customer-facing output. Without a quality gate, you have no denominator, and without a denominator, you have no LCPR.

**C_human** is the cost that does not appear on any inference dashboard. When the system fails and a human takes over, that labor cost should be allocated against the workload that generated the failure. On the support workload, this is the dominant cost at 71% of LCPR: $100 per day versus $14.20 for inference. This is not unusual. On quality-sensitive interactive workloads, I consistently see human escalation as the plurality or majority of loaded cost. If you are optimizing token price while human escalation dominates your loaded cost, you are tuning the guitar while the drummer is on fire.

**C_ops** is on-call engineering time, monitoring and observability tooling, prompt maintenance, eval set curation, model evaluation cycles, deployment pipeline costs. These are real, amortized across workloads, and invisible on any per-request metric unless deliberately allocated. $25 per day is a rough allocation. At some companies it is higher. The point is that it exists and is not zero.

**Delta** is the reconciliation term. It captures rounding, timing differences between trace timestamps and billing period boundaries, batch pricing adjustments, model alias resolution. Everything that makes your trace-derived cost differ from the invoice. If delta exceeds 5% of C_inference, investigate before trusting your trace-based cost reporting. Common causes: missing traces, model name aliases (the trace says `gpt-4.1` but the invoice says `gpt-4.1-2025-04-14`), batch versus real-time pricing splits, or token count discrepancies between your tokenizer and the provider's.

**A** is the number that changes everything. It is not requests, not tickets, not API calls. It is accepted work units. Define A before you build the cost model. If A is not defined, the LCPR calculation will produce a number, but the number will not be useful for decisions.

---

## How this formula evolved

An earlier version I used in the field guide collapsed eval grader cost, human review cost, and ops overhead into a single bucket called `engineering_cost`. That bucket hid the lever. On the support workload, 71% of `engineering_cost` was human escalation. A team that sees `engineering_cost = $X` reaches for SREs; a team that sees `human_escalation = 71% of LCPR` reaches for the quality gate. Splitting the bucket makes the dominant lever visible.

The earlier denominator was also underspecified. "Successful" can mean passed quality, met latency, complied with data residency, didn't escalate, or any combination. Two teams at the same company defining it differently produced LCPRs that were 30% apart for similar workloads. The accepted-work-unit definition above (passes quality gate, meets latency SLO, complies with data constraints, no human intervention) is the version I now use.

The delta term is new. Trace-derived cost and provider invoice always differ by 2-5%. The delta isn't a correction; it's a diagnostic. Over 5%, the trace isn't trustworthy for daily cost monitoring, and finding out why is more valuable than the cost figure itself.

---

## Where this breaks

The framework is not always worth the effort.

**Simple workloads.** Single-turn classification, sentiment analysis, embedding generation. Workloads where quality gates are trivial (or absent), retries are rare, and inference cost genuinely dominates. For these workloads, token price is a reasonable proxy and the full LCPR exercise is overhead. If you are classifying text into three categories and the model gets it right 99% of the time, you do not have a denominator problem. You have a straightforward token cost problem.

**Batch workloads.** When the 50% batch discount is the dominant economic lever and quality is checked downstream in a separate pipeline, the per-request LCPR calculation does not capture the right economics. Batch cost is better modeled as total batch spend divided by total accepted batch output, measured at the batch level rather than the request level.

**Rounding-error inference spend.** If inference is 0.1% of your operating cost, the loaded-cost exercise is not the binding constraint on your business. Spend your analysis time on whatever is 20% of your operating cost instead.

**Very low volume.** At 10 requests per day, the ops overhead per request is large and unstable. LCPR is most useful when volume is high enough for the per-unit allocation to be meaningful: typically hundreds of requests per day or more.

**Shared infrastructure.** When multiple workloads share a dedicated endpoint, allocating C_ops to individual workloads requires an allocation model. Allocation models are always wrong. The question is whether they are useful enough to inform decisions despite being wrong. [What Your Workload Actually Costs]({filename}/workload-costs.md) addresses the allocation problem. The honest answer is: it is hard, and it is worth doing anyway.

---

## What's next

This essay names the problem. The trace-to-margin reconciliation method (how to go from raw trace events to trace-derived cost, reconcile trace cost against the provider invoice, and decide whether to trust the delta) is developed in Chapter 25 of *Production Inference Economics: A Field Guide*.

The trace autopsy turns LCPR from a formula into a measurement.

---

*Production Inference Economics — Part 1 of 3*

1. **The Denominator Problem**
2. [LCPR Calculator]({filename}/lcpr-calculator-v2.md)
3. [Workload Costs]({filename}/workload-costs.md)

*Sohail Mohammad — April 2026*

*Numbers are anonymized and should not be attributed to any specific employer, customer, or deployment.*
