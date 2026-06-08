Title: Inference Flexibility Starts in the API
Date: 2026-06-08
Category: Writings
Slug: inference-flexibility-starts-in-the-api
Summary: A response to Mario Souto's clay jar essay: energy orchestration only works if inference systems expose workload class, latency tolerance, and value per accepted result.
Template: longform_article


*I work at Together AI. Technical details have been generalized from production experience; no proprietary information from any organization is disclosed.*

![Diagram showing how workload metadata turns queued tokens into scheduling decisions](/images/inference-flexibility-queue-label.png)

*The scheduler cannot act on "queued tokens" alone. It needs labels that describe who is waiting, what can move, and when the work loses value.*

Mario Souto's [The Clay Jar and the Data Center](https://mariohsouto.github.io/essays/the-clay-jar-and-the-data-center.html) gets the framing right: AI energy is not only a procurement problem. The missing layer is not only where the electrons come from. It is which inference work should consume them now, which work can wait, and which work should not run at all.
{: .has-dropcap}

I agree with the energy claim. Inference has more temporal flexibility than the current data center conversation admits. A chat response, a nightly eval run, a document extraction job, a coding agent, and a voice assistant do not have the same latency constraint. Treating them as one flat demand curve is expensive.

But temporal flexibility is not schedulable by itself. The scheduler needs to know which work can wait, which work can move, and which work loses value when delayed. That information does not live in GPU utilization. It has to enter through the API.

Energy orchestration cannot infer product intent from token counts. A scheduler can see queue depth, prompt length, prefix cache hits, model ID, current capacity, and regional load. It still does not know whether a request is a human waiting on a support answer, a batch extraction job due tomorrow morning, or an agent step inside a task that has already burned through its budget.

That distinction is not cosmetic metadata. It changes the route.

## The scheduler cannot optimize what the API hides

Many inference APIs expose the wrong contract for this problem. They accept a request and return a response. Some expose streaming. Some expose a batch endpoint. Some have priority tiers. But the default unit is still the single request.

That is too small.

The unit that matters economically is the accepted work unit: a resolved ticket, an extracted document, a completed agent task, a grounded answer, a voice turn that stays inside the audio latency budget. The request is an implementation detail.

Two requests can look identical at the serving layer: same model, same prompt length, same expected output length, same region. One is a human waiting on a support escalation. The other is a document extraction job due before tomorrow's reconciliation run. The first should get warm capacity, prefill priority, and low TTFT. The second should be queued, batched, and moved if the data constraints allow it.

Token count alone cannot separate them.

This is where Mario's energy argument connects directly to inference economics. If the orchestration layer is choosing when and where to run a workload, it needs to know more than tokens per second. It needs to know the denominator.

For a support chatbot, the denominator may be cost per accepted resolution. For document extraction, cost per valid extracted record. For a coding agent, cost per accepted task. For evals, cost per decision that changes something downstream.

Without that denominator, the scheduler can only optimize cheapness in the narrowest sense. It can delay work, route to a cheaper region, or fill idle capacity. It cannot decide whether the delay was worth it.

## Flexibility is a product property

Batch APIs are a revealed price for latency tolerance. OpenAI's Batch API documentation describes "50% lower costs" with a 24 hour completion window, and Anthropic's Message Batches documentation describes batches that cost "50% less" than standard API calls and process within 24 hours.[^batch]

But batch only captures one point on the curve: complete within hours. Many production inference workloads sit between interactive and overnight.

A customer support draft might need to finish immediately if an agent is waiting, but could be precomputed before the workday starts. A coding agent might need interactive latency while the user is watching, then become batch eligible once the user closes the laptop. A document extraction job might have no per-request SLO, but still need the full file set complete before a morning reconciliation run.

The wall-clock number matters less than who is blocked by the work.

If a human is waiting, latency is product quality. If another machine is waiting, latency is workflow throughput. If nobody is waiting yet, latency is inventory management. Those are different economic objects.

Flexibility is also stateful. The same task can move between classes. A coding agent is interactive while the user is watching and background work after the user leaves. A support draft is urgent when an agent is blocked and cheap inventory when it is precomputed before a shift.

The API should expose that difference.

## Workload class belongs in the control plane

I would make workload class a first-class part of the inference contract.

Not a dashboard tag. Not a billing label that gets attached after the fact. A field the scheduler can act on.

The numbers below are illustrative. The shape matters more than the specific values.

```yaml
workload_class: human_waiting_streaming
latency_budget_ms:
  ttft: 800
  p95_total: 5000
unit_of_value: accepted_resolution
max_cost_per_unit_usd: 0.04
flexibility:
  can_delay_until: null
  can_migrate_regions: false
  can_use_batch: false
quality_floor:
  evaluator: support_policy_grounded
  action_on_fail: repair_or_escalate
```

A batch extraction job would look different:

```yaml
workload_class: batch_extraction
latency_budget_ms: null
unit_of_value: valid_extracted_document
max_cost_per_unit_usd: 0.01
flexibility:
  can_delay_until: "2026-06-08T12:00:00Z"
  can_migrate_regions: true
  can_use_batch: true
quality_floor:
  validator: schema_and_field_match
```

A coding agent needs another shape because the task is a loop:

```yaml
workload_class: agentic_task
unit_of_value: accepted_task
max_cost_per_unit_usd: 2.50
flexibility:
  interactive_until_idle_seconds: 300
  can_delay_background_steps: true
  can_migrate_regions: true
controls:
  max_llm_calls: 80
  escalate_on_budget_exhaustion: true
```

The schema can change. What matters is that the scheduler receives a product-level contract. If the control plane only receives undifferentiated requests, it will treat all demand as equally urgent until a human hard-codes exceptions.

Some fields should not be trusted as user input. Latency class can be declared by the product, but measured by traces. Acceptance rate has to come from the quality gate. Cost per accepted unit has to reconcile against billing. Region mobility has to pass data residency, egress, and cache-locality checks.

The scheduler should treat missing metadata as debt, not as permission to use premium capacity.

That is how you end up with expensive GPUs doing cheap work at the wrong time.

## The clay jar needs labels

Mario's clay jar metaphor works because storage decouples production from consumption. Grain can be harvested today and eaten later. Energy can be generated now and used later. Inference can be queued now and computed when capacity is cheaper.

But storage only works if the operator knows what is stored.

Seed grain, wet grain, tax grain, and dinner grain are not interchangeable. The jar creates optionality. The label determines whether using that optionality is useful or destructive.

Inference has the same shape. The queue is the jar. Workload metadata is the label.

A scheduler that sees "a large queue of tokens" knows almost nothing. A scheduler that sees "batch documents due before morning reconciliation, background agent steps with no human waiting, real-time voice turns, and support escalations inside a declared p95 SLO" can make economic decisions.

That second system can coordinate with energy. The first one can only throttle.

## Energy routing changes serving architecture

Once workload class becomes part of the contract, routing stops being only "which GPU has room?"

Human-waiting traffic needs cache-local, warm capacity. The scheduler should protect TTFT and inter-token latency before it chases lower power cost. A cross-region route that saves cents but adds visible delay can be a product regression. This traffic wants stable fallback, prefill priority, and enough reserved capacity that burst handling does not turn into queueing.

Batch extraction wants the opposite shape. It can accept longer queueing, wider batching, lower prefill priority, and cheaper regions if data residency and egress cost do not erase the savings. Retry tolerance matters here too. A failed extraction batch can run again. A failed voice turn cannot be retried without the user hearing the failure.

Agentic workloads need phase changes. While the user is watching, the loop is interactive. After idle timeout, the remaining tool calls, retries, evals, and summarization steps become background work with a task budget and a deadline. Moving background steps only works if tool state, file access, and cache locality move with them, or if the savings exceed the cost of rebuilding context.

Evals should be treated like internal manufacturing work. If an eval job is consuming peak interactive capacity, it should be tied to a release gate, routing decision, model selection, or safety check. Otherwise it belongs in the off-peak queue.

This is not just "serve inference." It is closer to operating a plant where every job has a routing sheet.

## The hard part is trust

The operational objection is that product teams will lie to the scheduler. Everything becomes high priority. Every team claims its workload is latency sensitive. Every batch job gets marked urgent because somebody does not want to debug delayed completion.

That will happen unless the contract is tied to measurement.

If a workload declares a p95 SLO, measure it. If it declares a cost budget, enforce it. If it declares an accepted-result denominator, audit the acceptance metric. If it declares that it cannot be delayed, make the owner pay the premium for inflexibility.

A practical design is quota-backed classes: each workload gets an owner, default class, measured SLO, budget, and allowed burst premium. If a team marks background evals as interactive, the traces should show no human wait event and the finance report should charge the premium back to that owner.

The discipline has to look more like cloud quotas than best-effort tagging. Teams do not get to label traffic however they want forever. The labels need owners, budgets, and post-hoc accountability.

This is why I do not think the orchestration layer can be only an energy product. It has to be an inference product, a platform product, and a finance product at the same time. The hard integration is not the battery API. It is getting the organization to state what each workload is worth.

## The missing middle term

Mario's closing formulation is: electrons in, orchestration, tokens out.

I would add one more constraint inside orchestration: workload intent.

Electrons in, workload intent, orchestration, accepted work out.

Tokens are intermediate inventory. Some tokens resolve a customer issue. Some tokens grade an eval. Some tokens are burned by an agent loop that has already exhausted its budget. Some tokens are cheap because the work can wait for off-peak capacity.

The energy layer matters, but cheaper electrons are not enough. Cost per useful output improves when demand is expressed in a form the scheduler can act on: deadline, mobility, latency budget, quality gate, and accepted unit.

The system will know which work can wait, which work can move, which work deserves premium capacity, and which work should not run at all.

That is the piece I would put next to the clay jar. The jar stores surplus. The label tells you whether opening it is the right move.

[^batch]: OpenAI, [Batch API](https://platform.openai.com/docs/guides/batch); Anthropic, [Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing).