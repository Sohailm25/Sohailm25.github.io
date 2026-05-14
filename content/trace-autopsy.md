Title: Trace Autopsy: Following One Day's Inference Bill
Date: 2026-04-22
Category: Writings
Slug: trace-autopsy
Summary: A repeatable diagnostic for going from raw trace events to loaded cost per accepted result. Twelve requests, four data sources, five cost mechanisms, and the reconciliation protocol.
Featured: true
Template: longform_article
Status: published

*I work at Together AI. Evidence tags mark every claim so you can check my work. Technical details have been generalized from production experience; no proprietary information from any organization is disclosed.*

*Production Inference Economics --- Part 2 of 5: [1. The Denominator Problem]({filename}/denominator-problem.md) | **2. Trace Autopsy** | [3. LCPR Calculator]({filename}/lcpr-calculator-v2.md) | [4. Workload Costs]({filename}/workload-costs.md) | [5. Goodput]({filename}/goodput.md)*

---

[The Denominator Problem]({filename}/denominator-problem.md) named the problem. A team running inference in production discovers a 12x gap between what they thought inference cost ($0.014 per ticket) and what it actually cost ($0.172 per accepted answer) [DERIVED]. The gap has a name --- the denominator problem --- and a metric that captures it: Loaded Cost Per Result. But naming a problem and solving it are different things.

This article teaches the diagnostic.

I call it a Trace Autopsy because the method borrows the same discipline. You start with what happened. You reconstruct the timeline. You identify causes of death for every dollar that disappeared between the pricing page and the P&L. And you do it systematically, because the ad hoc version is how teams end up confident in wrong numbers for months.

You have an inference bill. You suspect it's wrong --- not because the arithmetic is wrong, but because the arithmetic is answering the wrong question. Your provider charged you accurately for the tokens you consumed. But the tokens you consumed aren't the tokens you planned to consume. Requests retried. Outputs failed quality checks and got regenerated. An eval grader ran on the failures, burning tokens that produced zero customer value. Cache missed where you expected it to hit. And the denominator --- the count of work units your customer actually accepted --- shrank.

The pricing page told you what a token costs. It didn't tell you how many tokens a result costs. That's what you need to measure.

The Trace Autopsy is a repeatable protocol for going from raw trace events to loaded cost per accepted result. I'm going to walk through every step using a single day's trace data. The trace is synthetic [SYNTHETIC] --- I constructed it --- but the field shapes, the billing grammar, and the failure modes come from real provider documentation and real production patterns [MEASURED_PRIVATE]. The numbers are designed to be realistic, not real. The method is real.

## What Twelve Requests Actually Look Like

The team expected eight requests. The system generated twelve.

Those four extra requests are the entire story. They're the gap between the pricing page and the bill. Here's the full trace for one batch of eight customer tickets:

| # | Type | Input tok | Cached | Output tok | TTFT (time to first token) ms | E2E (end-to-end latency) ms | Eval | Notes |
|---|------|-----------|--------|------------|---------|--------|------|-------|
| 1 | First attempt | 2,400 | 1,800 | 220 | 380 | 2,100 | Pass | Cache hit on system prompt |
| 2 | First attempt | 3,100 | 0 | 340 | 920 | 3,800 | Pass | Cache miss --- new retrieval context |
| 3 | First attempt | 2,600 | 2,100 | 280 | 350 | 2,400 | Fail | Answer missed key constraint |
| 4 | First attempt | 2,800 | 0 | 510 | 1,100 | 5,200 | Fail | TTFT exceeded 800ms SLO (service-level objective) |
| 5 | First attempt | 2,200 | 1,600 | 190 | 410 | 1,900 | Pass | --- |
| 6 | First attempt | 4,500 | 0 | 380 | 1,400 | 4,800 | Pass | Long retrieval context, cache miss |
| 7 | First attempt | 2,500 | 2,000 | 250 | 360 | 2,200 | Pass | --- |
| 8 | First attempt | 3,200 | 0 | 620 | 980 | 6,100 | Fail | Output too long, E2E violated SLO |
| 9 | Retry of #4 | 2,800 | 0 | 290 | 850 | 3,400 | Pass | Same input, no cache (TTL expired) |
| 10 | Retry of #8 | 3,200 | 0 | 310 | 720 | 3,100 | Pass | Retry succeeded |
| 11 | Eval grader | 1,200 | 0 | 80 | 200 | 800 | --- | Grading requests 3 and 8 |
| 12 | Repair of #3 | 3,800 | 0 | 350 | 650 | 3,200 | Pass | Regenerated with corrected context |

[SYNTHETIC]

Each row is a clinical event. The pattern across rows tells the story.

**Requests 1 through 8** are first attempts --- one per customer ticket. This is the work the team planned for. Eight tickets come in, eight inference calls go out. If you're estimating inference cost from a spreadsheet, these eight rows are all you modeled.

Five of the eight pass (requests 1, 2, 5, 6, 7). Three fail. But they fail for different reasons, and the failure mode determines what happens next.

**Request 3** fails quality. The LLM-as-judge eval says the answer missed a key constraint. This isn't a latency problem --- the response came back in 2,400ms, well within SLO. The content was wrong. Wrong content means the system needs to try again with better context, which is a repair, not a retry.

**Request 4** fails latency. TTFT hit 1,100ms against an 800ms SLO [SYNTHETIC]. The output might have been fine --- we'll never know, because the system timed out the first-token wait. This is a retry candidate: same input, same prompt, hope for better luck on the next scheduling pass.

**Request 8** fails on end-to-end latency. The output was 620 tokens --- nearly 2.5x the median --- and the total call took 6,100ms. The E2E SLO was probably around 5,000ms [SYNTHETIC]. Again, the output quality might have been acceptable, but the user experience wasn't. Another retry.

Now the recovery machinery kicks in.

**Request 9** retries request 4. Same input, 2,800 tokens. But notice: zero cached tokens. The retry happened after the cache TTL expired, so the system paid full input price. TTFT came in at 850ms --- just above the 800ms SLO, but this time it squeaked through. The team tuned the SLO with some tolerance band, or the eval was lenient on near-misses. Either way, it passed.

**Request 10** retries request 8. Same 3,200 input tokens, again zero cached. This time the output was 310 tokens instead of 620 --- the model's stochastic nature worked in the team's favor. E2E dropped to 3,100ms. Pass.

**Request 11** is the one most teams forget to account for. It's the eval grader --- an LLM-as-judge call that evaluates the failed outputs from requests 3 and 8. It consumed 1,200 input tokens and 80 output tokens [SYNTHETIC]. It produced zero customer-facing value. Its entire purpose was to classify the failures so the system could decide between retry, repair, and escalation. But it's real token spend on a real provider bill.

**Request 12** repairs request 3. This isn't a retry --- it's a new prompt. The system took the failure signal from the eval grader, fetched corrected retrieval context, and rebuilt the prompt. That's why the input is 3,800 tokens instead of the original 2,600. The repair succeeded.

Final tally: eight customer tickets in, twelve inference calls out, eight accepted answers delivered. The four extra calls --- two retries, one eval grader, one repair --- are invisible on the pricing page. They're visible on the bill.

## Five Mechanisms That Moved the Bill

The spreadsheet said one thing. The trace said another. Five mechanisms explain the gap. I'll walk through each one, showing what the team assumed, what actually happened, and how much it moved the bill.

### 1. Cache hit rate dropped from 60% to 35%

The spreadsheet assumed a 60% prompt cache hit rate [SYNTHETIC]. This was reasonable --- the team measured it during a pilot with a single replica and a generous TTL. Production was different.

Three things broke the cache assumption:

**Shorter TTL on Route B.** The team ran two routing tiers. Route A had a 300-second cache TTL. Route B, added for overflow, had a 60-second TTL to keep memory pressure down. Nobody updated the cost model when Route B went live.

**Retrieval context breaking prefix match.** Prompt caching works on prefix matching. The system prompt is stable --- it caches reliably (see request 1: 1,800 of 2,400 tokens cached). But the retrieval context that follows the system prompt changes per ticket. When the retrieval ranking changed --- different documents, different order --- the prefix diverged and the cache missed. Request 2, request 4, request 6, request 8: all cache misses, all involving fresh retrieval context.

**More replicas fragmenting the cache.** The team scaled from two to four replicas. Each replica has its own KV cache. Same prompt hitting different replicas means a cache miss. Without sticky routing, the effective hit rate drops roughly proportional to replica count, minus whatever overlap the load balancer provides.

The financial impact: at 60% cache hit rate, the effective input cost per token was roughly 0.6 * (discounted cached price) + 0.4 * (full price). At 35%, that ratio shifts hard toward full price. On a provider charging $2.50/M input tokens with cached tokens at $1.25/M [PUBLIC_PRICING], the effective input cost per token went from $1.75/M to $2.06/M --- an 18% increase on the input side [DERIVED]. Not catastrophic on its own. But it compounds with everything else.

### 2. Output token length was longer than planned

The spreadsheet assumed 250 output tokens per request --- the median from the pilot [SYNTHETIC]. Look at what the trace delivered: 220, 340, 280, 510, 190, 380, 250, 620, 290, 310, 80, 350.

Average across first attempts (requests 1-8): 349 tokens. That's 40% above the 250-token median [DERIVED].

This matters more than it looks. Output tokens cost 2-6x more than input tokens per token across major providers [PUBLIC_PRICING]. On a model where input is $2.50/M and output is $10.00/M, a 40% increase in average output length doesn't move the bill by 40%. It moves the output portion of the bill by 40%, and output is already the dominant cost component.

For this trace, where output tokens are 4x the price of input tokens, a 40% increase in average output length erases a 47% per-token discount you might have negotiated on the input side [DERIVED].

The long-tail requests are the killers. Request 8 at 620 tokens and request 4 at 510 tokens aren't outliers --- they're the heavy hitters that pull the average up. And both of them failed, so their tokens produced zero accepted output. Cost incurred, value zero.

### 3. Retry and repair cost added 30% to inference spend

Four requests out of twelve were not first attempts. Requests 9 and 10 were retries. Request 11 was an eval grader. Request 12 was a repair. None of them appear in the spreadsheet model.

Let me tally the extra token cost. Using a blended rate of $2.50/M input and $10.00/M output [PUBLIC_PRICING]:

| Request | Input cost | Output cost | Total |
|---------|-----------|-------------|-------|
| 9 (retry) | $0.0070 | $0.0029 | $0.0099 |
| 10 (retry) | $0.0080 | $0.0031 | $0.0111 |
| 11 (eval) | $0.0030 | $0.0008 | $0.0038 |
| 12 (repair) | $0.0095 | $0.0035 | $0.0130 |
| **Total extra** | **$0.0275** | **$0.0103** | **$0.0378** |

[DERIVED]

The first-attempt cost for requests 1-8 was approximately $0.126 [DERIVED]. The four extra requests added $0.038, a 30% increase [DERIVED]. And this was a relatively clean day --- only three of eight first attempts failed, and all recoveries succeeded on the first try. On a bad day, with cascading retries or multiple repair attempts, this multiplier grows.

### 4. Quality failure created downstream cost

Request 3 failed quality. The eval grader (request 11) confirmed it. The repair (request 12) succeeded. That's the happy path for quality failures.

But not every repair succeeds. When repairs fail, the ticket escalates to a human reviewer. Human review costs $2 per case [SYNTHETIC]. At a 5% escalation rate --- roughly 50 escalations per day on a 1,000-ticket workload --- that's $100/day in human cost [DERIVED]. Scale to a month and it's real money.

Here's the ratio that should bother you: at $100/day in human escalation cost and roughly $14/day in inference cost [DERIVED], the human cost is 7x the inference bill [DERIVED]. You can negotiate a 20% discount on your inference pricing and it won't matter if your escalation rate moves by two percentage points.

This is why quality gates belong in the cost model. They're not a quality concern --- they're a financial mechanism. Every percentage point of quality improvement that prevents escalation saves more than a percentage point of inference cost reduction.

### 5. The denominator shrank

One thousand tickets came in. Eight hundred twenty accepted answers went out [SYNTHETIC]. The 18% that failed quality gates, latency SLOs, or compliance checks never reached the customer. But the inference cost for those failures was already incurred.

The denominator shift inflates per-unit cost by 22% [DERIVED]. If you spent $140.65 producing 1,000 attempts and 820 of them were accepted, your cost per accepted answer is $140.65 / 820 = $0.172, not $140.65 / 1,000 = $0.141 [DERIVED]. That 22% increase comes purely from dividing by the right number.

This is the denominator problem from the first article. The five mechanisms above --- cache, output length, retries, quality failures, denominator shrinkage --- compound. They don't add linearly. Cache misses make retries more expensive. Long outputs make quality failures more costly. Quality failures shrink the denominator. The 12x gap between $0.014 and $0.172 is the product of all five mechanisms interacting.

## Why the Trace Alone Isn't Enough

If you've followed the analysis so far, you might think the trace is all you need. It isn't. I learned this the hard way.

The trace tells you what the application saw. It doesn't tell you what the provider charged. It doesn't tell you whether the output was good. And it doesn't tell you what the customer is paying. You need four data sources, and you need to join them.

### Source 1: The Trace

The request-level event log. Every inference call gets a row with timestamps, token counts, model name, latency breakdown, cache behavior, and --- if your instrumentation is good --- a request chain ID linking retries and repairs back to the original ticket.

**What it gives you:** Cost attribution per request. Latency breakdown (TTFT, generation time, E2E). Cache hit/miss classification. Failure type (latency vs quality vs compliance). Retry chain linkage.

**What it misses:** The trace records what your tokenizer counted. The provider's tokenizer might count differently. The trace doesn't know about rounding rules, minimum charges, batch pricing adjustments, or credits applied to the invoice. And if your tracing has gaps --- sampled traces, async calls that don't propagate context, logging failures during high load --- the trace undercounts.

### Source 2: The Invoice

The provider's billing record. This is ground truth for what was charged. Not what should have been charged, not what you estimated --- what the provider's billing system computed.

**What it gives you:** Actual charges by model, by billing period. Committed spend burn-down (if you have a spend commitment). Credits, adjustments, overages.

**What it misses:** The invoice is an aggregate. It tells you "you spent $14,850 on gpt-4.1 this month." It doesn't tell you which requests drove that cost, why cost moved week over week, or which workload is responsible for which portion of the bill. Attribution requires the trace.

### Source 3: The Eval

Quality measurement. This is where the denominator comes from.

**What it gives you:** Pass/fail per output. Failure clustering (what types of failures dominate). Repair success rate. The count of accepted work units --- the denominator for LCPR.

**What it misses:** Evals don't know about cost. They don't know about latency. A perfect eval system can tell you that 82% of outputs were accepted, but it can't tell you whether the 18% that failed were cheap or expensive to produce. That correlation --- failure rate by cost bucket --- requires joining eval data back to the trace.

### Source 4: The Contract

The commercial agreement. Revenue per unit, committed spend obligations, SLA terms, data handling requirements.

**What it gives you:** Revenue per accepted work unit (so you can calculate margin). Committed spend thresholds (so you know if you're burning through a commitment faster than expected). SLA penalties (so you can model the cost of latency failures). Data residency constraints (which may force you onto specific providers or regions at different price points).

**What it misses:** Everything operational. The contract defines the economic frame. It doesn't produce telemetry.

### The join

No single source answers the question "what does an accepted result cost us, and are we making money on it?" The answer requires all four:

```
Trace    (per-request cost, attribution, failure chains)
  + Invoice  (actual charges, corrections, credits)
  + Eval     (accepted work count, quality distribution)
  + Contract (revenue per unit, commitments, constraints)
  = Margin model
```

The join is hard for practical reasons, and each pair of sources has its own friction.

**Trace-to-Invoice** is the most common reconciliation, and the one most teams attempt first. The trace operates at request granularity, per-second. The invoice operates at monthly granularity, aggregated by model. Joining them requires aggregating traces up to the invoice period, matching model names (which may differ between your trace and the provider's billing system), and accepting that the totals won't match exactly. The delta between them is diagnostically valuable --- I'll spend a full section on it below.

**Trace-to-Eval** links cost to quality. This is how you discover that your most expensive requests are also the ones most likely to fail. Without this join, you can't answer "are we spending more to produce bad outputs or good ones?"

The correlation matters for routing decisions: if long outputs (high cost) have a higher failure rate, you might cap output length or use a cheaper model for high-variance workloads. The join key is usually a request ID or ticket ID, but you need your eval pipeline to record which request it evaluated --- not just "this output passed" but "this output from request ID abc123 passed."

**Eval-to-Contract** connects quality to revenue. The contract specifies revenue per accepted work unit. The eval says 82% of answers were accepted --- 82,000 out of 100,000. The join gives you realized revenue: $45,000 for the month [SYNTHETIC]. Without the eval, you'd either assume 100% acceptance (overstating revenue) or use a placeholder acceptance rate that might be months out of date.

**Contract-to-Trace** closes the loop. The contract's data residency requirement says "EU customer data stays in EU." This constraint forces certain requests to EU-region endpoints, which may have different pricing, different cache behavior, and different latency characteristics. The trace shows the actual cost of serving those requests in EU. Without linking the contract constraint back to trace data, you can't measure the cost premium of compliance.

The eval covers a sample, not the full population --- most teams eval 10-30% of outputs, then extrapolate. The contract defines terms that don't produce telemetry: "data must not leave region X" is a constraint that affects which provider you use (and therefore which price you pay), but it doesn't show up in any log.

Time boundaries make it worse. Your trace timestamps are in UTC. Your invoice billing period might close at midnight Pacific. Your eval runs asynchronously --- an output generated Monday might not be evaluated until Tuesday. Your contract defines "monthly" as calendar month, but your committed spend might reset on the 15th.

I've seen teams with excellent trace infrastructure, solid eval pipelines, and clear contracts who still couldn't compute margin --- because nobody owned the join. The trace team said "we give you cost per request." The eval team said "we give you quality scores." Finance said "we give you the invoice." Product said "we give you the contract." Nobody said "I'll stitch these together and tell you whether we're making money."

That ownership gap is the real problem. The four-source join isn't technically hard --- it's organizationally hard. Each source has a different owner, a different update cadence, and a different schema. The team that builds the join pipeline is doing integration work that nobody asked for and everybody needs.

The four-source join is the measurement protocol behind LCPR. The formula is simple --- loaded cost divided by accepted results. The measurement is hard.

## Trace-to-Margin Reconciliation, Step by Step

I'll walk through the full reconciliation using monthly numbers [SYNTHETIC]. This is the procedure I run --- or want teams to run --- at the end of every month.

### Step 1: Pull trace-derived cost

Sum every inference call for the month: first attempts, retries, repairs, eval graders. Price each call at the current pricing snapshot --- the per-token rates for the model and tier you're using.

Result: **$14,200** [SYNTHETIC].

This number is your best estimate of what inference should have cost, based on what your application observed. It's not what the provider charged. It's what your traces say happened, priced at the rates you expect to pay.

A detail that matters: which pricing snapshot are you using? If the provider changed prices mid-month --- and they do, sometimes without announcement beyond a changelog update --- you need to split the month at the price change date and price each half correctly. I keep a versioned pricing table keyed by model name and effective date. It's tedious. It's also the difference between a 2% delta and a 12% delta that triggers a fire drill.

### Step 2: Pull the invoice

The provider says: **$14,850** [SYNTHETIC].

Delta: $650. That's 4.4% [DERIVED].

Is 4.4% acceptable? I use a 5% threshold. Under 5%, the trace is trustworthy for daily cost monitoring --- the gap is noise from rounding, timing, and minor token count discrepancies. Over 5%, something is wrong and you need to investigate before trusting trace-based cost reporting.

At 4.4%, we proceed. I'll come back to what to do when the delta is large.

### Step 3: Add eval grader cost

The LLM-as-judge calls that evaluate output quality: **$800/month** [SYNTHETIC].

This is real inference spend. It hits the same provider bill. But it produces zero customer-facing output. Every token the eval grader consumes is overhead --- necessary overhead, because without it you don't have a quality signal and you don't have a denominator, but overhead nonetheless.

Some teams bury eval grader cost inside the inference line item. I break it out because it's a lever. If your eval grader is consuming 5% of your inference budget, it's worth asking whether you can eval fewer outputs (sample more aggressively), use a cheaper model for grading, or use a non-LLM eval where possible.

### Step 4: Add human escalation cost

Tickets that failed quality, failed repair, and escalated to a human reviewer: **500 cases x $2 = $1,000/month** [SYNTHETIC].

In the daily trace I showed earlier, I cited $100/day from 50 escalations. The monthly number is 500, not 1,500, because escalation volume varies by day. Weekends are lighter. Some failure modes cluster --- a bad retrieval index causes a burst of quality failures that clears once the index rebuilds.

The $2/case number is a loaded cost for human review time [SYNTHETIC]. In practice, this ranges from $1 to $15 depending on the domain, the complexity of review, and whether the reviewer is internal or outsourced. For customer support automation, $2 is realistic. For medical or legal domains, multiply by 5x.

### Step 5: Add ops overhead

On-call, monitoring, prompt maintenance, eval set curation: **$2,500/month** [SYNTHETIC].

This is the hardest number to pin down and the easiest to argue about. I allocate it as a proportion of the team's time spent on inference operations. If a team of four spends 25% of their time on prompt tuning, eval maintenance, incident response for inference quality, and provider relationship management, and the team costs $40,000/month loaded, that's $10,000/month across all workloads. If this workload is 25% of the total inference volume, it gets $2,500.

The allocation is imperfect. But zero is more wrong than $2,500. Teams that exclude ops overhead from their cost model are overstating margin by whatever the ops cost turns out to be.

### Step 6: Count accepted outputs

Total requests: **100,000** [SYNTHETIC].

Accepted outputs: **82,000** [SYNTHETIC].

The 82% acceptance rate comes from the eval pipeline. Of 100,000 outputs generated, 82,000 passed quality gates, latency SLOs, and compliance checks. The remaining 18,000 were retried, repaired, escalated, or dropped.

This is the denominator. Not 100,000. Not the number of inference calls (which is higher than 100,000 because of retries and repairs). 82,000 accepted work units.

### Step 7: Calculate LCPR

| Component | Value |
|-----------|-------|
| Trace-derived inference cost | $14,200 |
| Provider invoice | $14,850 |
| Delta | $650 (4.4%) |
| Eval grader cost | $800 |
| Human escalation (500 cases x $2) | $1,000 |
| Ops overhead allocation | $2,500 |
| **Total loaded cost** | **$19,150** |
| Total requests | 100,000 |
| Accepted outputs | 82,000 |
| **LCPR** | **$0.234** |

[DERIVED]

$19,150 / 82,000 = $0.234 per accepted answer.

### Step 8: Calculate margin

| Metric | Loaded | Naive |
|--------|--------|-------|
| Revenue | $45,000 | $45,000 |
| Cost | $19,150 | $14,200 |
| Margin | $25,850 | $30,800 |
| Margin % | **57.4%** | **68.4%** |

[DERIVED]

The naive calculation --- revenue minus trace-derived inference cost, ignoring eval graders, human escalation, ops overhead, and the denominator --- overstates margin by 11 percentage points [DERIVED]. On $45,000 in revenue, that's a $4,950 difference in profit [DERIVED]. Not enough to kill the business. Enough to make a bad routing decision, underestimate the cost of a new workload, or promise a customer a price you can't sustain.

Here's what the 11-point gap looks like in a planning conversation. The CEO asks: "Can we offer this workload to the next customer at $40,000/year instead of $45,000?" At naive margin (68.4%), the answer looks like yes --- you'd still make 64.5% margin at $40,000. At loaded margin (57.4%), the answer is more cautious --- margin drops to 52.1%, and you're only one bad month away from a workload that costs more to run than it earns. The naive number says take the deal. The loaded number says negotiate harder.

The naive number tells the CEO things are great. The loaded number tells the operator where the risk is.

## The Delta --- and When Not to Trust Your Trace

I glossed over the 4.4% delta between trace-derived cost ($14,200) and invoice ($14,850) earlier. Let me come back to it, because the delta is one of the most diagnostically valuable signals in the reconciliation.

The delta captures everything your trace didn't see or priced incorrectly. At 4.4%, the causes are likely boring: rounding differences, timing mismatches at billing period boundaries, minor token count discrepancies between your tokenizer and the provider's. Noise.

But I've seen deltas of 15%, 30%, even 2x. When that happens, the trace is lying to you, and daily cost monitoring based on trace data is fiction.

**Common causes of large delta:**

**Missing traces.** Your tracing pipeline sampled at 10% and you extrapolated. Or a service that makes inference calls doesn't propagate trace context, so those calls appear on the invoice but not in your traces. Or logging failed during a high-load period --- exactly when cost was highest. The calls happened. The provider recorded them. Your traces didn't.

**Model name aliases.** Your trace says `gpt-4.1`. The invoice says `gpt-4.1-2025-04-14`. Are they the same model at the same price? Usually yes. But during model transitions, the dated version might be priced differently, or your pricing snapshot might reference the alias while the provider bills the canonical name. I've watched a team spend a week debugging a cost discrepancy that turned out to be a model name string mismatch between their trace attribution logic and the provider's billing export.

**Batch vs real-time pricing splits.** If you use batch inference for some workloads, the batch calls are typically priced at 50% of real-time [PUBLIC_PRICING]. Your trace might not distinguish batch from real-time, or might price both at the real-time rate.

**Token count discrepancy.** Your tokenizer is a local approximation. The provider's tokenizer is authoritative. For most models, they agree to within 1-2%. But if you're using a third-party tokenizer library that hasn't been updated for the latest model's vocabulary changes, the gap can be larger.

I've seen 8% token count discrepancy on a model update that expanded the vocabulary --- the old tokenizer split words the new one kept whole. The frustrating part: the discrepancy was consistent (always undercounting by ~8%), so the team's daily cost estimates looked internally consistent but were systematically wrong. They only caught it when the monthly reconciliation delta suddenly jumped.

**Credits and commitments.** The invoice includes $3,000 in committed spend credits that your trace doesn't know about. Trace says you spent $14,200. Provider says you spent $14,200 but only owe $11,200 because of prepaid credits. If you're reconciling against the amount charged rather than the amount consumed, the delta is artificial.

**Timezone and period boundary mismatches.** Your traces timestamp in UTC. The provider's billing period closes at midnight Pacific. Calls made between 00:00 UTC and 07:00 UTC on the first of the month might land in the previous billing period on the invoice but the current period in your traces.

I categorize delta causes into exception buckets:

| Exception bucket | Meaning |
|---|---|
| missing_provider_request_id | App saw a workflow event but no provider request ID was captured |
| provider_usage_without_trace | Provider export shows usage not present in app traces |
| trace_usage_without_provider_export | Trace has calls not yet reflected in provider export |
| pricing_snapshot_mismatch | Trace estimate uses stale prices or wrong service tier |
| credit_or_commit_adjustment | Invoice includes credits or prepaid commitment burn-down |
| timezone_period_mismatch | Trace day and invoice day differ due to UTC vs local time |

When delta < 5%: trust the trace for daily monitoring. Reconcile monthly to catch drift.

When delta > 5%: stop. Investigate. Don't publish trace-based cost numbers until you understand the gap. The trace is a model of reality. When the model diverges from reality by more than 5%, the model needs recalibration, not more confidence.

One pattern I've found useful: run the reconciliation weekly, not just monthly. A delta that's 3% in week one, 4% in week two, and 8% in week three tells you something changed in week three. If you only reconcile monthly, you see 5% and shrug. The weekly trend shows you when to start digging.

## Start with Twenty Traces

Everything I've described --- the four-source join, the monthly reconciliation, the exception buckets --- assumes you have trace infrastructure, eval pipelines, and invoice access. Most teams don't. Not yet.

If that's you, start here: pull twenty traces from production. Not a hundred. Not a statistical sample. Twenty.

For each trace, answer six questions:

1. **What workload is this?** Can you name it? "Customer support ticket," "document summarization," "code review." If you can't name the workload, you can't attribute cost to it.

2. **What was the input?** How many tokens? Was any portion cached? Can you identify the system prompt, the retrieval context, and the user query as separate components?

3. **What was the output?** How many tokens? Did it pass your quality bar? Would you show it to a customer?

4. **What did it cost?** Can you calculate cost from the provider's current pricing? Input tokens times input price, output tokens times output price, minus cache discount. Does your number match the provider's usage dashboard?

5. **Did it meet the latency SLO?** What was TTFT? What was E2E? If you have an SLO, did this request meet it?

6. **If it failed, what happened next?** Was it retried? Repaired? Escalated to a human? Silently dropped? Or did nothing happen --- the failure was served to the customer?

Twenty traces will reveal the state of your instrumentation. You'll discover:

- Whether you can attribute requests to workloads (or if everything is one undifferentiated stream)
- Whether your token counts match the provider's (or if your tokenizer is stale)
- Whether cache is actually hitting (or if your hit rate assumption is fiction)
- Whether your quality gate is running (or if you're serving unchecked outputs)
- Whether retries and repairs are visible in the trace (or if they're invisible background processes inflating cost without attribution)

If you can't answer these six questions for twenty requests, you can't build a cost model. The twenty-trace exercise takes an afternoon. It doesn't require new infrastructure. It requires pulling logs, reading them, and writing down what you find. The findings will tell you what to instrument next.

Here's what the exercise typically looks like. You pull twenty requests. For the first five, you can answer all six questions --- they're from the well-instrumented primary workload, the one the team built first and cares about most.

For requests six through twelve, you can answer questions one through four but not five or six --- there's no latency SLO defined, and failures don't trigger retries. Nobody decided whether they should.

For requests thirteen through seventeen, you can answer one and two but not three --- there's no eval running on this workload. Outputs go directly to the customer unchecked.

For requests eighteen through twenty, you can't even answer question one. You can see the inference call in the trace, but you can't attribute it to a workload. It's an orphan request --- probably from a service that makes inference calls but doesn't propagate the workload tag.

That distribution --- five well-instrumented, seven partial, five minimal, three orphaned --- is diagnostic. It tells you exactly where to invest next. And it usually surprises the team, because they assumed their instrumentation covered everything.

I've run this exercise six times across different organizations. The exercise surfaces the same gaps every time: workload attribution is missing, retry chains are invisible, and nobody can connect an individual request to the line item on the invoice. The twenty traces don't fix those gaps. They make the gaps undeniable.

## What's next

This article showed the method. The next article ships the tool.

[The LCPR Calculator v2]({filename}/lcpr-calculator-v2.md) takes the four sources as input and produces the numbers I just calculated by hand. Trace data goes in. Invoice goes in. Eval results go in. Contract terms go in. LCPR, margin, and the reconciliation delta come out.

The full complexity of multi-workload, multi-provider systems is real. [What Your Workload Actually Costs]({filename}/workload-costs.md) addresses workload economics --- how to attribute shared costs when five workloads share one inference endpoint. [Goodput or It Didn't Happen]({filename}/goodput.md) addresses the serving-side measurement that feeds the LCPR denominator.

But the method scales. Start with one workload. One day. Twenty traces. Build the four-source join for that one workload. Reconcile it against the invoice. Calculate LCPR. Then expand.

The Trace Autopsy is a diagnostic, not a dashboard. You run it when you need to understand why the numbers moved. Once you understand the mechanisms --- cache, output length, retries, quality failures, denominator shrinkage --- you can build monitoring that watches for them continuously. But the first time, you do it by hand. You read the traces. You follow the money. You find the gap.

In the first article, I showed the 12x gap and named the denominator problem. In this article, I showed how to measure it. The gap between $0.014 per ticket and $0.172 per accepted answer isn't a mystery anymore --- it's five mechanisms, each measurable, each traceable, each with a specific action you can take to close it. Cache hit rate is an infrastructure problem. Output length variance is a prompt engineering problem. Retry cost is a reliability problem. Quality failures are an eval problem. The denominator is all of them combined.

That's how you go from "inference costs $0.014 per ticket" to "inference costs $0.172 per accepted answer" --- and know which number to trust.

---

*Production Inference Economics --- Part 2 of 5: [1. The Denominator Problem]({filename}/denominator-problem.md) | **2. Trace Autopsy** | [3. LCPR Calculator]({filename}/lcpr-calculator-v2.md) | [4. Workload Costs]({filename}/workload-costs.md) | [5. Goodput]({filename}/goodput.md)*

*Sohail Mohammad --- April 2026*

*Part 2 of 5 in the Production Inference Economics series. Evidence labels: [SYNTHETIC] for constructed examples shaped by production patterns, [PUBLIC_PRICING] for provider pricing pages, [MEASURED_PRIVATE] for production observations, [MODELED] for calculations with methodology shown, [DERIVED] for numbers calculated from other labeled inputs. Numbers are anonymized and should not be attributed to any specific employer, customer, or deployment.*
