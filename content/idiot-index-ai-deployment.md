Title: The Idiot Index for AI Deployment
Date: 2026-05-11 12:00
Author: Sohail Mohammad
Category: Essays
Slug: idiot-index-ai-deployment
Summary: The gap between what a model is supposed to do and what it actually does in production is enormous. Forward-deployed engineering exists to close it. Here's why i left Amazon for inference.
Featured: true

---

Speculative decoding doesn't work at batch 12.

Not "doesn't work well." 0.92x. Slower. i implemented it at Wendy's. We were running open-source models behind 100K+ daily drive-thru interactions, 400-600ms inference budget, and under production concurrency, we were paying 8% more compute with it enabled than without. The papers promise 2-3x decode speedup. The papers are measuring single-request latency on clean benchmarks. At batch 12-16, different sequences accept different numbers of draft tokens. You get ragged tensors. The alignment overhead eats the theoretical gain. Add the KV cache management cost of a draft model that's never seen "Baconator" in its training data, and you're underwater.

i spent two weeks on this before i killed it. Tried three draft model configurations. Fine-tuned a 1B speculator on 10K drive-thru transcripts - acceptance rate went from 48% to 58%, still below breakeven. Tried n-gram speculation. 42%. The math is unforgiving: at α=0.55, γ=5, you get 1.94 expected tokens per step for 1.15x the cost. Net negative.

The reason this matters isn't speculative decoding. It's the gap it represents.

---

## The idiot index for AI deployment

There's a concept i keep coming back to from Elon Musk's early SpaceX days. He couldn't afford rockets, so he calculated the raw material cost for carbon fiber, metal, fuel, etc and compared it to what the aerospace industry charged for a finished product. The ratio was absurd. 50x. He called it the "idiot index": the cost of the finished product divided by the cost of its component materials. If the ratio is high, somewhere in the chain between raw material and finished product, a massive amount of unnecessary complexity, bureaucracy, or tradition has been layered on top.

AI deployment has its own idiot index. The ratio between what a model is supposed to do and what it actually does in production is enormous and mostly invisible. A model scores well on benchmarks, passes evals, demo looks great. Then it hits real traffic at scale and latency blows up, costs are 10x the budget, or quality degrades in ways nobody can explain because nobody profiled the workload distribution they're actually serving.

Nicholas Carlini has this line i've been thinking about. He says you can't predict what will or won't work ahead of time, so you have to prototype fast and let reality tell you what's true. That's science versus engineering. You can do everything right on paper and the idea still doesn't survive contact with production. The physics of a turbopump looks one way in simulation and behaves differently when it's bolted to a combustion chamber at full throttle.

Inference is the same. Batch size, sequence length distribution, quantization, KV cache pressure, hardware generation, concurrent request patterns. All of these interact in ways that single-request benchmarks don't capture. Every enterprise i've been embedded in has hit this wall. The MIT stat that 95% of AI implementations fail isn't surprising if you've watched it happen from inside the system, repeatedly, across multiple companies. The demo works. Production doesn't. The gap between intended behavior and actual behavior is the idiot index. And it's high.

The industry's response has been to create a new kind of role. FDE postings are up 800% in two years. Palantir's had forward-deployed engineers for over a decade. Now Anthropic, Databricks, OpenAI (this morning) and a growing number of AI infrastructure companies are building these teams. The signal is clear: the last mile to production isn't solved by better documentation or a solutions engineer on a Zoom call. It requires someone embedded in the customer's environment who understands both the kernel and the customer.

---

## What i kept doing under different titles

i should be specific about what this role actually is, because most people confuse it with adjacent work.

The closest analog is a solutions architect, and SAs do serious technical work. But the motion is different. An SA is typically pre-sales: design the system, prove the architecture fits, help close the deal. An FDE picks up after the deal closes, when the real workload shows up and the architecture meets production. A solutions engineer configures the product to fit the use case. Professional services is staffing. A developer advocate teaches in public. All of these are real, technical work.

The difference with an FDE is where you sit and how deep you go. A forward-deployed engineer requires 300-400 level depth in the underlying technology. Not "i can call the API" but "i understand why PagedAttention allocates KV cache in non-contiguous blocks and when that memory fragmentation becomes a performance problem under long-context workloads." You're embedded with a customer for weeks or months. You're writing production code in their environment, brought in for the problems that are too nuanced or too deep for a standard engagement. You're discovering things about the platform that the product team hasn't seen because they don't have your specific workload conditions.

i didn't set out to build this skill set. i fell into a pattern across four different environments over five years. Consulting, embedded banking infrastructure, production AI at scale, fractional CTO work. The pattern was always the same cycle: figure out the real problem (not the stated problem), design a solution that accounts for their actual constraints (not the idealized ones), build it in their stack, then document it so you can leave and it survives without you.

Discovery → Architecture → Build → Document. i didn't have a name for this until i saw the FDE role description. It was just... what the work required.

i should caveat: a lot of this is me hyper-indexing on what the FDE role looks like from the outside. i haven't done it yet at an AI-native infrastructure company. The engagements i've run were under different titles, at different kinds of organizations. i'm genuinely curious what it looks like when the product you're deploying is the inference stack itself — when the thing you're embedded to optimize is the same thing you understand at the kernel level. That's the part i'm excited to explore.

---

## What i got wrong (and what that taught me)

i've written detailed case studies about most of this: the Ray production disasters, the RAG infrastructure scaling, the vLLM deployment work, so i won't retell the full stories here. But the pattern across all of them is the same, and it's the pattern that matters.

At JPMorgan, i spent three days debugging 10x slower distributed training. GPU profiling looked clean. NCCL configuration looked correct. Every tool pointed at the GPU/model layer. The actual root cause was Deep Packet Inspection on the ML subnet aka JPMorgan's security infrastructure adding 5-15ms to every inter-node packet. For a single API call, invisible. For thousands of allreduce operations per second, catastrophic. The problem was in the infrastructure *between* GPUs, not the GPUs themselves. Took 6 weeks of security reviews to get an exemption on an internal ML subnet. No NCCL tuning in the world would have fixed a network security problem.

At Wendy's, i built a 47-panel Grafana dashboard for a three-engine inference router. The single most useful metric turned out to be `kv_cache_usage_percent`. Not GPU utilization, that sat at 95% perpetually and told us nothing. KV cache at 80% was the real autoscaling trigger. That single discovery prevented three potential outages. Nobody told me this. No documentation covers it. You learn it at 2am wondering why latency spiked when traffic didn't change.

At JPMorgan again (directly this time), a RAG application serving 15,000 users hit 8-second response times at scale. 60% of the latency was in framework orchestration abstractions, not inference, not retrieval. Surgical replacement of the hot path dropped it to 3 seconds. i didn't rewrite the system. i measured, found the bottleneck, replaced only what mattered.

Three different environments. Three different "wrong layers." Every time, the real problem was invisible from outside the production environment. That's the point. These discoveries only happen when you're embedded, with their specific workload, their specific security constraints, their specific scale. You can't do this work from the outside.

---

## What actually changed

My father passed away in early 2026.

i've written about this before, so i won't repeat the full weight of it here. But grief rearranges your priorities in a way that doesn't un-rearrange. The question of where to spend your finite time stops being abstract when you watch someone run out of it. i stopped optimizing for compensation and titles and started optimizing for a single question: where can i make the most impact with whatever time i have?

i wrote an essay a few months ago about sampling at the frontier. Exploring multiple interests in parallel, noticing which ones pull your attention back involuntarily. The hype projects feel like positioning. The genuine interest projects feel like you can't stop thinking about them. i've been running that experiment for two years across consulting, production inference, open-source kernel work, mechanistic interpretability research, agentic systems. And the signal was always the same thing: inference. The gap between what a model can do and what it actually does under production constraints. That gap is what i can't stop thinking about.

Amazon taught me real things. Operating at 1.5M user scale. On-call rotations that burn operational rigor into your nervous system. How large organizations make decisions. What i want next doesn't live there. The kernel-to-customer arc. Where you go from understanding why FlashAttention's tiling strategy matters for your memory budget, all the way through to a customer's production system working correctly because of that understanding. That work requires being embedded, being close to the workload, being in the room when things break.

i'm also making a bet about where the center of gravity in AI engineering is moving. Training frontier models is increasingly concentrated: hundreds of millions of dollars, thousands of GPUs. But inference is where every company actually lives. Every application, every API call, every user interaction hits an inference stack. The hard problems like batching under heterogeneous workloads, speculative decoding that actually works at scale (see: paragraph one), quantization that doesn't degrade quality on domain-specific content, multi-LoRA serving, KV cache optimization. These are unsolved at each companies specific production scale. The people working on them are building the infrastructure the entire industry runs on.

---

## The intersection

The people who will define the next phase of AI infrastructure aren't pure researchers (who don't see production constraints) and aren't pure application engineers (who don't understand the kernel). The work lives at the intersection. Deep enough to write a Triton kernel, practiced enough to know when that kernel will fail under concurrent load, embedded enough in customer environments to understand what the workload actually looks like.

i've spent five years building this intersection by accident. Consulting. Embedded engineering. Open-source kernel contributions. Production inference at scale. The FDE role is the first title i've seen that describes the job that fits what i've been doing.

i'm starting at Together AI in June.

i don't know exactly what i'll build there yet. But i know what the work is: close the gap between intended and actual behavior, one embedded engagement at a time, one production discovery at a time, one system that finally works under real load at a time. Make the idiot index smaller.

i want to be in a room where the things i don't yet know how to do are the things being done at the highest level. Where my ideas get sharpened by people who have context i haven't earned yet. Where the standard is set by the work itself.

That's why i left.
