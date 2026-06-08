Title: The Honest Field Guide to Production Inference
Date: 2026-04-08
Category: Writings
Slug: inference-field-guide
Summary: TCO frameworks, vendor evaluation, and architecture patterns for teams adopting open-model inference. Includes the LCPR calculator, migration gates, and a staged playbook from API to dedicated GPU.
Template: longform_article
Status: published

---

## Part 0: The Cost Illusion

I work at Together AI. Together is one of the providers named in the worked examples in this essay, alongside OpenAI, Anthropic, Google, Fireworks, Baseten, DeepInfra, Anyscale, Replicate, Modal, Lambda, RunPod, and CoreWeave. Read every Together-named price, performance number, and customer outcome with that affiliation in mind. The LCPR math is provider-neutral by construction; the choice of which providers appear in worked examples is not. Technical details have been generalized from production work; no proprietary information from any organization is disclosed.
{: .has-dropcap}

Speculative decoding speeds single-request latency. At production batch sizes, the speedup vanishes.

At batch 12, I measured 0.92x throughput compared to batch 1 (based on the author's prior production experience). The deployment was a high-volume quick-serve voice ordering system: 100K+ daily interactions, 400-600ms inference budget. Under production concurrency, we were paying 8% more compute with spec decode enabled than without.

Published papers report 2-3x decode speedup, all measured on single-request, clean-benchmark conditions. At batch 12-16, different sequences accept different numbers of draft tokens, creating batch-level inefficiency: some sequences are still verifying while others have moved on to generation. The memory bandwidth cost of maintaining KV caches for both draft and target models, plus the verification overhead, eats the theoretical single-request speedup. Add a draft model that's never seen a brand-specific menu item in its training data, and you're underwater.

I spent two weeks on this before I killed it. Tried three draft model configurations. Fine-tuned a 1B speculator on 10K production transcripts. Acceptance rate went from 48% to 58%, still below breakeven. The math is unforgiving: at α=0.55, γ=5, you get 1.94 expected tokens per step for 1.15x the cost. Net negative.

Static spec decode works at batch 1-4. The breakdown starts around batch 8. If your production traffic stays at low concurrency, measure before dismissing. Most teams running open-weights at production scale are past batch 8.

The pattern here matters more than speculative decoding. The framing problem is the gap between advertised cost and true cost.

There's a concept from Elon Musk's early SpaceX days. He couldn't afford rockets, so he calculated the raw material cost (carbon fiber, metal, fuel) and compared it to what the aerospace industry charged for a finished product. The ratio was 50x. He called it the "idiot index": the cost of the finished product divided by the cost of its component materials. If the ratio is high, somewhere in the chain, a massive amount of unnecessary complexity has been layered on top.

AI deployment has its own idiot index. Not in hardware; GPU pricing is competitive and transparent. The idiot index in inference is the gap between the advertised cost of running a model and the true cost of getting a correct answer out of it in production. Pricing pages quote token rates. Production systems pay for retries, schema failures, quality gate rejections (automated checks that validate output format, accuracy, and safety before passing results downstream), engineering time, and an observability bill that grows 30-50% year over year.

This essay closes that gap using math, not benchmarks. Benchmarks lie in predictable ways.

### The April 2026 price signal

On April 23, 2026, OpenAI launched GPT-5.5 at $5.00/$30.00 per million input/output tokens, double the rates of its predecessor GPT-5.4. Anthropic held Claude Opus 4.7 and Sonnet 4.6 at $5/$25 and $3/$15 respectively. Gemini 2.5 Pro at $1.25/$10 (≤200K context) remains the cheapest frontier option.

The signal is clear: expect price increases at the frontier, not decreases. Serverless open-weights inference (pay-per-token on shared GPU infrastructure, no reserved capacity) is 5-10x cheaper at the total-cost level for non-reasoning workloads and within 5-15% quality on most benchmarks. The price gap between frontier closed APIs and serverless open-weights is widening. The open-weights cost advantage is structural, not temporary.

"5-10x cheaper" is a simplification. The ratio shifts with retry rate, output length, and engineering overhead.

### The number that actually matters

Token pricing is a component, not a cost. The number you should care about is what I call **Loaded Cost Per Request** (LCPR):

```
LCPR = (token_cost + repair_cost + engineering_cost)
       / successful_requests
```

Where:

- **Token cost** = (input tokens × input rate + output tokens × output rate) × total attempts. Total attempts = original requests × (1 + retry rate). Every retry is a full re-request that burns tokens, so retry cost is not a separate line item; it inflates total token spend directly.
- **Repair cost** = requests that fail quality or schema gates × cost to re-prompt
- **Engineering cost** = monthly hours maintaining the inference stack × hourly rate. This is the most volatile LCPR input. ML engineer turnover (median tenure 18-24 months at AI-native companies) resets institutional knowledge: the replacement re-learns your prompt pipelines, eval harnesses, and provider quirks over 2-4 months, during which effective engineering hours double. A single departure on a 2-person inference team can spike LCPR 15-25% for a quarter. Budget for it by cross-training and documenting runbooks; the LCPR impact of attrition is a hidden tax that no vendor model captures.
- **Successful requests** = total requests × quality gate pass rate

This formula is deliberately simplified. It omits cold start costs (relevant for scale-to-zero serverless), KV cache memory overhead (implicit in token cost for serverless, explicit for dedicated), and observability costs (covered separately in "The Observability Tax" below). A full-stack TCO model would include those. But even this simplified version produces materially different rankings than raw token pricing, which is the point. The full decomposition --- splitting `engineering_cost` into eval grader cost, human escalation, operational overhead, and a reconciliation delta term --- is developed in the [Production Inference Economics series]({filename}/denominator-problem.md), starting with [The Denominator Problem]({filename}/denominator-problem.md).

**Before you calculate, align on definitions.** LCPR only produces meaningful comparisons when every team member agrees on what the terms mean:

- **Token**: the provider's tokenization, not yours. Different tokenizers produce different counts for the same text. A 500-word paragraph might be 600 tokens on GPT-5.5 and 650 on Llama 3. Use the provider's token count from the API response, not a local estimate.
- **Request**: one API call, including the full input and output. A multi-turn chat where you send conversation history is one request per turn, not one request per conversation. A retry is a separate request.
- **Cost**: the invoice amount, not the pricing-page estimate. Includes cache discounts actually applied, batch pricing tiers actually hit, and any overages or committed-use adjustments.
- **Success**: a request that passes your quality gate and reaches the end user. A request that returns 200 OK but fails schema validation is not a success. A request that the user ignores because it took 8 seconds is a success by this definition but a failure by your product's.

Misalignment on these definitions is the most common source of "our numbers don't match the vendor's" disputes.

**Three ways LCPR lies to you.** Even when calculated correctly, aggregate LCPR can mislead:

1. **Engineering cost dominance at low volume.** At 50K requests/month, 8 engineering hours at $100/hr is $800, which adds $0.016 per request. That's more than the token cost on cheap providers. LCPR makes open-weights look expensive at low volume not because the tokens are expensive, but because the fixed engineering overhead hasn't been amortized. The fix: segment LCPR by workload and don't aggregate across volumes.

2. **Migration double-paying.** During a migration (typically 6-10 weeks), you're running both old and new providers. Your LCPR temporarily spikes because engineering_cost doubles (maintaining two stacks) while successful_requests hasn't fully shifted. Teams that measure LCPR monthly sometimes panic and cancel the migration during this spike. Plan for it: model the transition period separately.

3. **Aggregate LCPR hides workload variation.** A blended LCPR of $0.008 across all workloads can hide a $0.003 chat workload and a $0.025 RAG extraction workload. The chat workload might be optimally placed on open-weights, while the RAG workload needs frontier quality. Always segment LCPR by workload before making migration decisions.

Almost nobody calculates LCPR, which means almost nobody has accurate cost comparisons across providers.

**Segment LCPR before you optimize.** Failure mode #3 above deserves emphasis. Compute LCPR along three dimensions:

- **By model**: GPT-5.5 for reasoning, DeepSeek V3 for chat, Llama 70B for classification. Each has different retry rates, quality gates, and token costs.
- **By use case**: customer-facing chat has different latency and quality requirements than internal batch summarization. A single "inference cost" number conflates workloads with 10x different LCPR.
- **By user segment**: enterprise customers generating 10x the tokens of self-serve users may justify dedicated infrastructure, while self-serve stays on serverless. Revenue-weighted LCPR reveals which segments fund which.

The calculator supports this: run each workload profile separately, then weight by volume. A team that optimizes blended LCPR will underinvest in their most expensive workload and overinvest in their cheapest.

**Every LCPR input is an assumption until measured.** Before trusting a calculator output, tag each input with its confidence level:

| Assumption | Default value | Confidence | What changes it |
|---|---|---|---|
| Retry rate | 3% | Assumed | Measure from production logs; spikes during model migrations |
| Quality gate pass rate | 95% | Assumed | Varies 70-99% by model and task; measure from eval suite |
| Avg output tokens | 400 | Assumed | Highly variable; measure P50 and P95 separately |
| Engineering hours/month | 8 | Estimated | Track actual hours for 2 months; often 2-3x initial estimate |
| GPU utilization | 40% | Industry estimate | Measure from GPU metrics; varies 25-65% by workload pattern |
| Repair cost per failure | $0.002 | Assumed | Measure actual re-prompt cost including latency penalty |

The calculator defaults are reasonable starting points, not ground truth. Replace each "Assumed" with "Measured from logs" as you instrument your stack. An LCPR model built on six assumptions is a hypothesis; one built on six measurements is a budget.

### Worked example: the numbers change

Consider a mid-scale SaaS workload: 500,000 requests per month, 800 input tokens and 400 output tokens per request, 3% retry rate, 95% quality gate pass rate, and 8 engineering hours per month at $100/hour to keep things running.

Here's what the LCPR looks like across deployment modes, using May 2026 public pricing:

| Provider | Raw $/request | LCPR | Monthly cost | Overhead ratio |
|----------|------------:|-----:|-----------:|------:|
| OpenAI GPT-5.5 | $0.0160 | $0.0191 | $9,090 | 1.20x |
| Lambda H100 (dedicated, 40% util) | $0.0057 | $0.0078 | $3,723 | 1.36x |
| Together AI DeepSeek V3 (serverless) | $0.0012 | $0.0030 | $1,447 | 2.63x |
| Fireworks AI Llama 70B (serverless) | $0.0011 | $0.0030 | $1,406 | 2.74x |
| DeepInfra GPT-OSS-120B (serverless) | $0.0001 | $0.0019 | $905 | 17.8x |

The table shows three things.

The ranking is stable but the magnitude isn't. GPT-5.5's raw token cost is $0.016 per request and its LCPR is $0.019, 20% higher, the smallest overhead in the table. For a managed API with near-zero engineering burden, that's a thin tax. DeepInfra at $0.0001 per request (asymmetric pricing: $0.039/$0.19 per million input/output) has an LCPR of $0.0019, a 17.8x overhead ratio. DeepInfra is still the cheapest total cost in the table; the high ratio is the inverse signal. Tokens are cheap enough that fixed costs (engineering, retries, repair) dominate the per-request LCPR. Cheap providers need volume to amortize.

Cost ratios compress at the LCPR level. GPT-5.5 is 13.8x more expensive than Together on raw token cost; at LCPR, it's 6.3x. Engineering overhead, retries, and repair are roughly provider-independent, so they compress every ratio. Any comparison that doesn't include these costs is overstating the savings from switching providers.

Dedicated GPU is not the cheapest option at this volume. A Lambda H100 at $3.99/hr with 40% realistic utilization produces an LCPR of $0.0078, more expensive than both serverless open-weights options. The GPU costs $2,873/month whether you use it. At 500K requests generating 200M output tokens per month, you're paying for capacity you don't fill. Dedicated wins at scale; the crossover is higher than most teams expect (see "Break-even math for dedicated GPU" below).

### The numbers change when reliability changes

The worked example above assumes a 3% retry rate and 95% quality gate. What happens when those shift?

At 20% retry rate (not uncommon during model migrations or prompt changes), GPT-5.5's LCPR rises to $0.0220. Together's rises to $0.0033. The ratio *increases* from 6.3x to 6.8x; retries hurt expensive providers more because each retry costs more tokens.

At 70% quality gate pass rate (a model that frequently fails structured output validation), GPT-5.5's LCPR jumps to $0.0267. Together's jumps to $0.0048. The ratio *compresses* to 5.5x because repair and engineering costs are provider-independent and start to dominate.

**The I/O ratio matters more than most teams realize.** The GPT-5.5 vs Together cost advantage depends heavily on the output-to-input ratio. GPT-5.5 prices output at 6x its input rate ($30 vs $5 per million), while Together's output premium is smaller at 2.8x ($1.70 vs $0.60 per million). At 800 input tokens with varying output:

| Output tokens | Raw ratio | LCPR ratio |
|-------------:|----------:|-----------:|
| 100 (classification) | 10.8x | 3.8x |
| 400 (essay default) | 13.8x | 6.3x |
| 1,000 (long-form) | 15.6x | 9.3x |
| 1,500 (code gen) | 16.2x | 10.8x |

Output-heavy workloads (code generation, long-form content) see the largest savings from migration. Input-heavy workloads (classification, embedding prep) see the smallest, and may not justify migration at all if the volume is low.

The pricing page is the token rate. LCPR is the bill. The gap is the cost illusion, and it widens with retry rate, output length, engineering time, I/O ratio, and observability cost. No vendor has any incentive to help you measure those.

### The observability tax

One cost deserves special mention because it's frequently the largest hidden expense teams discover too late: observability.

byteiota's 2026 analysis found a median Datadog bill of $123K/year for mid-market companies, growing 30-50% year over year. Teams adding LLM monitoring report 40-200% bill increases because GenAI semantic-convention spans get billed as custom metrics. AI workloads generate 10-50x more telemetry than traditional services.

If you're modeling a migration from closed APIs to self-managed inference, budget 2-4x your Year-1 observability estimate. The Datadog bill is not a rounding error; it rivals your GPU spend at small to medium scale.

### What's in the rest of this essay

Five framings structure what follows. Part 1 is about deciding whether to leave the API for a given workload: three gates (volume, specialization, ownership) and a migration-complexity score for the "how hard" question. Part 2 is the multi-source architecture: four sourcing patterns and the routing layer between them. Part 3 is the inference stack itself, layer by layer, with a buy-vs-build call per layer. Part 4 is vendor evaluation: seven gates and how to verify each. Part 5 is the staged playbook: entry and exit thresholds for each operational tier from Stage 0 (closed API only) through Stage 3 (build-side). Each section has worked numbers from the [LCPR calculator](https://inference-econ.streamlit.app), named customer references with links, and the cases where the framework breaks.

The frameworks are decision tools, not analyses. If your situation doesn't fit them, the data — your LCPR, your latency budget, your compliance constraints — is the answer, not the framework.

---

## Part 1: When to Leave the API

Whether open-weights inference is cheaper is settled (Part 0): ~6x at the loaded level, 10-100x on raw tokens. When the savings justify the migration cost is not.

Most teams get this wrong in one of two directions. They either stay on closed APIs past the point where they're hemorrhaging money, or they migrate too early, spend 10 engineer-weeks rebuilding prompt pipelines, and discover the savings don't cover the engineering bill for two years.

Three gates follow. Volume is the default; specialization and ownership each independently override. If none of the three pass for a given workload, stay put.

### Gate 1: The Volume Gate

Migration has a fixed cost. The range varies by complexity:

- A straightforward API swap (same model family, OpenAI-compatible endpoints) takes 2-4 engineer-weeks.
- A standard migration requiring prompt adaptation and quality gate validation takes **6-10 engineer-weeks**, plus another 4-8 weeks of optimization to reach cost parity.
- Complex migrations involving fine-tuning, custom structured output validation, or domain-specific evaluation harnesses can extend to 12-20 weeks.

At a blended rate of $150/hour for a senior ML engineer, 8 engineer-weeks costs $48,000. Does your monthly savings exceed the amortized migration cost over a reasonable payback period?

Here's the worked example. A B2B SaaS company running 800,000 requests per month on GPT-5.5, with 1,000 input tokens and 500 output tokens per request, a 5% retry rate, 92% quality gate pass rate, and 12 engineering hours per month to maintain the stack.

| Provider | LCPR | Monthly cost |
|----------|-----:|-----------:|
| OpenAI GPT-5.5 | $0.0246 | $18,128 |
| Lambda H100 (dedicated, 40% util) | $0.0057 | $4,201 |
| Together AI DeepSeek V3 (serverless) | $0.0035 | $2,546 |
| Fireworks AI Llama 70B (serverless) | $0.0033 | $2,462 |

Switching from GPT-5.5 to Together DeepSeek V3 saves $15,582 per month, or $186,984 per year. Against a $48,000 migration cost, the payback period is 3.1 months. That's a clear pass.

But notice what happens at lower volume. In the Part 0 worked example (500K requests/month, simpler workload profile), GPT-5.5's monthly cost was $9,090. Against Together at $1,447, the savings are $7,643/month. Still a 6.3-month payback, which is acceptable, but you're now sensitive to migration overruns. If the migration takes 12 weeks instead of 8, or if the quality gate drops from 95% to 88% during the transition and you spend two months tuning prompts, the payback stretches past a year.

**The Volume Gate threshold**: if your monthly closed-API spend is below $10,000, the migration economics are marginal. Between $10,000 and $50,000, the economics work but execution risk matters; you need a team that's done this before. Above $50,000, the savings are large enough to absorb migration friction. These boundaries are rough; run the [LCPR calculator](https://inference-econ.streamlit.app) against your actual workload to get precise numbers.

### Gate 2: The Specialization Gate

Volume isn't the only reason to migrate. Sometimes the workload requires something closed APIs can't provide.

**Fine-tuned models.** If your quality evaluation shows that a fine-tuned 8B or 70B model matches frontier quality for your specific domain, the cost advantage is enormous. Cresta runs thousands of LoRA adapters (Low-Rank Adaptation: small trainable weight matrices attached to a frozen base model, enabling efficient fine-tuning) for per-domain contact center agents on Fireworks Multi-LoRA at $0.20/M tokens, a 27.4x LCPR advantage over GPT-5.5 at 3M requests/month. Even accounting for the engineering cost of training and maintaining the fine-tune pipeline, the payback is measured in weeks, not months.

**Latency SLOs.** Shared APIs under load produce P99 latency spikes from ~300ms to 2-4 seconds on 70B-class models. For agent pipelines with 5+ chained calls, that compounds: a 2-second P99 across 5 calls is a 10-second worst case. Dedicated inference lets you control batch size and KV cache budget.

A bulk-extraction workload illustrates the specialization-gate logic. A mid-stage legal-tech company was processing roughly 2.1 million historical contract documents (average 8,400 tokens each, mostly English with a substantial Latin-American Spanish-language corpus). The pipeline ran a Llama-class 70B for per-document field extraction (parties, effective date, governing law, termination clauses) with a JSON-validated controlled-vocabulary schema of ~80 jurisdictions.

The backfill projected at $11-13K over six weeks. By week 9 it had spent $34K and was 58% complete. The first three hypotheses (eval-pass cost, long-document outliers, wrong-model selection) all came back negative. The fourth measurement found request volume had doubled in week 4 with no traffic-mix change: 47% of traffic was now tagged `retry`, almost all of it failing on a single field, `governing_law`, where the model was emitting jurisdiction strings inconsistently for Spanish-language documents. "Mexico" / "México" / "United Mexican States" / "Mexican Federal" all rejected. Each retry re-paid the full input cost (~$0.067) for a ~$0.001 fix.

The fix was a deterministic post-process normalization layer (string-to-canonical-jurisdiction lookup) before JSON validation. Retries dropped from 47% to 4.1%. The remaining backfill completed in 11 days at ~$4,800.

The specialization-gate lesson is the side-finding, not the headline. The team had been about to migrate to a more capable frontier model, passing both the Volume Gate ($34K spend) and what looked like a Specialization Gate (low extraction quality). The actual problem was upstream of the model: a controlled-vocabulary schema with no normalization layer was wasting 47% of throughput on retries. Every controlled-vocabulary structured-output schema needs deterministic normalization paired with the validation gate. The Specialization Gate isn't just about model capability; it's about whether your pipeline's deterministic layer can absorb model variance cheaply.

Cursor's Fast Apply feature is the parallel point on a different vendor: fine-tuned Llama-3-70B at ~1,000 tokens/sec via Fireworks speculative decoding ([source: Cursor + Fireworks case study](https://fireworks.ai/blog/cursor)). Sub-500ms latency on chained calls that shared APIs cannot guarantee under load. Domain-tuned draft models with per-workload acceptance-rate optimization; generic spec-decode draft models fall off on domain-specific vocabulary, the technical reason the deployment from Part 0 didn't work.

**Custom architectures.** Some workloads require model modifications that closed APIs don't support: constrained decoding, custom sampling strategies, domain-specific tokenizers, or inference-time interventions like activation steering. If you need to modify the model's forward pass, you need dedicated inference.

**The Specialization Gate threshold**: if any of the following are true, migration passes this gate regardless of volume: (a) a fine-tuned model matches frontier quality for your task, (b) you have a hard P99 latency SLO under 500ms on chained calls, or (c) you need model-level modifications.

**Quality degradation risk.** Passing the Specialization Gate requires eval infrastructure you may not have yet. Before committing to migration, run your target open-weights model against your production eval suite (not a public benchmark) and compare quality gate pass rates. A model that scores 92% on MMLU but 78% on your domain-specific extraction tasks will produce a *higher* LCPR than the frontier API it replaces: more retries, more repairs, more engineering time debugging failures.

Budget 2-4 weeks of eval development before the migration clock starts. If you don't have a production eval suite, building one is prerequisite work, not migration work.

### Gate 3: The Ownership Gate

The third gate is non-economic: compliance, data residency, and vendor dependency.

**Data residency.** If your workload processes EU PII, Schrems II makes US-hosted inference legally fraught (the EU-US Data Privacy Framework, adopted July 2023, restored a legal pathway to DPF-certified US companies, but challenges are pending). The viable EU-resident options as of May 2026 are Nebius (Finland, France), Scaleway, Mistral La Plateforme, and OVH. None of the major closed APIs (OpenAI, Anthropic) offer guaranteed EU-only inference. Anthropic's `inference_geo=US` parameter exists because their default routing isn't geo-constrained. Verify data residency guarantees in your contract. Vendor documentation and API parameters are not legal commitments.

**Zero data retention.** For healthcare and financial workloads, the default storage behavior matters more than the compliance certification. Baseten stores nothing by default. Fireworks retains for 30 days on the Response API unless `store=false`. Together stores by default unless you disable it. OpenAI's fine-tuning retains training data. If your legal team requires contractual zero-retention by default, this narrows your vendor set.

**Vendor concentration risk.** Anthropic outages in 2024-2025 produced real revenue loss for single-sourced teams. If a single provider outage costs more than 1% of monthly revenue, you are underinvested in multi-sourcing. Multi-sourcing across closed APIs still leaves you dependent on two or three vendors' pricing decisions. Open-weights on serverless gives you model portability: if your primary serverless provider has an outage, the same DeepSeek V3 weights are available across Fireworks, DeepInfra, Anyscale, Replicate, Hyperbolic, Together, and most other open-model hosts. Failover is a model-string change in your gateway.

**The Ownership Gate threshold**: if regulatory requirements force specific data handling, or if vendor concentration risk exceeds your tolerance, migration passes this gate regardless of volume.

### When NOT to migrate

Not every workload should move. Three patterns where closed APIs remain the right answer:

**Small-token, high-volume workloads where Mini-class models win.** GPT-5.4 Mini at $0.75/$4.50 per million tokens trades off against Together DeepSeek V3.1 at $0.60/$1.70 in a workload-dependent way. On a voice classification task at 300 input tokens and 150 output tokens at 3M requests/month, the input-heavy ratio compresses the gap considerably; on output-heavy tasks the open-weights advantage widens. Open-weights isn't always the right call; the math depends on the input/output ratio and which model tier you're comparing against. Run the calculator before assuming.

**Reasoning-heavy workloads where frontier quality matters.** If your task requires chain-of-thought reasoning, mathematical proof, or complex code generation where GPT-5.5 or Claude Opus 4.7 measurably outperform open-weights alternatives, the quality delta means more failed requests, more retries, and a higher LCPR on the open-weights side. Quality gate pass rate is the most powerful variable in the LCPR formula. A 10-point drop from 95% to 85% increases LCPR by 13% on expensive providers and up to 19% on cheap ones where fixed costs dominate.

**Prototyping and early product.** At less than $10,000 per month, the engineering overhead of managing even a serverless open-weights deployment (prompt migration, model evaluation, gateway configuration) exceeds the savings. Use a closed API, ship the product, and revisit when you hit the Volume Gate.

### When to stay on closed APIs permanently

The three cases above describe workloads where migration doesn't make sense *yet*. Some workloads should stay on closed APIs indefinitely:

**Reasoning-dominated pipelines with no open-weights equivalent.** If your core product depends on frontier reasoning (multi-step mathematical proof, complex agentic workflows with 10+ tool calls, code generation where GPT-5.5 or Claude Opus 4.7 measurably outperform the best open-weights models on your eval suite), the quality gap may never close. Open-weights models improve, but so do frontier models. If your eval pass rate on the best open model is 15+ points below frontier, plan to stay on closed APIs and optimize via caching and prompt engineering instead of migration.

**Rapid model rotation.** Teams that switch models every 2-3 months to chase the latest frontier release (GPT-5.5 → Claude Opus 4.7 → Gemini 2.5 Pro) get more value from closed API flexibility than from open-weights cost savings. Migration engineering amortizes poorly if you're rotating providers anyway. The LCPR math still applies; just run it with `engineering_hours_per_month` reflecting your actual switching costs.

**No ML engineering capacity.** If your team has zero ML engineers and no plan to hire, the operational overhead of even managed serverless open-weights (prompt migration, model evaluation, quality gate tuning) exceeds the cost savings for most workloads under $50K/month. Closed APIs abstract this away. The calculation changes if you hire: one senior ML engineer at $200K/year (fully loaded) pays for itself in migration savings above ~$30K/month in inference spend, assuming they can execute a standard migration in 8 weeks.

### The Gemini question

Gemini 2.5 Pro at $1.25/$10 looks like frontier quality at near-open-weights pricing. Why migrate to open-weights when Gemini exists?

The answer depends on the workload shape.

**Output pricing is still asymmetric.** Gemini's output rate is $10/M, roughly 6x Together's $1.70/M. For a RAG pipeline at 4,000 input / 600 output tokens and 800K requests/month, Gemini's LCPR is $0.0131 versus Together's $0.0049, a 2.7x gap. For output-heavy workloads (code generation at 800/2,000 tokens), Gemini's LCPR rises to $0.0239 versus Together's $0.0054, a 4.5x gap. Gemini is near-open-weights on *input* but not on *output*.

**No customization.** You cannot fine-tune Gemini, run custom speculators, control quantization, or modify the inference pipeline. Cursor ([source: Fireworks + Cursor case study](https://fireworks.ai/blog/cursor)) and Decagon ([source: Together AI + Decagon case study](https://www.together.ai/customers/decagon)) need these capabilities, which is why they run dedicated open-weights infrastructure.

**Data sovereignty.** Gemini runs on Google infrastructure with no self-hosting option and no zero-retention guarantee. For regulated workloads, this narrows the viable use cases.

**Vendor lock-in.** If Google changes pricing (as OpenAI did with GPT-5.5), there's no portability. Open weights move between Together, Fireworks, DeepInfra, and self-hosted deployments.

**Where Gemini wins:** input-heavy classification and analysis workloads where output is short, customization is unnecessary, and Google's data handling is acceptable. At 2,000 input / 100 output tokens, the Gemini-to-Together LCPR ratio compresses to 1.9x, still a modest gap. The migration gates still applies: if the savings don't cover migration cost, stay on Gemini.

### The break-even math for dedicated GPU

The three gates above address *whether* to migrate from closed APIs. A separate question is *when* to move from serverless open-weights to dedicated GPU. This is a volume calculation with a specific crossover point.

A Lambda H100 at $3.99/hr costs $2,873/month whether you use it or not. Running a 70B FP8 model with vLLM continuous batching, it sustains approximately 1,500 output tokens/sec at high batch utilization. At full utilization, that's 129.6M output tokens per day.

(This break-even is calculated on output tokens because typical chat workloads are bottlenecked by autoregressive decode. For long-context workloads with >8K input tokens or short-output tasks like classification, prefill dominates and the economics shift. Dedicated becomes relatively more attractive because you're paying for compute you'd pay for anyway.)

Against Together's serverless output rate of $1.70/M, break-even is **56.3M tokens/day at full utilization**. Against Fireworks at $0.90/M, it's 106.4M tokens/day.

But production workloads don't saturate. Real utilization on dedicated inference runs 30-50%, with 40% as the midpoint. The gap comes from decode-phase memory bandwidth limits, variable batch sizes across time-of-day, cold start periods after deployments, and the fact that real traffic doesn't produce constant request rates. Cast AI's [2026 State of Kubernetes Optimization Report](https://cast.ai/press-release/2026-state-of-kubernetes-optimization-report/) finds 49% GPU utilization on a 136-H200 cluster is "the ceiling, not the floor"; that matches the 25-45% range I've measured across production dedicated deployments. A team sustaining 50%+ on dedicated GPUs is doing better than most.

At 40% real utilization, break-even against Together rises to **140.8M tokens/day**. Against Fireworks, it's 266.0M tokens/day.

For context: 140.8M output tokens per day is approximately 4.7 million requests at 30 tokens per response, or 469,000 requests at 300 tokens per response. Most teams don't reach this volume on a single model endpoint. If your utilization consistently stays below 40%, the correct move is back to serverless, or consolidating workloads onto the GPU via Multi-LoRA serving.

### The middle path: managed dedicated

Between serverless and self-managed GPU sits a third option: managed dedicated endpoints. You reserve GPU capacity (hourly or monthly billing), but the provider handles runtime optimization, quantization, autoscaling, and kernel selection.

Together AI's pricing illustrates an important distinction: managed dedicated inference endpoints run at $1.76-$2.39/hr for H100 capacity ($4-$5.50/hr for B200), while raw GPU cluster rates run higher ($2.99-$3.99/hr for H100 on-demand on the gpu-clusters page). The lower range is the managed model-serving SKU; the higher range is raw GPU rental on InfiniBand-connected clusters. Other vendors (Baseten, Fireworks, Replicate, Modal) offer similar managed model-serving tiers separate from raw GPU pricing; verify which SKU you're quoting before comparing. Crossover from serverless to managed dedicated typically sits around 130,000 output tokens per minute of sustained traffic. Below that rate, serverless is cheaper.

The operational difference is significant. Self-managed dedicated (Lambda H100 at $3.99/hr) requires you to run vLLM, handle OOMs, tune batch sizes, and manage failover. Managed dedicated (Baseten, Fireworks, Modal, Replicate, Together) handles all of that; you get an endpoint URL with an SLA. The hourly rate is higher, but the loaded cost (factoring in engineering time) is often lower. Use the LCPR calculator to compare: if your engineering_hours_per_month for self-managed exceeds 40 hours at $150/hr, managed dedicated wins on total cost up to approximately $50K/month in GPU spend.

### Quick reference: the math behind dedicated GPU economics

Four formulas underpin the dedicated break-even analysis.

**Prefill vs decode bottleneck.** For short inputs (<2K tokens) with long outputs, decode (autoregressive token generation) dominates GPU time; throughput scales with memory bandwidth. For long inputs (>8K tokens) with short outputs, prefill (processing the full input in parallel) dominates; throughput scales with compute FLOPS. Most chat workloads are decode-bound; most RAG extraction workloads are prefill-bound. The break-even math assumes decode-bound; for prefill-bound workloads, adjust with the `prefill_efficiency` parameter in the calculator.

**KV cache memory sizing.** `kv_bytes = 2 × layers × heads × head_dim × seq_len × precision_bytes × batch_size`. A Llama 70B model (80 layers, 64 heads, 128 head_dim) at FP16 with batch 32 and 4K context uses ~42 GB of KV cache, over half the H100's 80 GB. This is why batch size has a hard ceiling on dedicated GPUs, and why longer contexts reduce maximum batch size (and therefore throughput).

**Little's Law for concurrency.** `concurrent_requests = arrival_rate × avg_latency`. If you're processing 100 requests/second with an average latency of 2 seconds, you have ~200 concurrent requests in flight. This determines the batch size your system sees, which determines throughput and per-request latency.

**Utilization step economics.** GPU cost is a step function, not a smooth curve. One H100 costs $3.99/hr whether it's at 20% or 95% utilization. Adding a second GPU doubles your cost to $7.98/hr but also doubles capacity. The break-even calculation assumes a single GPU; at multi-GPU scale, the economics are more forgiving because underutilization on one GPU can be offset by consolidating workloads.

### The decision flowchart

In practice, the three gates reduce to a sequence:

1. **Check the Specialization Gate first.** Do you need fine-tuned models, hard latency SLOs, or model-level modifications? If yes, migrate. The technical requirement overrides volume economics.
2. **Check the Ownership Gate.** Do compliance, data residency, or vendor risk requirements force the move? If yes, migrate. The regulatory requirement overrides volume economics.
3. **Check the Volume Gate.** Is your monthly closed-API spend above $10K? If yes, migrate. The savings justify the engineering cost.
4. **If none of the three gates pass**, stay on closed APIs for that workload.
5. **Once you've decided to migrate**, start with serverless open-weights. Move to managed dedicated when a single workload exceeds ~130K output tokens/minute sustained (roughly $3-5K/month on a single model). Move to self-managed dedicated only when GPU spend exceeds $50K/month AND you have inference engineers on staff.

The most common mistake is skipping straight to dedicated GPU. Serverless open-weights is the right default for the vast majority of workloads that have passed the migration gates. Dedicated is for the outliers; you'll know when you're an outlier because the serverless bill will tell you.

![migration gates decision tree]({static}/images/inference-field-guide/migration_gate.svg)

### The lead time reality

Even after passing the gates, the timeline from "decision to migrate" to "realizing savings" is longer than most teams budget for:

- **Weeks 1-4**: Eval suite development (if you don't have one), model selection, prompt adaptation. No savings yet; you're spending engineering time.
- **Weeks 5-8**: Shadow mode deployment (running both providers in parallel), quality gate validation, latency benchmarking. Cost *increases* because you're paying for both providers.
- **Weeks 9-12**: Traffic cutover (typically 10% → 50% → 100% over 3-4 weeks), monitoring for regressions, tuning. Savings begin ramping.
- **Weeks 13-16**: Full migration, old provider deprecated, optimization pass. Full savings realized.

For a standard migration, plan for **3-4 months** from decision to full savings. For complex migrations (fine-tuning, multi-model, compliance), plan for **6-12 months**. The payback calculation in the Volume Gate (e.g., "3.2 months") is the payback *after* migration completes, not from the decision date. Add 3-4 months of migration time to the total.

This timeline matters for budget planning. If you start a migration in Q1, don't promise Q1 savings. Promise Q2 savings with a Q3 steady state.

### Assessing migration complexity

The gates tell you whether to migrate; the migration-complexity score tells you how hard. A single-model chatbot swap and an eight-model enterprise migration with compliance requirements are both "migrations"; the first takes 4 weeks and the second takes 20.

Migration complexity is multi-factor, not one-dimensional. Six factors combine to determine timeline, cost, and the approach you should take. Each factor scores Low (1), Medium (2), or High (3):

| Factor | Low (1) | Medium (2) | High (3) |
|--------|---------|------------|----------|
| **Workload count** | 1-2 models, single use case | 3-5 models, 2-3 use cases | 6+ models, mixed latency/throughput requirements |
| **Prompt portability** | Simple prompts, no structured output | Moderate prompt engineering, JSON mode | Complex chains, tool use, function calling, custom schemas |
| **Quality infrastructure** | No formal evals | Basic eval suite (<50 test cases) | Comprehensive evals (500+ cases), regression testing, human-in-loop |
| **Latency sensitivity** | Batch/async (>5s acceptable) | Interactive (<2s P95 required) | Real-time (<500ms P95, voice, streaming) |
| **Team inference maturity** | No ML infra expertise | 1-2 engineers with vLLM/serving experience | Dedicated inference team (3+) |
| **Integration depth** | Single API call, stateless | SDK integration, session state, caching logic | Multi-system (gateway, observability, billing, compliance) |

Sum your scores. The total determines your tier:

- **6-9 (Simple)**: 4-6 weeks, 1-2 engineers, serverless-first. Self-service using this guide.
- **10-14 (Standard)**: 8-12 weeks, 2-3 engineers, evaluation framework required before cutover. Consider managed dedicated for primary workload.
- **15-18 (Complex)**: 12-20 weeks, dedicated team or vendor-side customer engineering partnership. Phased approach with parallel-run validation mandatory.

**Worked examples:**

*Simple (Score: 7).* SaaS startup, single chatbot on GPT-4o, 2M requests/month, no evals, interactive latency (<2s P95), 1 backend engineer. Migration: swap API endpoint, run A/B test for 1 week. Timeline: 4 weeks including testing. (Factors: workload 1, prompts 1, evals 1, latency 2, team 1, integration 1.)

*Standard (Score: 12).* Mid-market company, 3 models (chat, classification, embeddings), moderate prompts with JSON mode, basic eval suite, <2s latency requirement, 2 engineers with serving experience, gateway and observability already in place. Migration: model-by-model over 10 weeks with quality gates between each. (Factors: all 2s.)

*Complex (Score: 16).* Enterprise, 8 models across 4 use cases, complex tool-use chains, comprehensive eval harness, sub-500ms voice AI requirement, no dedicated inference team, deep integration with billing/compliance/multi-region. Migration: 16+ weeks with vendor-side customer-engineering partnership or equivalent expert engagement. Phased: one workload at a time with 2-week parallel-run per workload. (Factors: workload 3, prompts 3, evals 3, latency 3, team 1, integration 3.)

**The engineering hours reality.** The hidden cost in migration isn't tokens. It's engineering time. The deployment mode you choose determines your ongoing maintenance burden:

| Deployment Mode | Setup (one-time) | Ongoing (monthly) | Source |
|----------------|-------------------|-------------------|--------|
| Serverless open-weights | 2-8 hrs/workload | 2-5 hrs (monitoring, prompt updates) | from provider onboarding docs |
| Managed dedicated | 8-20 hrs (SLA design, testing) | 5-10 hrs (capacity reviews, model updates) | from Decagon/Cursor case patterns |
| Self-managed dedicated | 40-80 hrs (runtime setup, tuning) | 30-60 hrs (OOMs, scaling, kernel updates, on-call) | from Lambda/CoreWeave community data |

At a fully loaded engineer cost of $100-$200/hr (the calculator defaults to $100/hr; adjust in the sidebar), self-managed dedicated adds $3,000-$12,000/month in engineering overhead alone. That overhead is invisible in token pricing comparisons but dominates the LCPR calculation. A budget holder comparing "$3.99/hr GPU" to "$1.76/hr managed dedicated" is comparing the wrong numbers. The full picture requires engineering hours.

Use the [Migration Readiness tab](https://inference-econ.streamlit.app) in the LCPR calculator to score your factors interactively and see the payback calculation for your specific workload profile.

---

## Part 2: The Multi-Source Architecture

Single-provider was the 2024 default. Add-a-fallback was 2025. Multi-source is 2026 among AI-natives with meaningful spend, and the *how* is now the open question, not the *whether*.

This isn't a theoretical recommendation. Every company I've listed below runs multiple inference providers in production, and each has a specific architectural reason for doing so.

### The four patterns

Multi-source inference architectures fall into four patterns. Most production deployments use two or three of these simultaneously.

**Pattern 1: Workload-Segmented.** Different workloads go to different providers. This is the most common pattern.

Cursor is the canonical example. Fast Apply (their deterministic code-edit feature) runs on a fine-tuned Llama-3-70B at ~1,000 tokens/sec through Fireworks speculative decoding (source: [Cursor + Fireworks case study](https://fireworks.ai/blog/cursor)). Sualeh Asif, Cursor co-founder: "We leverage speculative decoding for our custom models deployed on Fireworks.ai, which power the Fast Apply and Cursor Tab features. Thanks to speculative decoding, we saw up to a 2x reduction in generation latency."

Cursor's 2x speedup is for deterministic code-edit operations with predictable output structure. That's a different workload shape than the high-concurrency, variable-output scenario described in Part 0 where naive spec decode is net negative. Adaptive speculative decoding (FireOptimizer, ATLAS) addresses the batch-size problem by selecting draft strategies per-request.

Composer 2 (Cursor's agentic coding model) trains and serves through Fireworks with weight syncs every training step via delta-compressed S3 uploads. Chat features use Claude Sonnet and Opus directly.

Cursor's production deployment spans multiple providers: Fireworks for speculative decoding on Fast Apply, Anthropic for frontier chat, and Together AI for Blackwell GPU inference with a quantization pipeline that moves new model weights from candidate to test endpoint within days ([source: Together AI + Cursor case study](https://www.together.ai/customers/cursor)). Each provider wins on a different constraint: throughput, reasoning quality, or hardware access.

Notion follows the same pattern: Fireworks for latency-critical features using fine-tuned models ("we reduced latency from about 2 seconds to 350 milliseconds," Sarah Sachs, Head of AI Engineering, [source: Fireworks case study](https://fireworks.ai/blog/Story-Notion)), Baseten for other workloads, Replicate and Modal for experimental and burst-scale inference paths, and Anthropic with prompt caching for features that benefit from frontier reasoning. Zomato's AI chatbot Zia, handling 1,000+ messages per minute on optimized Llama models through Together, achieved 2x CSAT improvement and 75% reduction in response time ([source: Together AI case study](https://www.together.ai/customers/zomato)).

**Pattern 2: Capability-Arbitrage.** The same logical workload routes to different providers based on the *specific capability* needed for each request. This requires more sophisticated routing but captures large cost savings.

The Multi-LoRA pattern is the clearest example. Cresta runs thousands of LoRA adapters on Fireworks Multi-LoRA for per-domain contact-center fine-tunes (documented 100x cost reduction versus GPT-4 on the fine-tuneable subset of traffic at deployment time, [source: Fireworks case study, Dec 2023 deployment](https://fireworks.ai/blog/story-cresta-knowledge-assist)), with escalation to frontier models for the complex residual. At $0.20/M tokens for a Llama 8B base with adapters versus GPT-5.5 at $5/$30, the LCPR advantage is roughly 27x at 3M requests/month (derived calculation against current pricing). Together has shipped comparable multi-adapter inference at similar pricing tiers since late 2025; Baseten and Replicate support LoRA-adapter serving with different pricing models. The architectural pattern (cheap-fine-tuned-base + escalation-to-frontier) is the case for capability-arbitrage; the vendor choice is downstream of who supports your base model and adapter format.

This is capability-arbitrage: use the cheapest model that can handle each request, and escalate only when necessary. The difficulty is building the routing logic to decide when to escalate. Most teams start with simple heuristics (input length, task type, confidence score) and add complexity only when the data justifies it.

**Pattern 3: Primary-Fallback.** A primary provider handles all traffic, with automatic failover to a secondary provider during outages or degradation. This is the minimum viable multi-source architecture.

The implementation is straightforward: an AI gateway (LiteLLM, Helicone, Portkey, or Bifrost) that routes to Provider A by default, detects failures (5xx responses, latency spikes above threshold, rate limit errors), and reroutes to Provider B. The same model family is available on both sides: DeepSeek V3 on Together with Fireworks as fallback, or Claude Sonnet via Anthropic with Bedrock as fallback.

This pattern doesn't save money. It costs slightly more because the fallback provider may have different pricing. Its value is availability: Anthropic outages in 2024-2025 demonstrated that single-source dependency on any provider, even a reliable one, is a business risk. If a single-provider outage costs more than 1% of monthly revenue, Primary-Fallback is table stakes.

**Fallback design matters more than fallback existence.** Two common failure modes:

1. Your fallback provider uses a different response format than your primary, so failover produces schema validation errors in your application layer: an outage that looks like recovery.
2. Your fallback hasn't been tested under load in months, so when you actually need it, you discover rate limits, stale API keys, or model deprecation.

Fix both: ensure your fallback produces identical response schemas (use your gateway's response normalization, or constrain both providers to the same structured output schema), and test failover monthly by routing 1-5% of live traffic to the fallback for 15 minutes. If the fallback can't handle 5% of traffic cleanly, it won't handle 100% during an outage.

**Pattern 4: Geo-Segmented.** Traffic routes to different providers based on geographic or regulatory requirements. This is compliance-driven, not cost-driven.

EU PII workloads route to Nebius (Finland, France) or Scaleway. US workloads route to any US-hosted provider. Federal workloads route to AWS Bedrock Government or Azure Government; those are the only FedRAMP-authorized paths as of May 2026. None of the neo-clouds (Baseten, CoreWeave, Fireworks, Lambda, Modal, Replicate, RunPod, Together) have FedRAMP authorization as of May 2026 ([source: marketplace.fedramp.gov](https://marketplace.fedramp.gov/)). Verify current status before making procurement decisions.

Anthropic's `inference_geo=US` parameter with its 1.1x pricing multiplier is an honest acknowledgment of the cost of geographic constraints. If data residency matters, expect to pay for it.

![Inference Sourcing Patterns decision tree]({static}/images/inference-field-guide/sourcing_patterns.svg)

### The complexity tax

Multi-source isn't free. Every additional provider adds operational surface area.

**Engineering overhead scales with providers, not linearly but noticeably.** Each provider has different API semantics, error codes, rate-limiting behavior, and structured output support. Prompt portability between models is imperfect; a prompt tuned for Claude may perform differently on DeepSeek V3. My experience: budget 2-4 engineering days per provider for initial integration and 1-2 hours per month per provider for ongoing maintenance (API changes, deprecation notices, pricing updates).

**Observability multiplies.** Each provider produces telemetry in a different format. Standardizing on OpenTelemetry semantic conventions for GenAI helps, but the custom-metrics cost in Datadog or Grafana scales with the number of distinct provider×model combinations you're monitoring. Two providers with three models each is six metric series per telemetry dimension. That adds up fast against the observability tax described in Part 0.

**Testing multiplies.** Quality gates need to run against each provider×model combination. If you have three providers and two models each, that's six evaluation runs per prompt change. Automated evaluation pipelines (using frameworks like Braintrust, Arize, or custom harnesses) are mandatory at this point; manual evaluation doesn't scale.

The honest math: for a team running two providers with two models each, expect 8-16 engineering hours per month of multi-source overhead. At $100/hour, that's $800-$1,600/month, a meaningful fraction of the savings at lower volumes. This is why the Volume Gate matters. If you're saving $5,000/month by multi-sourcing and spending $1,200/month managing the complexity, your net benefit is $3,800. Still positive, but not the 5-7x improvement the raw numbers suggest.

**Systems delay vs model delay.** When latency degrades in a multi-source architecture, the instinct is to blame the model or provider. Usually the bottleneck is upstream. Decompose P95 latency into its components before optimizing:

- **Network round-trip**: gateway → provider → gateway. Typically 10-50ms per hop; 2-4x that across regions. Measure with empty-payload pings.
- **Queue wait**: time between request arrival at the provider and decode start. Invisible in the API response; infer from TTFT minus expected prefill time. Spikes during peak hours.
- **Prefill**: processing the full input prompt in parallel. Scales with input length; 50-200ms for 2K tokens, 500ms+ for 8K+ on shared infrastructure.
- **Decode**: autoregressive token generation. Scales with output length; the bottleneck for most chat and generation workloads.
- **Post-processing**: schema validation, quality gate evaluation, logging, and response formatting on your side. Often 20-80ms and frequently overlooked.

If P95 is 3 seconds and decode accounts for 1.5 seconds, optimizing the model (switching to a faster provider, enabling speculative decoding) can only cut latency by half. The other 1.5 seconds is systems delay that requires infrastructure work: moving your gateway closer to the provider, reducing prompt length, caching prefill results, or parallelizing post-processing. Instrument each component separately before committing engineering effort.

### The routing layer

Every multi-source deployment needs a routing layer. The question is how sophisticated to make it.

**Level 0: Model-keyed routing.** Model X goes to Provider A, Model Y goes to Provider B. No dynamic decisions. This is what most teams actually run, and it works. Implementation: a config file in your AI gateway.

**Level 1: Failover routing.** Level 0 plus automatic failover on provider errors. Implementation: your AI gateway's built-in retry/fallback logic (LiteLLM, Helicone, and Portkey all support this out of the box).

**Level 2: Cost-aware routing.** Route based on real-time pricing, rate limits, and capacity. Send overflow traffic to the cheapest available provider. Implementation: custom logic in your gateway, or a routing service like Martian ($18M raised, Accenture Ventures integration) or Not Diamond.

**Level 3: Quality-aware routing.** Route based on predicted model quality for the specific request. Estimate whether the cheap model can handle this request or if it needs the frontier model. Implementation: RouteLLM (open-source, out of UC Berkeley's LMSys group), or custom classifiers.

My recommendation for most teams: **Level 1, with plans for Level 2.** Level 0 is too fragile; you need failover. Level 1 is straightforward and covers 90% of the value. Level 2 is worth building when your monthly inference spend exceeds $100K and you have distinct traffic patterns with different cost sensitivities. Level 3 is research-grade; watch RouteLLM and RouterArena (arXiv:2510.00202, the first independent benchmark of routing quality), but don't bet production on it yet.

### The build-side end-state

Character.AI represents the far end of the multi-source spectrum: full vertical integration. Custom Kaiju-family models (13B/34B/110B) running on DigitalOcean AMD Instinct MI300X/MI325X GPUs, handling 1B+ queries per day at ~20,000 inference QPS. Custom int8 attention kernels, KV cache on host memory between turns with LRU tree structure, quantization-aware training. They've achieved a 33x cost reduction since late 2022 and claim to be "13.5x cheaper than leading commercial APIs."

This is the build-side end-state. It works at Character.AI's scale. It does not work at yours. The engineering investment is measured in dozens of specialized inference engineers over multiple years. Don't attempt this until you have evidence (not a forecast, evidence) that your daily query volume justifies it. For everyone else, the serverless open-weights tier plus a routing layer gets you 80% of the economics at 5% of the engineering cost.

### What to implement first

If you're moving from single-source to multi-source, the implementation order matters:

1. **Add an AI gateway.** LiteLLM for development, Helicone or Portkey for production. This takes a day and costs nothing (LiteLLM and Helicone are open-source and self-hostable).
2. **Add a fallback provider** for your primary model. Same model family, different provider. Configure automatic failover in your gateway. This takes an afternoon.
3. **Move one workload** to a cheaper provider. Pick the workload with the highest token volume and lowest quality sensitivity: batch processing, summarization, or classification. Measure the LCPR before and after for 30 days before extending.
4. **Evaluate fine-tuning** for your highest-volume workload. If a fine-tuned 8B or 70B model matches frontier quality on your specific domain evaluation, the cost advantage justifies the training pipeline investment.
5. **Add geographic routing** only if compliance requires it.

Each step is independently valuable. You don't need to reach step 5 to benefit from step 1. The minimum viable multi-source architecture is steps 1 and 2 (a gateway with failover) and it can be implemented in a day.

---

## Part 3: The Inference Stack

Inference is not one decision. It's a stack of seven layers, each an independent choice. Most teams make the wrong call at least twice because they treat the stack as monolithic.

This section maps each layer: what it does, which tool wins, and the narrow conditions under which building your own makes sense.

### The inference stack

**Layer 1: AI Gateway.** *Recommendation: Buy.*

The gateway sits between your application and your inference providers. It handles routing, retries, rate limiting, and basic observability. The build case is almost never compelling because the open-source options are mature and free.

- **LiteLLM** (Python): broadest provider support, 100+ providers. Struggles past ~2,000 RPS per instance. Right for development and moderate production workloads.
- **Helicone** (Rust, Apache 2.0): ~8ms P50 overhead (per [Helicone docs](https://www.helicone.ai/blog/top-llm-gateways-comparison-2025); up to ~50ms under sustained load), strongest combined observability + routing. Production users handling 5,000+ RPS.
- **Portkey**: enterprise control plane. Processes 2.5T+ tokens across 650+ organizations per their self-reporting. HIPAA BAA available.
- **Bifrost**: 11-microsecond overhead. Right for hyperscale where gateway latency matters.

For most teams: LiteLLM in development, Helicone or Portkey in production. Build your own only if you have a specific technical requirement none of these meet.

**Layer 2: Inference Runtime.** *Recommendation: Buy (use vLLM, SGLang, or TensorRT-LLM).*

The runtime turns model weights into token predictions. The build case exists for very few teams (the major cloud providers, a handful of inference startups, and maybe a few hyperscale AI labs). All major runtimes (vLLM, SGLang, TensorRT-LLM) and managed providers (Baseten, Fireworks, Modal, Replicate, Together) now support prefix caching. Prefix caching reuses KV cache computations for shared prompt prefixes across requests; it is the single highest-ROI optimization for workloads with repeated system prompts, RAG context, or multi-turn chat. Structure prompts so that novel tokens appear at the end.

- **vLLM**: the production default. 12,500 tok/s for Llama 3.1 8B BF16 on H100. Hardware support: NVIDIA, AMD, TPUs, Trainium, Gaudi. Continuous batching, PagedAttention, tensor parallelism. The right default unless you have a specific reason otherwise.
- **SGLang**: ~29% higher throughput than vLLM on shared-prefix workloads via RadixAttention. Pick this for chat with long shared context, agent workloads, or evaluation harnesses.
- **TensorRT-LLM**: 15-30% higher peak throughput after a 10-30 minute compilation step. More mature multi-node support than vLLM as of May 2026. Pick this for stable models and latency-sensitive workloads (real-time voice, synchronous chat) where peak throughput and tail latency matter. Mature FP4 support on Blackwell (V0.17). The compilation overhead makes it unsuitable for frequent model updates, but for production deployments with infrequent model changes, it's the throughput leader.
- **TGI**: maintenance mode as of December 2025. Hugging Face now recommends vLLM or SGLang.

Build a custom runtime only if you have Character.AI-level scale (1B+ queries/day) and specific architectural requirements that justify custom attention kernels and KV cache management.

**Layer 3: Kernels.** *Recommendation: Buy.*

FlashAttention-4 (Tri Dao, Hot Chips 2025): up to 22% faster than cuDNN attention on Blackwell ([source: SemiAnalysis coverage](https://x.com/SemiAnalysis_/status/1960070677379133949); [Tri Dao blog, FA4 paper](https://tridao.me/blog/2026/flash4/)). Together Kernel Collection (TKC), built on the ThunderKittens framework from Stanford, reduces 1,000+ lines of CUDA to 100-200 lines while reporting notable speedups over FlashAttention-3 and FP8 inference gains on Blackwell ([source: Together AI blog, TKC](https://www.together.ai/blog/nvidia-hgx-b200-with-together-kernel-collection)).

Speculative decoding kernels are now a vendor differentiator. Together's ATLAS achieves 500 TPS on DeepSeek-V3.1 (2.65x standard decoding) by adapting draft model selection per-request ([source: Together AI blog, ATLAS](https://www.together.ai/blog/adaptive-learning-speculator-system-atlas)). Fireworks' FireOptimizer delivers ~2x latency reduction at Cursor ([source: Fireworks blog](https://fireworks.ai/blog/cursor)). Adaptive-speculation work is also active at Cerebras, Groq, and Baseten. NVIDIA cuBLAS + CUTLASS for everything else. The build case is essentially zero outside of foundation model labs and the handful of teams doing custom attention work.

**Layer 4: Hardware.** *Recommendation: Buy from neo-clouds.*

This is where the money is. Neo-cloud providers (GPU-focused cloud platforms offering bare-metal GPU access at lower prices than hyperscalers like AWS, Azure, and GCP) such as Lambda, RunPod, and CoreWeave offer 40-54% savings versus AWS for comparable on-demand GPU hours:

| Provider | GPU | $/hr | $/month |
|----------|-----|-----:|--------:|
| Lambda | H100 SXM | $3.99 | $2,873 |
| RunPod | H100 SXM5 | $4.41 | $3,175 |
| AWS | H200 (per GPU) | $4.975 | $3,582 |
| CoreWeave | H100 SXM | $6.16 | $4,435 |
| Baseten | H100 | $6.50 | $4,680 |

All prices are on-demand, per-GPU rates as of May 2026 ([sources: Lambda pricing](https://lambda.ai/pricing), [Baseten pricing](https://www.baseten.co/pricing/), [datacenterdynamics on AWS H200 hike](https://www.datacenterdynamics.com/en/news/aws-quietly-increases-prices-for-h200-ec2-instances-by-15/)). Lambda H100 SXM 80GB 1-8 GPU on-demand at $3.99/hr; older PCIe 40GB rates sit at $4.29/hr for the legacy SKU. Prices exclude persistent storage ($0.10-$0.25/GB/month), though InfiniBand/NVLink networking is included at most neo-clouds. Egress is zero at Lambda, RunPod, and CoreWeave; $0.05-$0.09/GB at AWS. Reserved pricing adds 15-40% discount for 1-12 month commits.

Lambda at $3.99/hr is 20% cheaper than AWS and 39% cheaper than Baseten. AWS hiked H200 prices ~15% in January 2026, widening the gap further.

Two caveats. First, hyperscalers offer services neo-clouds don't: FedRAMP authorization, managed Kubernetes at scale, integrated data pipelines, and enterprise support contracts with meaningful remedies. If you need FedRAMP, AWS Bedrock Government or Azure Government are your only options.

Second, if your application runs on AWS but inference runs on a neo-cloud, egress costs apply in both directions. For high-throughput workloads generating large outputs (code generation, long-form content), egress can add 20-40% to total cost. Factor this into your TCO calculation before committing.

**Layer 5: Orchestration.** *Recommendation: Buy NVIDIA Dynamo if multi-node.*

NVIDIA Dynamo 1.0 (GA March 2026) is the de facto disaggregation layer for multi-node NVIDIA GPU inference. Named production adopters include AstraZeneca, BlackRock, ByteDance, CoreWeave, Crusoe, DigitalOcean, Lightning AI, Meituan, Nebius, Pinterest, Together AI, and Vultr ([source: NVIDIA Dynamo 1.0 announcement](https://nvidianews.nvidia.com/news/dynamo-1-0)). It sits above vLLM, SGLang, and TensorRT-LLM and provides KV-aware routing, SLA planning, and the NIXL low-latency transfer library.

For non-NVIDIA hardware (AMD MI300X, AWS Trainium, Google TPUs), orchestration options are runtime-specific: vLLM supports AMD and Trainium natively but lacks Dynamo's disaggregation features. For single-node deployments (1-8 GPUs), plain vLLM or SGLang with Kubernetes HPA is sufficient. You need Dynamo when you're running multi-node inference with disaggregated prefill and decode, typically 16+ GPUs across multiple nodes.

**Layer 6: Observability.** *Recommendation: Buy, but budget carefully.*

Observability is where teams get burned. The bill grows 30-50% year over year, and AI workloads generate 10-50x more telemetry than traditional services.

- **Helicone** (bundled with gateway): free self-hosted, $20/seat/month Pro.
- **Arize AX**: free tier (1M traces / 14 days), Pro at $50/month.
- **Datadog GPU Monitoring**: $15-$23/host/month for infrastructure plus $31-$40/host for APM. The hidden cost is custom metrics: GenAI semantic-convention spans get billed as custom metrics, producing 40-200% bill increases.
- **Grafana Cloud Pro**: $19/month base plus usage-based pricing.

Start with Helicone for LLM-specific observability (traces, prompts, completions, token cost tracking). If you need production ML monitoring (drift detection, model quality regression over time, A/B test analysis), evaluate Arize, which covers a different dimension than Helicone. If you need general APM + infrastructure monitoring, Datadog is comprehensive but expensive: the median mid-market Datadog bill is $123K/year (byteiota.com, 2026) and growing 30-50% YoY. Budget 2-4x your Year-1 observability estimate.

**Layer 7: Routing Intelligence.** *Recommendation: Hold.*

The routing-startup category (Martian, Not Diamond, RouteLLM, Unify, TensorZero) is maturing but not yet production-proven at scale. RouteLLM (UC Berkeley LMSys, open-source) is the strongest option for teams comfortable running experimental infrastructure. RouterArena (arXiv:2510.00202) is the first independent benchmark.

For most teams: use your gateway's manual model-keyed routing. If you have a clear cost/quality routing problem (e.g., 70% of traffic can use a cheaper model without quality degradation), evaluate RouteLLM. Revisit the commercial routing category in 12 months when it has consolidated.

### The metering gap

One risk that cuts across all seven layers: the gap between what you think you're spending and what you're actually spending.

The chain from user request to provider invoice is longer than most teams realize:

`user workflow → inference event → attempts (including retries) → tokens (input + output, per attempt) → cache discount → fallback/retry/repair → provider invoice → internal cost allocation`

Each step in this chain introduces metering error. Your tokenizer may count differently from the provider's. Retry tokens may not appear in your application logs. Cache discounts may not match what you expected from the provider's documentation.

A 5% metering error on $100K/month in inference spend is $60K/year in unaccounted cost. At $500K/month, it's $300K. The fix is unglamorous: reconcile your telemetry against the provider invoice monthly. Compare token counts from your gateway logs to the provider's usage dashboard. Investigate any variance above 5%. Common sources: tokenization differences between your local tokenizer and the provider's (especially for non-English text or code), uncounted retry attempts, cache hit rates lower than assumed, and batched requests that get double-counted in your logs but single-counted on the invoice.

A worked example. A mid-market asset manager was running an RFP-response generation workload: bursty, roughly 3K queries on RFP windows, near-zero between windows. The workload sat on a 70B serverless open-weights model with structured-output validation. The pricing model in finance's projection used the vendor's reported per-request token counts straight from the API response: clean, well-instrumented, no obvious gaps.

The cost surprise surfaced at quarterly review. Year-to-date invoice spend ran 4.4% above projection across 100K+ requests/month. The first hypotheses (volume mix, retry inflation, cache hit rate drift) all came back negative. Tokenization parity, which the team had marked as "trivially correct" because both their local tokenizer and the API response token count came from the same vendor, was the fourth hypothesis. It was where the gap sat.

The vendor's reported per-request token count was computed against the model's runtime tokenizer. The invoice tokenizer, used downstream for billing, split punctuation slightly differently on certain Unicode sequences (specifically: smart quotes, em-dashes, and ligatures common in RFP source documents). The discrepancy was 4.4% on average and as high as 7% on heavily-formatted documents. The mechanism was buried in a 2-line note in the API docs that referenced a separate billing-tokenization spec the team had not read.

The fix was a reconciliation pass: pull the invoice tokenization spec, run it against logged inputs, and compare to the runtime count for each request. The 4.4% gap closed once we billed against the same spec the vendor billed against. The team moved to monthly reconciliation as a standing process.

The side-finding is uglier than the cost number. We discovered the same tokenization split was producing 0.8% of structured-output failures: RFP boilerplate phrases that the tokenizer broke at unexpected positions caused intermittent JSON-schema violations downstream. The 4.4% metering gap had been masking a small but systematic quality regression. Reconciliation work surfaces other people's problems; this is the discipline that exposes them.

**Proving the model against reality.** Once you have an LCPR model and a month of production data, reconcile:

1. Compare your gateway's token counts to the provider's usage dashboard. If they differ by more than 3%, your tokenizer is wrong; use the provider's count.
2. Compare your predicted monthly cost (LCPR × successful_requests) to the actual invoice. Variance above 10% means an assumption is wrong.
3. Spot-check retry rates: sample 1,000 requests from logs and count actual retries vs. your assumed rate.
4. Verify cache hit rates: compare expected cache hits (based on prompt structure) to the provider's reported cache hit rate.
5. Review pricing monthly. Providers change rates, add tiers, and modify cache discount policies without advance notice.

After one reconciliation cycle, update your LCPR inputs from "Assumed" to "Measured." After three cycles, your model is a budget, not a hypothesis.

### The build-vs-buy summary

| Layer | Recommendation | Build only if... |
|-------|---------------|-----------------|
| Gateway | Buy (LiteLLM/Helicone) | Never, unless hyper-specific caching needs |
| Runtime | Buy (vLLM/SGLang) | 1B+ queries/day with custom arch needs |
| Kernels | Buy | You are Tri Dao |
| Hardware | Buy neo-cloud | You need FedRAMP → hyperscaler |
| Orchestration | Buy Dynamo if multi-node | Single-node → skip entirely |
| Observability | Buy (Helicone/Arize) | Don't build; budget carefully |
| Routing | Hold (evaluate RouteLLM if clear routing win) | Don't build, don't buy commercial yet |

![Build vs Buy Spectrum]({static}/images/inference-field-guide/build_buy_spectrum.svg)

---

## Part 4: Vendor Evaluation

Vendor evaluation in inference has a specific problem: the features that matter most are the hardest to evaluate from public information. Pricing is transparent. Latency under load is not. Compliance certifications are public. Zero data retention defaults are buried in terms of service.

Seven evaluation gates structure the next section. Each gate has a pass/fail criterion and a method for verification. A vendor that fails any gate should be eliminated for that workload, regardless of how well they score on the others.

### Gate 1: Model Availability

*Does the vendor serve the specific model(s) you need, at the precision you need?*

This seems obvious, but model availability is more nuanced than checking a catalog page. Key questions:

- Is your model available in FP8? FP4? The precision affects both quality and throughput.
- For fine-tuned models: can you deploy custom weights, or only use the vendor's hosted versions?
- For LoRA: does the vendor support runtime LoRA loading, or do you need a separate deployment per adapter?
- How quickly do new models become available after release? Some vendors lag by weeks.

**Verification method**: check the model catalog page, then verify the specific precision and configuration via API. Don't trust the catalog alone; models listed as "available" may be in preview or limited access.

### Gate 2: Latency Under Load

*What is the P50/P95/P99 latency at your expected concurrency, not on an empty endpoint?*

Vendor-published latency numbers are measured on unloaded endpoints with optimal batch sizes. Production latency under shared infrastructure is 2-5x worse at P99. The only reliable latency data is either (a) your own benchmark on the vendor's infrastructure, or (b) independent benchmarks like Artificial Analysis or SemiAnalysis InferenceMAX.

**Verification method**: run your actual prompts at your expected concurrency for at least 7 days to capture weekly traffic patterns (weekend dips, Monday spikes, diurnal variance). 24 hours is insufficient for P99 SLO validation. Measure TTFT and inter-token latency at P50, P95, and P99. If the vendor won't give you a trial endpoint with sufficient duration, that's information.

### Gate 3: Throughput Economics

*At your volume, what is the LCPR, not the token rate?*

This is the LCPR calculation from Part 0. Input the vendor's published rates, your workload profile (tokens, retry rate, quality gate, engineering hours), and compute the loaded cost. Compare across vendors at the LCPR level, not the token level.

**Verification method**: use the [LCPR calculator](https://inference-econ.streamlit.app) with your actual workload numbers. The vendor's pricing page is an input to the calculation, not the answer.

### Gate 4: Reliability and Failover

*What is the vendor's published uptime SLA, and what are the actual remedies?*

Most vendors offer 99.9% uptime with credit-based remedies. Read the credit math: most are capped at the monthly fee for the affected period, which doesn't cover your revenue loss during an outage.

Key questions:

- What's the historical uptime over the last 12 months? (Check status pages and incident histories.)
- Does the vendor support multi-region deployment for failover?
- What's the rate-limiting behavior under load? (Some vendors degrade gracefully; others return 429s aggressively.)

**Verification method**: check the vendor's status page history. Ask for uptime data covering the last 6 months. If they can't provide it, assume 99.5% or lower.

### Gate 5: Compliance and Data Handling

*Does the vendor's default data handling match your requirements, not just their certifications?*

SOC 2 Type II and HIPAA are table stakes: Together, Fireworks, Baseten, Modal, Nebius, and FriendliAI all have them. The differentiator is the *default* data handling behavior:

- **Baseten**: zero data retention by default (verified May 2026).
- **Fireworks**: zero retention on standard inference; Response API retains 30 days unless `store=false` (verified May 2026).
- **Together**: data stored by default unless disabled in settings (verified May 2026).
- **OpenAI**: fine-tuning data retained; API data retention varies by endpoint.

Vendor data retention policies change. Verify current policy at contract time and get written confirmation; verbal assurances are insufficient for regulated workloads.

For EU data residency: Nebius (Finland, France), Scaleway, Mistral La Plateforme, OVH. For US federal: AWS Bedrock Government or Azure Government only.

**Verification method**: read the terms of service and data processing agreement. Ask specifically: "If I send a request to your API and do nothing else, is the prompt or completion stored? For how long? Where?" The answer should be in writing, not verbal.

### Gate 6: Integration Complexity

*How many engineering hours does it take to go from zero to production with this vendor?*

This covers API compatibility (OpenAI-compatible vs. custom), SDK quality, documentation completeness, structured output support, and streaming behavior. Vendors with OpenAI-compatible APIs (Together, Fireworks, DeepInfra) have lower integration cost because your existing code works with a URL change. Vendors with custom APIs (some Baseten configurations, custom runtimes) require more integration work.

**Verification method**: build a proof-of-concept integration. Measure time from API key to first successful production-format request. If it takes more than a day, factor that into your migration cost estimate.

### Gate 7: Pricing Trajectory

*Is this vendor's pricing going up or down, and why?*

This is the most forward-looking gate and the hardest to verify. The signal from April 2026 is clear: frontier closed APIs are increasing prices. Serverless open-weights providers are competing on price and have room to decrease. Dedicated GPU pricing follows hardware cycles; B200 availability in late 2026 should bring H100 prices down further.

Key questions:

- Has the vendor raised prices in the last 12 months? (OpenAI doubled GPT-5.5 rates on April 23, 2026.)
- What's the vendor's gross margin? (Fireworks estimated ~50% per Sacra research, targeting 60%.)
- Does the vendor have structural cost advantages (custom kernels, speculative decoding, cache pooling) that protect margins without raising prices?

**Verification method**: check pricing page history via Wayback Machine. Read earnings calls or funding announcements for margin signals. Vendors with structural cost advantages — custom speculative decoding (Together ATLAS, Fireworks FireOptimizer), KV cache pooling (LMCache integration), custom kernels (TKC, FireAttention) — can maintain pricing as GPU commodity markets tighten. Vendors relying on GPU arbitrage alone will face margin pressure and may raise prices or reduce service quality.

### Where the framework picks against my employer

A worked example. On the same DeepSeek V3.1 model at May 2026 pricing, Fireworks runs about 33% cheaper than Together on input + output combined ($0.56/$1.68 vs $0.60/$1.70 per million; [source: Fireworks pricing](https://fireworks.ai/pricing)). On DeepSeek R1 Basic, Fireworks is roughly 75% cheaper than Together's serverless rate ([source: Fireworks pricing](https://fireworks.ai/pricing)). On Llama 70B, Together and Fireworks are within ~2% of each other ($0.88 vs $0.90 flat), essentially tied. The model + provider combination dominates the LCPR; the provider alone does not.

If your workload runs on DeepSeek R1 or DeepSeek V3.1 at high volume and you're shopping for the lowest per-token cost on that specific model, the LCPR math picks Fireworks. If your workload runs on Llama, the pricing is close to a coin-flip and the decision comes down to other gates: latency under load, fine-tuning options, fallback availability, ATLAS vs FireOptimizer's fit to your output-length distribution. I work at Together; I would still recommend running the calculation against the live pricing for the specific model you've selected. The framework's job is to pick the cheapest model + provider combination for your workload's quality gate, not to validate a prior preference for any one provider's catalog.

### Using the scorecard

For each vendor under consideration, score each gate as Pass, Conditional Pass (acceptable with mitigation), or Fail. A Fail should eliminate the vendor unless you have a clear compensating control. Failing Gate 4 (reliability) can be mitigated with multi-vendor failover; failing Gate 5 (compliance) for regulated workloads generally cannot. Two or more Conditional Passes should trigger deeper evaluation before committing.

The scorecard is deliberately binary — pass/fail, not scored 1-10 — because weighted scoring encourages teams to rationalize a preferred vendor by assigning high weights to gates where it excels. "Fail" means "fail for this workload without mitigation," not "never use this vendor."

### Negotiating pricing tiers

Once you've selected vendors via the scorecard, negotiate pricing in tiers rather than asking for a blanket discount:

- **Under $25K/month**: don't negotiate. Use public pricing. The vendor's sales team won't prioritize you, and the discount (if any) won't exceed 5-10%.
- **$25K-$100K/month**: request a committed-use discount. Most providers offer 15-30% off for 3-6 month commitments. Get it in writing with clear terms on what happens if you under-commit.
- **$100K-$500K/month**: negotiate custom pricing with a named account manager. At this level, you have leverage; the vendor's cost to serve you is low relative to revenue. Push for volume tiers with automatic step-downs, not flat discounts. Ensure the contract includes price protection (the vendor can't raise your rates mid-contract) and a 30-day out clause if they deprecate your model.
- **$500K+/month**: negotiate capacity commitments with SLAs. At this level, you're a strategic account. Push for dedicated capacity guarantees, custom model hosting, priority support, and co-development of optimizations. The vendor should be assigning engineering resources to your account.

The key principle: never negotiate price alone. Negotiate price + SLA + capacity guarantees + contract flexibility as a package. A 20% discount with no SLA is worth less than a 10% discount with P99 latency guarantees and a 90-day out clause.

![Vendor Selection decision tree]({static}/images/inference-field-guide/vendor_selection.svg)

---

## Part 5: The staged playbook

This final section synthesizes Parts 1-4 into concrete, staged guidance. Each stage has an entry threshold, a set of actions, and an exit threshold that tells you when to graduate to the next stage.

**A note on thresholds.** Every dollar figure and percentage in this playbook ($10K/month, $100K/month, 40% utilization, 500ms P95) is a *configurable default*, not a law. These values reflect typical economics for 70B-class models at May 2026 pricing. They shift with model size (smaller models have lower break-evens), provider pricing changes, your team's engineering efficiency, and your workload's I/O ratio. Use the LCPR calculator to compute your thresholds, not these defaults. When this essay says "$10K/month," read it as "the volume where your LCPR calculator shows migration savings exceeding amortized engineering cost."

### Stage 0: Prototype (under $10,000/month)

**Entry**: you're building an AI-powered product and spending less than $10,000 per month on inference.

**Architecture**: single closed API (OpenAI, Anthropic, or Gemini). No gateway. No fallback. No dedicated GPU.

**Actions**:

1. Pick one provider. Anthropic if you need reasoning quality and prompt caching (90% reduction on cached input tokens). OpenAI if you need the broadest ecosystem. Gemini if you need the cheapest frontier option ($1.25/$10 for ≤200K context).
2. Use prompt caching aggressively. Anthropic's caching reduces cached input cost to 10% of base. OpenAI's automatic caching triggers on prompts ≥1,024 tokens at 50% discount.
3. Don't optimize for inference cost. At $4,116/month on GPT-5.5 for 200K requests, the savings from switching to open-weights ($2,987/month) don't justify the engineering distraction of migration. Ship the product.
4. Use prompt caching to stretch your closed-API budget further. A Sonnet workload with 4,800 input tokens (4,000-token system prompt + 800 user input) and 600 output tokens at 500K requests/month costs $12,901/month without caching. With Anthropic's 83% cache hit rate (the system prompt is cacheable), LCPR drops 43% to $7,361/month, a $5,540 savings with zero migration effort. Even cached Sonnet at $0.0155 LCPR is still 1.7x Together's uncached $0.0091, but the gap narrows enough that migration ROI becomes marginal at this volume.

**Exit threshold**: monthly inference spend exceeds $10,000 (approximately 500K requests/month on GPT-5.5 at 800/400 tokens, the point where multi-source migration ROI exceeds $7.5K/month per the Part 1 worked example), OR you experience a provider outage that costs revenue, OR a customer asks about data residency. The $10K figure is a guideline; teams with tight margins or latency-sensitive workloads may justify Stage 1 earlier.

### Stage 1: Scale ($10,000-$100,000/month)

**Entry**: you've passed the Volume Gate from Part 1.

**Architecture**: primary closed API + AI gateway + one or two serverless open-weights providers for specific workloads.

**Actions**:

1. Add an AI gateway (LiteLLM in dev, Helicone or Portkey in prod).
2. Add a fallback provider for your primary closed-API model (Anthropic via Bedrock, Gemini via Vertex).
3. Move long-tail, quality-insensitive workloads to serverless open-weights: batch processing, summarization, classification, embeddings. Together, Fireworks, or DeepInfra on Llama 3.3 70B, DeepSeek V3, or Qwen 3. For offline batch workloads (embeddings, evaluation harnesses, bulk summarization), consider spot-priced dedicated GPUs (RunPod spot, Lambda spot) at 40-70% discount. Batch workloads tolerate interruption and higher latency.
4. Implement prompt caching everywhere it helps. On closed APIs, this means Anthropic's explicit caching (90% discount) or OpenAI's automatic caching (50% discount). On serverless open-weights, Together's always-on prefix caching gives ~90% reduction on cached input tokens with no configuration. Structure prompts with static content first, variable content last.
5. Start measuring LCPR, not just token cost. The difference matters at this scale.

**Worked example**: a team at 2M requests/month on GPT-5.5 spends $33,960/month. Splitting 70/30 (keeping 1.4M quality-sensitive requests on GPT-5.5 and moving 600K long-tail requests to a serverless open-weights provider: Together at $0.60/$1.70, Fireworks at $0.56/$1.68 on DeepSeek V3.1, DeepInfra on GPT-OSS-120B, Anyscale or Replicate on Llama; pick by workload and current pricing) brings the combined bill to about $25,500. Roughly $8,400/month in savings, or $100K/year, with minimal engineering effort.

**Exit threshold**: any single workload exceeds ~50M output tokens/day with steady traffic, OR you need a fine-tuned model, OR you have a hard latency SLO under 500ms that shared APIs can't meet.

### Stage 2: Production at Scale ($100,000-$1,000,000/month)

**Entry**: you've passed the Specialization Gate or hit the dedicated GPU crossover.

**Architecture**: multi-source with one or two dedicated GPU deployments for highest-volume workloads, serverless for everything else.

**Actions**:

1. Move your 1-2 highest-volume workloads to dedicated inference. Pick the vendor by workload fit:
    - **Baseten** if you need TensorRT-LLM + observability tooling (Abridge, OpenEvidence, Writer customer references).
    - **Fireworks** if you have agentic coding workloads, RL post-training, or need FireOptimizer's adaptive speculative decoding (Cursor, Vercel v0 customer references).
    - **Modal** or **Replicate** for managed dedicated serving with strong developer-experience surface (cold-start tradeoffs and pricing differ from the larger inference providers; verify against your latency budget).
    - **Together** if you need ATLAS adaptive speculative decoding (2.65x measured on DeepSeek-V3.1, [source: Together AI blog](https://www.together.ai/blog/adaptive-learning-speculator-system-atlas)), unified fine-tuning + inference on the same hardware, or B200 capacity sooner than other providers can offer it (Cresta Multi-LoRA, Decagon voice AI customer references; [source: Together AI + Decagon case study](https://www.together.ai/customers/decagon)).
2. Run vLLM or SGLang. Use FP8 quantization (8-bit floating point, which halves memory versus the standard BF16 16-bit format) for 70B-class models. Quality holds within 1% of BF16 on most benchmarks.
3. Run NVIDIA Dynamo if multi-node.
4. Buy compliance certifications (SOC 2, HIPAA BAA) from your dedicated vendor.
5. Monitor GPU utilization weekly. The 40% threshold approximates the break-even between dedicated and serverless for 70B-class models: at Lambda's $3.99/hr and serverless rates of $0.90-$1.70/M tokens, you need roughly 10-11 hours/day of saturated throughput (43-44% daily utilization) to justify dedicated. Below that, serverless is cheaper. Consolidate via Multi-LoRA if you have multiple low-volume workloads that can share a GPU.

**Worked example**: at 10M requests/month, GPT-5.5 costs $166,600/month. Together serverless costs $13,748. A Lambda H100 at 40% utilization costs $10,418 for that same workload. This excludes egress costs. Lambda charges zero egress, but if you're routing outputs through a hyperscaler's load balancer or CDN, add $0.05-$0.09/GB. At higher utilization, the dedicated cost drops further. The dedicated option wins at this volume if (a) utilization stays above 40%, and (b) egress costs don't negate the savings. Serverless remains the safer default.

**Exit threshold**: total monthly spend exceeds $1M, OR you have a strategic reason to control kernels and models end-to-end.

### Stage 3: Build-Side ($1,000,000+/month)

**Entry**: you've hit a scale where the operational investment in custom infrastructure is justified by the savings.

**Architecture**: dedicated inference on neo-cloud (Lambda, CoreWeave, Nebius) with vLLM/SGLang + custom optimizations. Serverless overflow path for traffic spikes.

**Actions**:

1. Hire 2-4 dedicated inference engineers, plus SRE support for on-call, alerting, and capacity planning. This is not optional; you cannot run dedicated inference at $1M+/month without specialized expertise. The inference team owns runtime optimization, quantization, KV cache tuning, and failure recovery. SREs own runbooks and operational tooling.

   Alternatively, managed dedicated endpoints offer comparable cost economics without the operational burden. Several vendors offer customer-engineering-as-service models on reserved GPU capacity: Together (forward-deployed engineering on Decagon's voice AI deployment [source: [Together AI + Decagon case study](https://www.together.ai/customers/decagon)], Cresta's Multi-LoRA work), Fireworks (FireOptimizer tuning on Cursor's Fast Apply), Baseten (TensorRT-LLM tuning on Abridge's healthcare deployment). The model is similar across vendors: dedicated engineers from the provider iterate on your deployment (custom speculators, quantization pipelines, kernel-level tuning) on reserved capacity you contract for.

   The trade-off is the same regardless of vendor: you cede runtime control. If your models and workloads are stable enough that you don't need to tune kernels yourself, managed dedicated is often the right call. If you need to iterate on custom attention patterns or exotic quantization schemes, you need the in-house team.

2. Adopt LMCache or Mooncake for KV cache pooling if your traffic has high prefix overlap (shared system prompts, RAG context, multi-turn chat). KV cache pooling deduplicates shared prefixes across requests; workloads with >70% prefix overlap see the largest gains. LMCache reports 3-10x TTFT improvement and up to ~14x throughput on multi-turn workloads ([LMCache benchmarks, 2025-2026](https://github.com/LMCache/LMCache)). Mooncake powers Kimi K2's production traffic at 100B+ tokens daily.
3. Evaluate FP4 quantization on Blackwell with proper calibration. NVIDIA's analysis shows 1% or less accuracy degradation on key tasks. FP4 on B200 doubles throughput versus FP8.
4. Maintain a serverless overflow path. Dedicated deployments should have this. Traffic spikes happen, GPUs fail (Meta's Llama 3 training saw 466 job interruptions over 54 days, 78% hardware-related), and autoscaling dedicated GPU is measured in minutes, not milliseconds.
5. Don't try to be Character.AI. They serve 1B+ queries/day on custom int8 kernels and quantization-aware training, a 33x cost reduction since 2022 ([source: Character.AI Kaiju engineering post](https://blog.character.ai/inside-kaiju-building-conversational-models-at-scale/)). That's the build-side end-state. Your scale is probably not their scale.

### The revert signals

Every stage transition should be monitored for revert signals, indicators that you've graduated too early.

- **Stage 1 → Stage 0**: If your multi-source overhead (gateway maintenance, prompt migration testing, vendor management) exceeds 20% of your inference savings, simplify back to a single provider.
- **Stage 2 → Stage 1**: If your dedicated GPU utilization stays below 40% for two consecutive months, move that workload back to serverless. At 40% utilization on a Lambda H100 ($3.99/hr), your effective cost per output token exceeds serverless rates ($0.90-$1.70/M). You're paying $2,873/month in fixed GPU cost for throughput you could get cheaper on-demand.
- **Stage 3 → Stage 2**: If your inference engineering team spends more than 50% of their time on operational issues (GPU failures, OOM errors, kernel debugging) rather than optimization, you don't have the operational maturity for build-side infrastructure yet.

These revert signals are as important as the exit thresholds. The right architecture is the simplest one that meets your cost and performance requirements. A team that owns 8 H100s at 28% utilization is paying 1.4x what serverless would cost, and paying it twice (once for the GPU bill, once for the engineering payroll).

### Red-flag triggers

Beyond revert signals, certain events should trigger an immediate review of your inference setup regardless of which stage you're in:

- **Invoice variance > 10%** from your LCPR model prediction. Something changed: metering, traffic mix, or pricing.
- **Retry rate increase** of 5+ percentage points over a 2-week window. Usually indicates a model degradation, prompt regression, or provider-side issue.
- **Cache hit rate drop** of 10+ percentage points. Prompt structure may have changed, or the provider changed cache eviction behavior.
- **Quality gate regression**: pass rate drops 5+ points. Could be a model version change, prompt drift, or eval suite staleness.
- **P99 latency breach** sustained over 4+ hours. Investigate queue depth, batch size, and provider capacity.
- **Fallback share exceeds 20%**. Your primary provider is unstable; consider promoting the fallback or adding a third option.
- **Provider model version change** (e.g., GPT-5.5 → GPT-5.5-turbo). Re-run your eval suite before assuming quality parity.
- **Provider pricing page update**. Re-run the LCPR calculator and update your cost projections.
- **Traffic mix shift**: one workload grows 3x while others are flat. Blended LCPR no longer represents individual workload economics. Segment and re-evaluate.

The common thread: any change to LCPR inputs should trigger a re-evaluation of LCPR outputs. The calculator is cheap to run; surprises on your invoice are not.

### Workload reference cards

Each inference workload type has a characteristic bottleneck, failure mode, and set of calculator defaults. Use these as starting points, not gospel; your production numbers will differ.

**Chat (customer-facing).**

- Bottleneck: decode latency (streaming TTFT and inter-token latency)
- Key metric: P95 time-to-first-token
- Common failure: latency spikes under concurrency causing user abandonment
- Calculator defaults: 500-1000 input, 200-500 output, 3-5% retry, 95% quality gate
- Where defaults break: multi-turn conversations with long history (input tokens grow per turn), peak-hour traffic patterns (retry rate spikes)

**RAG extraction.**

- Bottleneck: prefill (long retrieved context)
- Key metric: cost per extracted answer, measured by LCPR with cache hit rate
- Common failure: irrelevant retrieved chunks inflating input tokens without improving output quality
- Calculator defaults: 2000-8000 input, 200-600 output, 5% retry, 90% quality gate, 20-40% cache hit rate
- Where defaults break: cache hit rate depends entirely on prompt structure. Static system prompt + variable retrieved context yields 30-60% hit rate, but fully variable prompts yield <5%

**Code generation.**

- Bottleneck: decode (long output)
- Key metric: LCPR per accepted suggestion (quality gate includes human acceptance, not just schema validation)
- Common failure: high output token count with low acceptance rate. You're paying for code the developer immediately deletes
- Calculator defaults: 500-2000 input, 500-2000 output, 3% retry, 70-85% quality gate
- Where defaults break: quality gate varies enormously by task (autocomplete at 60% vs multi-file generation at 40%)

**Agent workflows.**

- Bottleneck: cumulative latency across chained calls
- Key metric: end-to-end workflow success rate and total LCPR per workflow (sum of per-call LCPR × calls per workflow)
- Common failure: retry cascades, where one failed call triggers retries that propagate through the chain
- Calculator defaults: 1000-4000 input per call, 200-500 output per call, 5-10% retry per call, 90% quality gate per call, 3-8 calls per workflow
- Where defaults break: tool-use failures compound. A 5% per-call failure rate across 6 calls gives a 26% workflow failure rate

**Batch / embeddings.**

- Bottleneck: throughput (total tokens per hour)
- Key metric: cost per million tokens processed, not latency
- Common failure: underusing batch pricing tiers. Many providers offer 50% batch discounts but teams don't restructure pipelines to qualify
- Calculator defaults: variable input, minimal output (embeddings) or moderate (summarization), 1% retry, 98% quality gate, 50-100% batch eligible fraction
- Where defaults break: batch APIs have higher latency (minutes to hours) and may have different rate limits

### Diagnostic trees

When LCPR or latency degrades, use these decision trees to isolate the root cause before committing engineering effort. Each follows the pattern: **symptom → metric to check → likely bottleneck → experiment → stop condition**.

**P99 latency spikes under concurrency.**
Symptom: P99 latency doubles during peak hours while P50 stays stable.
Check: queue wait time (TTFT minus expected prefill time). If queue wait > 500ms → provider capacity constraint. Experiment: add a second provider for peak overflow. If queue wait is normal → check batch size (are requests batching larger during peaks, increasing per-request decode time?). Experiment: cap max batch size or route overflow to a dedicated endpoint. Stop: when P99/P50 ratio < 2x during peak.

**Cache hit rate lower than expected.**
Symptom: cache hit rate is <10% when you expected 30-50%.
Check: prompt structure. Are variable elements (user query, retrieved documents) placed before static elements (system prompt, instructions)? If yes → restructure: static content first, variable content last. If prompt structure is correct → check tokenization: are you using the provider's tokenizer? Token boundaries differ between providers, and a one-token difference in the cached prefix invalidates the cache. Experiment: log the exact token count of the cached prefix per request and check for variance. Stop: when cache hit rate matches the fraction of requests with identical prefixes.

**LCPR worse after migration.**
Symptom: you migrated from Provider A to Provider B and LCPR increased despite lower token rates.
Check: quality gate pass rate on Provider B. If lower → model quality gap. Your prompts were tuned for Provider A's model; Provider B's model fails differently. Experiment: run your eval suite on Provider B and identify the failing categories. Tune prompts or adjust quality gates. If quality gate is similar → check retry rate on Provider B. Different error codes, different rate limits, different timeout behavior can increase retries. Check: engineering hours. Migration overhead (dual-stack maintenance, prompt migration, monitoring setup) may not have been captured. Stop: when LCPR on Provider B is within 10% of pre-migration LCPR on Provider A, with quality gate within 2 points.

---

## Resources

- **[LCPR Calculator](https://inference-econ.streamlit.app)** ([run locally](https://github.com/Sohailm25/inference-field-guide#running-locally)) — Run the math against your own workload. Same engine that generated every number in this essay.
- **[GitHub repository](https://github.com/Sohailm25/inference-field-guide)** — Source code, provider pricing YAML (refreshed via reconciliation tests in CI), diagrams, and 248 tests pinning the calculator's numerical claims.
- **[Templates](https://github.com/Sohailm25/inference-field-guide/tree/main/templates)** — Vendor scorecard, migration readiness checklist, LCPR worksheet.

---

## Closing

The frameworks in this guide (LCPR plus five decision rules) are tools for making decisions with math instead of vibes. They're opinionated, because frameworks that try to accommodate every edge case end up accommodating none.

The companion [LCPR calculator](https://inference-econ.streamlit.app) lets you run these calculations against your actual workload. Every number in this essay was generated by that calculator and verified against May 2026 public pricing. The pricing YAML in the repo updates on commit; re-run when your contract numbers diverge from the published ones, which they usually do.

If you take one thing from this essay, take the four-line LCPR formula and the assumption-confidence table earlier in Part 0. The frameworks are scaffolding; the math is the load-bearing part.

---

*This essay is the overview. The Production Inference Economics series develops the measurement methodology in depth:*

1. [The Denominator Problem]({filename}/denominator-problem.md)
2. [Trace Autopsy]({filename}/trace-autopsy.md)
3. [LCPR Calculator]({filename}/lcpr-calculator-v2.md)
4. [Workload Costs]({filename}/workload-costs.md)
5. [Goodput]({filename}/goodput.md)

*Sohail Mohammad --- April 2026*

*Numbers are anonymized and should not be attributed to any specific employer, customer, or deployment.*
