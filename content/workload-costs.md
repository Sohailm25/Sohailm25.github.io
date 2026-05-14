Title: What Your Workload Actually Costs
Date: 2026-05-06
Category: Writings
Slug: workload-costs
Summary: Not all inference is the same. Per-workload LCPR exposes the cross-subsidy that blended averages hide, with cost models for conversational, agentic, RAG, extraction, voice, and batch workloads.
Featured: true
Template: longform_article
Status: published

*I work at Together AI. Evidence tags mark every claim so you can check my work. Technical details have been generalized from production experience; no proprietary information from any organization is disclosed.*

*Production Inference Economics --- Part 4 of 5: [1. The Denominator Problem]({filename}/denominator-problem.md) | [2. Trace Autopsy]({filename}/trace-autopsy.md) | [3. LCPR Calculator]({filename}/lcpr-calculator-v2.md) | **4. Workload Costs** | [5. Goodput]({filename}/goodput.md)*

---

Four inference workloads run through one API provider account with one model: support chat, document extraction, nightly eval runs, and an experimental coding agent. They share the same billing surface, the same rate limits, and the same cost model. The monthly bill arrives. Finance divides total spend by total requests and reports an average cost per request.

That average describes none of the four workloads accurately.

The support chat makes 1.1 model calls per customer ticket. The coding agent makes 23 model calls per task, with a standard deviation of 40. The document extraction pipeline runs in batch mode at half the real-time token price. The eval job burns tokens grading outputs --- producing zero customer-facing value --- and its cost is buried inside the blended average.

I watched a team run this exact configuration for four months. They optimized the blended average: negotiated a volume discount, switched to a cheaper model, reduced prompt length. The blended average fell 18%. Everyone was happy.

Then someone calculated cost per accepted work unit for each workload separately. The support chat was 40% cheaper per accepted answer than the blended number suggested. The coding agent was 3x more expensive per accepted task. The extraction pipeline was well-optimized. The eval job was consuming 12% of the total inference bill and nobody had ever asked whether it was worth it [SYNTHETIC].

The blended average hid the cross-subsidy. The cheap workloads were subsidizing the expensive one. The team was optimizing a number that averaged away the only information that mattered: which workloads are economically healthy, and which ones are not?

The first two articles in this series, [The Denominator Problem]({filename}/denominator-problem.md) and [the Trace Autopsy]({filename}/trace-autopsy.md), named the problem and showed the diagnostic. The denominator problem says cost per request is the wrong metric. The trace autopsy shows how to go from raw traces to loaded cost per accepted result. This article asks the next question: accepted result *of what*?

The answer requires workload classification. Not all inference is the same. A human-waiting chatbot, an overnight batch job, a multi-step coding agent, and a RAG pipeline have different cost structures, different failure modes, different quality gates, and different denominators. Treating them as one workload produces an average that optimizes nothing and misleads everyone.

---

## The distinction that changes treatment

A workload class is not a label. It is a category that changes at least one of these: routing, fallback path, latency SLO (service-level objective), quality gate, billing surface, caching strategy, monitoring threshold, or operational owner. If a distinction doesn't change any of those, it is not a workload class --- it is a tag for a dashboard.

The test is practical: would changing the route for one workload break the other? If a support chatbot and a batch extraction pipeline share the same route, and you switch the route to a batch-optimized endpoint for cost savings, the chatbot's latency SLO breaks. They are different workload classes.

Here is the minimum taxonomy I have found useful in production:

| Class | Defining constraint | What changes |
|-------|-------------------|--------------|
| Human-waiting synchronous | p95 latency SLO under 5s | Route, model size, batch config, fallback path |
| Human-waiting streaming | TTFT (time to first token) SLO | Prefill priority, chunked transfer, backpressure |
| Machine-waiting synchronous | Latency SLO 1--30s | Can tolerate larger batch, longer queue, cheaper route |
| Batch/offline | No per-request latency SLO | Eligible for batch API, off-peak scheduling, retry tolerance |
| Agentic/multi-turn | Task-lifecycle SLO | Fanout accounting, compaction, cache strategy, repair cost |
| Real-time/voice | Sub-second hard ceiling | Dedicated capacity, streaming, thermal stability |

The binding constraint differs by who is waiting. When a human waits --- a chatbot reply, a voice response, a code completion --- token generation speed dominates and the serving physics constrain which models and routes are feasible. When a machine orchestrates on a queue or an overnight schedule, memory capacity and cost per accepted result dominate, and latency is secondary [OPINION].

This taxonomy is not universal. Some organizations need more classes, some fewer. But every team I have worked with that started from "we have one workload --- inference" and then separated their traffic into at least three classes discovered that their cost model changed materially. The optimization strategy changed. The routing changed. The monitoring changed.

---

## Conversational workloads: the session is the unit

The support team from the first two articles generates 1,000 tickets per day. Each ticket is a conversation. And conversations have economic properties that single-turn requests do not.

**Context accumulates within a session.** Each turn adds the prior conversation to the input. By turn 8, the input can be 4--6x the initial prompt. Without caching, every turn re-pays for the full history. With caching, the economics depend on whether the cached prefix is stable --- and on multi-turn conversations, the prefix grows and mutates with every tool call and response [DERIVED].

**Tool calls add hidden cost.** A support agent that looks up an account, checks order status, and issues a refund makes three tool calls. Each tool response enters the context for the next turn. Tool output tokens are free to generate (the tool produces them, not the model) but expensive to consume (they become input tokens on the next turn).

A four-turn conversation with two tool calls per turn can accumulate 10,000 tool-output tokens in context. At cached input rates, this is manageable. At uncached input rates, the tool output context can exceed the cost of the actual generation.

**Quality failures cost more than inference.** On the support workload from [The Denominator Problem]({filename}/denominator-problem.md), human escalation was 71% of loaded cost --- $100 per day versus $14.20 for inference [SYNTHETIC]. This ratio is not unusual. On quality-sensitive interactive workloads, I consistently see human escalation as the plurality or majority of loaded cost. A model with a 3% higher first-attempt quality pass rate can reduce escalation cost by more than a 30% reduction in token price saves.

The naive optimization is to use a smaller, cheaper model. A smaller model may produce more tool calls, longer reasoning chains, more repairs, and more human escalations. The LCPR per accepted resolution can increase even when the per-token price decreases.

Here is what this looks like with real workload shapes:

| Metric | Model A (Sonnet-class) | Model B (Haiku-class) |
|--------|----------------------|---------------------|
| Avg turns/session | 4.2 | 5.8 |
| Avg input tokens/turn | 3,200 | 3,800 |
| Avg output tokens/turn | 380 | 520 |
| Cache hit rate | 0.72 | 0.68 |
| Raw resolution rate | 91% | 78% |
| Repair rate | 6% | 15% |
| Human escalation rate | 3% | 12% |
| LCPR per accepted resolution | $0.038 | $0.052 |

[SYNTHETIC]

Model B is 5--7x cheaper per million tokens. Model B is 37% more expensive per accepted resolution because it generates more turns, more repairs, and more human escalations. The per-token price comparison picks Model B. The LCPR comparison picks Model A.

The right unit for conversational workloads is the session, not the request. The cost model must include context growth, cache hit rate by turn depth, tool call volume, quality gate cost, repair rate, and escalation rate. A cost model that measures cost per request on a multi-turn conversation is measuring the wrong thing at the wrong granularity.

Cache economics dominate sessions longer than 3--4 turns. The cache break-even formula from the derivation pack applies: if the system prompt and tool definitions are stable across turns, the cached prefix saves re-processing on every turn. On a conversation with a 1,800-token system prompt and 2,000 tokens of tool definitions, the savings compound because the cached portion grows as the conversation grows. At Anthropic's 5-minute TTL with 0.10x read pricing, the break-even is 2 calls within 5 minutes [PUBLIC_PRICING].

Most support conversations clear that threshold easily. But if the prompt layout puts dynamic content (retrieval results, user state) before the stable prefix, the cache breaks on every turn and the savings evaporate.

---

## Agentic workloads: the task is the unit

A product team builds two features. Feature A is a search-and-answer system --- retrieve documents, generate a response, return it. Feature B is a coding assistant --- read files, plan changes, write code, run tests, read errors, revise, run tests again. Both call the same model API. The monthly bill is $40,000.

The trace tells the story. Feature A makes 1.1 model calls per user request. Feature B makes 23 model calls per user task, with a standard deviation of 40 [SYNTHETIC]. Feature A's cost is dominated by output tokens. Feature B's cost is dominated by input token growth across turns, sub-agent calls, tool output ingestion, cache misses after tool mutations, and repair loops.

The distinction matters because answer inference and agentic inference have different economic structures.

**Answer inference** is a function. Input goes in, output comes out. The cost is predictable because the request count is 1 (plus maybe a retry). The economic levers are model selection, prompt engineering, caching, and output length control.

**Agentic inference** is a loop. The model observes, plans, acts, observes the result, and decides whether to continue. The cost is variable because the request count depends on task difficulty, tool availability, model capability, error handling, and termination policy. A task might consume 5 or 500 model calls depending on the trajectory.

The key economic concept is the **fanout multiplier**: how many LLM calls does one user request generate?

```
agent_fanout_multiplier =
  total_llm_calls_for_task / user_visible_requests

token_fanout_multiplier =
  total_processed_input_tokens / initial_user_prompt_tokens
```

Anthropic reports agents using about 4x chat tokens and multi-agent systems about 15x chat tokens in their research system data [REPORTED]. A study of 8 frontier LLMs on SWE-bench Verified found agentic tasks consume roughly 1,000x more tokens than single-turn code chat, with input tokens driving cost [arXiv 2604.22750]. These are observations from specific systems, not universal constants. Your fanout depends on your agent architecture, tool set, and task distribution.

Here is a worked example of a coding agent task --- "Fix the authentication bug in the login flow":

| Phase | LLM calls | Input tokens | Output tokens | Cache read tokens | Tool calls |
|-------|-----------|-------------|---------------|------------------|------------|
| Planning | 2 | 12,000 | 2,400 | 8,000 | 0 |
| File reading | 4 | 34,000 | 1,600 | 24,000 | 6 |
| Implementation | 3 | 42,000 | 4,800 | 32,000 | 4 |
| Test + revise | 8 | 68,000 | 6,200 | 48,000 | 12 |
| Compaction | 1 | 4,000 | 1,800 | 0 | 0 |
| Final verify | 2 | 18,000 | 1,200 | 14,000 | 3 |
| **Total** | **20** | **178,000** | **18,000** | **126,000** | **25** |

[SYNTHETIC]

Fanout multiplier: 20 LLM calls per 1 user request. Token fanout: 178K input tokens from a 2K user prompt --- an 89x multiplier. Cache hit rate: 71% of input tokens served from cache. Without caching, the input token bill would be roughly 3.4x higher.

But the economics don't stop at the fanout. The distribution of task difficulty matters enormously:

A coding agent processes 200 tasks per day. Simple tasks average 8 model calls. Complex tasks average 65 calls. The team reports a 72% acceptance rate. The cost per accepted task varies by 40x between the simplest and most complex quartile [SYNTHETIC]. A blended average --- total cost divided by total tasks --- describes neither the easy tasks nor the hard ones.

The cost per accepted task for agentic workloads is:

```
task_cost =
  initial_attempt_cost
  + P(test_failure) * repair_cost
  + P(review_rejection) * revision_cost
  + P(abandonment) * sunk_cost

cost_per_accepted_task =
  sum(task_costs) / count(accepted + repaired_accepted)
```

Three economic pressures compound in agentic workloads:

**Large context, growing context.** A session can grow from 15K tokens at the start to 150K tokens before compaction. Compaction resets context but may lose information that causes repair failures downstream. Compaction is a cost/quality tradeoff: it saves input token cost but risks downstream failures.

**High cache opportunity, fragile cache.** System prompts, tool definitions, and project-level context are stable across turns --- ideal for prefix caching. But tool outputs (file contents, test results, error traces) mutate the conversation. Any change that breaks the cached prefix forces a full re-prefill.

Cache-safe prompt design means placing stable content before dynamic content and making tool outputs append-only where possible. Anthropic's engineering team reports that cache hit rate degradation can trigger operational severity in their coding agent, and that mid-session model changes, tool list changes, and unstable prompt ordering are the primary cache breakers [REPORTED].

**Variable fanout with bimodal difficulty.** A "rename this variable" task and a "refactor the authentication system" task are both coding-agent work, but their fanout, context growth, and failure modes differ by an order of magnitude. If the variance is high enough, split the agentic workload into complexity tiers and model each separately.

A turn cap controls worst-case cost but not accepted-task rate. If the cap is too aggressive, complex tasks fail, repair rate increases, and cost per accepted task rises because the successes don't amortize the failures. The better control is a cost budget per task with an escalation path: if the agent exceeds the budget, it surfaces the partial result for human decision rather than continuing to spend.

---

## RAG and extraction: the retrieval-generation boundary

A retrieval-augmented generation pipeline retrieves 8--12 document chunks, constructs a prompt with the retrieved context, and generates an answer with citations. The pipeline works. Then the team adds longer documents, increases the chunk count for better recall, and extends the context window to 32K tokens. The latency increases. The cost increases.

The quality doesn't improve proportionally --- because more retrieved context means more noise, more distractor passages, and more opportunities for the model to hallucinate a plausible-sounding answer from an irrelevant chunk [SYNTHETIC].

RAG economics have three layers that interact:

**Retrieval cost.** Embedding the query, searching the vector store, reranking candidates. This is usually cheap per query but scales with corpus size, index freshness, and reranking depth.

**Generation cost.** The retrieved chunks become input tokens. More chunks mean more input tokens. Double the retrieved context, roughly double the input cost. But the generation quality curve is not linear. Past a saturation point, additional retrieved context adds noise without improving answer quality.

**Acceptance cost.** RAG answers need grounding checks. Did the answer use the retrieved passages? Did it hallucinate facts not in the retrieved set? Did it cite the correct passages? Schema validation, field-level matching, and grounding audits have their own cost --- sometimes a second LLM call, sometimes deterministic checks.

The cost model:

```
rag_request_cost =
  embedding_cost(query)
  + retrieval_cost(query, corpus_size, rerank_depth)
  + generation_cost(retrieved_tokens + prompt_tokens, output_tokens)
  + grounding_check_cost(output, retrieved_set)

cost_per_grounded_answer =
  sum(rag_request_costs) / count(grounded_accepted_answers)
```

The optimization that matters most is not the model price. It is the retrieval quality. A pipeline that retrieves the right 4 chunks and generates from 4K context tokens outperforms a pipeline that retrieves 12 chunks with 3 irrelevant distractors and generates from 16K context tokens --- at lower cost and lower latency.

In an enterprise RAG deployment, framework orchestration abstractions accounted for 60% of agent response latency. Replacing the hot path dropped response time from 8 seconds to 3 seconds [MEASURED_PRIVATE]. Framework overhead is not free, and it compounds across every request.

**Document extraction** is RAG's sibling with different economics. Instead of retrieving from a corpus and generating an answer, extraction takes a single document and produces structured output: fields, tables, classifications.

The economics differ because: input is one document, not retrieved chunks. Output is structured, so schema validation is cheap and deterministic. Batch processing is usually feasible --- no human is waiting. And quality is measured by field-level accuracy, not answer groundedness.

Extraction workloads are often batch-eligible. The approximately 50% batch discount available from OpenAI, Anthropic, Google, and several serverless open-model providers is real savings when latency is not a constraint [PUBLIC_PRICING]. The batch discount is the single largest cost lever for extraction workloads that tolerate async processing.

---

## Offline, voice, and the billing grammar

### Voice: the latency budget

A voice assistant serves drive-thru orders. The total latency budget is 1,500 milliseconds from the moment the customer stops speaking. ASR takes 200--400ms. Intent classification takes 50ms. LLM generation takes 300--800ms. Text-to-speech takes 200--400ms. Network and orchestration take 100--200ms [MODELED].

The budget is consumed. There is no room for retry, fallback, or queue delay.

Voice workloads have economics that differ from text in three ways.

**Billing units change.** Some voice APIs bill by audio minute, not by token. OpenAI's Realtime API bills audio input and output at token rates ($32/MTok input, $64/MTok output). Whisper bills at $0.017/minute. Together's Whisper billing is $0.0015/audio minute for standard and $0.27/minute for streaming [PUBLIC_PRICING]. The billing grammar matters: know whether you are paying per token, per minute, or per session.

**Latency is a hard constraint, not a target.** In text chat, a slow response is annoying. In voice, a slow response breaks the conversation. The latency SLO is a ceiling. The inference budget is the residual after ASR, TTS, network, and orchestration consume their share:

```
llm_budget_ms = total_budget_ms - asr_ms - tts_ms - network_ms - orchestration_ms
```

The LLM budget determines which models are feasible, which quantization levels are required, and whether dedicated capacity is needed to guarantee TTFT. The model choice is constrained by physics, not by preference.

**Fallback changes the cost structure.** When the LLM path fails or exceeds the latency budget, the system falls back to rule-based responses. In a production voice system, fallback rate was below 1% under normal load and reached 15--20% during incidents [MEASURED_PRIVATE]. Fallback shifts cost from inference to support burden. The trace must capture both paths:

```
voice_cost_per_interaction =
  P(llm_path) * (asr_cost + llm_cost + tts_cost)
  + P(fallback_path) * (asr_cost + rule_cost + tts_cost)
  + P(escalation | fallback) * escalation_cost
```

### Batch, embeddings, and evals as workloads

Three offline workloads share the same API: embedding generation for a RAG corpus (2M documents), nightly evaluation of model quality (5,000 test cases), and weekly batch extraction from support transcripts (50,000 documents). All three pay real-time prices with real-time latency guarantees they do not need [SYNTHETIC].

Offline workloads are defined by one property: no human is waiting. This changes the economics:

**Batch APIs offer approximately 50% discounts.** OpenAI, Anthropic, and Google offer batch processing at roughly 50% of standard rates for select models. The trade is latency for cost: batch jobs complete within hours rather than in real time [PUBLIC_PRICING]. Completion windows, eligible models, and discount stacking rules vary by provider.

**Embedding billing differs from generation billing.** Embedding models bill per input token with no output token charge. The output is a vector, not text. Embedding 2M documents at 500 tokens per document is 1 billion input tokens. At $0.02/MTok for an embedding model, that is $20. At $2/MTok on a frontier generation model, the same input would cost $2,000. The billing unit and model choice matter more than batch discounts for high-volume offline work [PUBLIC_PRICING].

**Eval workloads have compounding cost.** A quality eval that runs 5,000 test cases through a model-based grader is itself an inference workload. If the grader is the same frontier model being evaluated, the eval cost can approach the production cost. Deterministic checks (schema validation, exact match, regex) cost nothing at the model API level. The optimization is clear: run deterministic checks first, only send to model grading what passes deterministic gates, only send to human review what the model grader flags as ambiguous.

```
eval_cost =
  deterministic_check_cost  (approximately 0)
  + model_grader_cost (test_cases * grader_input * grader_output * grader_price)
  + human_review_cost (sample_size * review_minutes * labor_rate)
```

---

## Shared infrastructure and the allocation problem

The four workloads from the opening share one provider account. The monthly bill is one number. Attributing that cost to individual workloads requires an allocation model. Allocation models are imprecise. The question is whether they are useful enough to inform decisions despite being imprecise.

Three allocation strategies, each with its own failure mode:

**Proportional to tokens consumed.** Simple. Assign cost to each workload based on its share of total input + output tokens. This works when all workloads have similar cache hit rates, similar retry rates, and similar output/input ratios. It fails when they don't --- and they usually don't. The coding agent with a 71% cache hit rate and the batch extraction with 0% cache hit rate have very different effective token costs. Allocating on raw token volume misattributes cost from the uncached workload to the cached one.

**Proportional to trace-derived cost.** Better. Use the pricing snapshot to calculate each workload's trace-derived cost (applying cache discounts, batch discounts, and input/output price differentials). Allocate the total invoice proportionally to trace-derived cost. This handles most of the billing grammar correctly. It fails on the delta --- the gap between trace-derived cost and invoice. If the delta is 5%, it is noise. If it is 15%, someone is eating a disproportionate share.

**Workload-level accounting with an unknown bucket.** Best but hardest. Assign every trace to a workload class. Calculate trace-derived cost per workload. Reconcile each workload's trace cost against the provider's billing dimensions (project, API key, model, batch flag). Whatever remains unattributed goes into an unknown bucket. If the unknown bucket is under 5% of total cost, the allocation is trustworthy. If it is over 10%, the instrumentation needs work before the allocation is useful.

The unknown bucket is the most important concept in workload cost attribution. It captures: requests with missing workload IDs, calls from deprecated integrations, test traffic mixed into production, retry chains where the original request trace was lost. Do not distribute the unknown bucket proportionally across workloads. That is the same averaging mistake from the opening. Leave it visible. Report it. Investigate it.

### Cross-workload subsidy

The blended average hides the cross-subsidy. When four workloads share one cost model, the cheap ones subsidize the expensive ones.

**Pricing decisions.** If the support chatbot has LCPR = $0.038 per accepted resolution and the coding agent has LCPR = $0.14 per accepted task, pricing both features based on the blended average ($0.07) means the chatbot subsidizes the coding agent. A customer who only uses the chatbot is overcharged. A customer who heavily uses the coding agent is undercharged.

**Optimization decisions.** The blended average says "our cost is $0.07 per accepted unit." This is not actionable. Which workload do you optimize? Where is the dominant lever? On the chatbot, it might be cache hit rate. On the coding agent, it might be fanout control and repair rate. On the extraction pipeline, it might be batch eligibility. The blended average hides the lever.

**Migration decisions.** A team evaluates switching providers. The new provider is 30% cheaper per token. But the new provider's cache TTL is shorter, its batch API has different completion windows, and its model produces longer outputs. These differences affect each workload differently. The chatbot might save 25%. The coding agent might cost 15% more because the shorter cache TTL breaks its cache economics. The blended migration analysis says "save 20%." The workload-level analysis says "save on two workloads, lose on one."

---

## Multi-workload LCPR

LCPR-2026 applies at the workload level, not the account level. Each workload gets its own calculation:

```
LCPR_workload = (C_inference_w + C_eval_w + C_human_w + C_ops_w + delta_w) / A_w
```

The variables are the same as the [LCPR formula]({filename}/denominator-problem.md). The subscript `_w` means "allocated to this workload." The allocation itself is the hard part --- separating C_inference, C_eval, C_human, and C_ops into workload-level buckets requires the trace-level attribution and workload identity schema described above.

For the four-workload system from the opening, the multi-workload LCPR might look like this:

| Workload | C_inference | C_eval | C_human | C_ops | delta | A (accepted) | LCPR |
|----------|------------|--------|---------|-------|-------|-------------|------|
| Support chat | $8,200 | $480 | $3,000 | $800 | $380 | 28,500 | $0.45 |
| Coding agent | $18,400 | $1,200 | $2,400 | $600 | $820 | 4,100 | $5.71 |
| Document extraction | $4,800 | $120 | $200 | $300 | $210 | 42,000 | $0.13 |
| Eval runs | $3,600 | $0 | $0 | $200 | $160 | -- | -- |
| Unknown bucket | $1,200 | -- | -- | -- | $80 | -- | -- |
| **Total** | **$36,200** | **$1,800** | **$5,600** | **$1,900** | **$1,650** | -- | -- |

[SYNTHETIC]

Several things are visible in this table that the blended average hides:

The coding agent's LCPR is 44x the extraction pipeline's LCPR. This is not surprising --- agentic workloads have high fanout, high repair rates, and expensive accepted-task criteria. But the ratio matters for pricing and investment decisions.

The eval workload has no denominator. Its accepted work unit is "a decisive routing or release decision," not a customer-facing output. Eval cost is infrastructure cost, like monitoring or CI. It should be allocated across the workloads it serves, not reported as its own LCPR.

The unknown bucket is $1,280 --- about 2.7% of total cost. Small enough to accept; large enough to investigate if it grows.

Human escalation cost is concentrated in support chat ($3,000/month) and coding agent ($2,400/month). The extraction pipeline has minimal human cost ($200/month) because schema validation catches most failures deterministically. This distribution tells you where quality improvement has the highest economic return.

---

## What to measure for each workload class

The workload class determines what to measure:

| Workload class | Primary metric | Secondary metrics | Economic lever |
|---------------|---------------|-------------------|---------------|
| Conversational | Cost per accepted resolution | Session length, cache hit rate by turn, escalation rate | Quality gate, cache stability |
| Agentic | Cost per accepted task | Fanout multiplier, repair rate, acceptance rate by complexity tier | Fanout control, termination policy |
| RAG | Cost per grounded answer | Retrieval precision, chunk count, grounding check pass rate | Retrieval quality, context packing |
| Extraction | Cost per validated record | Schema pass rate, batch-eligible share, human review rate | Batch eligibility, deterministic checks |
| Voice | Cost per completed interaction | LLM budget utilization, fallback rate, escalation from fallback | Latency budget, fallback quality |
| Batch/offline | Cost per accepted batch item | Completion time, retry rate, expiration rate | Batch API usage, volume pricing |
| Eval | Cost per decisive decision | Deterministic coverage, grader agreement rate | Deterministic checks first |

Each row is a different LCPR configuration. Same formula, different inputs, different denominators. The formula is durable. The workload identity determines which inputs matter.

---

## Limitations

**Workload classes drift.** A support chat workload gets extended to handle complex multi-step troubleshooting. The token profile changes, the latency profile changes, the cache hit rate drops, and the quality gate needs updating. The workload identity says "support-chat" but the traffic looks like an agent. Review workload identities quarterly or when failure rates change.

**Bimodal distributions within a class.** A "what is your return policy?" question and a multi-step account recovery are both support chat, but their cost structures differ by an order of magnitude. If the bimodal distribution is large enough to distort routing and cost modeling, split the workload class.

**Agentic workloads without acceptance criteria.** "Improve the codebase" is not a measurable task. Without a defined acceptance criterion --- tests pass, linter clean, PR approved, issue closed --- the denominator is undefined and cost per accepted task is meaningless. Define the acceptance criterion before optimizing.

**Very low volume.** At 10 requests per day, the ops overhead per request is large and unstable. Workload-level LCPR is most useful when volume is high enough for the per-unit allocation to be meaningful --- typically hundreds of requests per day or more.

**Allocation models for shared cost.** When workloads share a dedicated endpoint, GPU time, or engineering headcount, allocating cost to individual workloads requires assumptions. Those assumptions should be visible (in the assumption register from [the Trace Autopsy]({filename}/trace-autopsy.md)), owned by someone, and refreshed periodically. A wrong allocation that changes a routing decision is worse than no allocation.

**Background agents without a speed premium.** For agents with no human in the loop that run overnight, the latency difference between a frontier model and a specialist matters less than the cost difference. The relevant metric shifts from time-to-first-token to cost per accepted result. The sub-agent routing decisions change. The entire optimization surface is different from interactive agentic workloads.

---

## What comes next

This article established that workload classification is necessary for useful inference economics. The blended average hides the cross-subsidy. The per-workload LCPR exposes the dominant lever for each workload class.

The next article --- [Goodput or It Didn't Happen]({filename}/goodput.md) --- takes the workload identity and asks: how do you measure whether the serving infrastructure is producing accepted work at the rate you need? Throughput is not the answer. GPU utilization is not the answer. Goodput --- accepted results per second under latency, quality, and compliance constraints --- is the bridge between serving physics and inference economics. Derivation 5 in the LCPR Calculator already implements the formula. The essay makes the argument for why every benchmark, capacity plan, and migration decision should use goodput as the denominator instead of raw throughput.

---

*Production Inference Economics --- Part 4 of 5: [1. The Denominator Problem]({filename}/denominator-problem.md) | [2. Trace Autopsy]({filename}/trace-autopsy.md) | [3. LCPR Calculator]({filename}/lcpr-calculator-v2.md) | **4. Workload Costs** | [5. Goodput]({filename}/goodput.md)*

*Sohail Mohammad --- May 2026*

*Part 4 of 5 in the Production Inference Economics series. Evidence labels: [SYNTHETIC] for constructed examples shaped by production patterns, [PUBLIC_PRICING] for provider pricing pages, [MEASURED_PRIVATE] for production observations, [REPORTED] for claims attributed to specific engineering teams, [MODELED] for calculations with methodology shown, [DERIVED] for numbers calculated from other labeled inputs, [OPINION] for author judgment. Numbers are anonymized and should not be attributed to any specific employer, customer, or deployment.*
