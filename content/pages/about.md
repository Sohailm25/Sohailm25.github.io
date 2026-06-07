Title: About
Slug: about
Summary: Sohail Mohammad is a forward deployed engineer at Together AI working on inference optimization, post-training, and production AI systems.

![with maha]({static}/images/maha-sohail.jpg)

I'm Sohail Mohammad, a forward deployed engineer at Together AI. I work with enterprise customers on inference optimization, post-training, and production AI systems where cost, latency, reliability, and quality all interact.

Before Together, I built AI and ML systems across large enterprise environments: agent platforms for 1.5M+ employees at Amazon, a JPMorgan Chase RAG system that grew from 0 to 10k+ users, GenAI drive-thru systems at Wendy's, GPU infrastructure at Jack Henry, and ML systems at Capgemini.

My writing focuses on the parts of AI deployment that pricing pages and benchmarks miss: retries, evals, quality gates, routing, cache behavior, human escalation, and loaded cost per accepted result.

I also publish research notes and negative results around post-training, activation steering, interpretability, and model behavior. I've contributed to Unsloth, mlx-lm, and RLHF-related tooling.

I love my wife. I love the gym. I love our cats.

[github](https://github.com/sohailm25) · [linkedin](https://linkedin.com/in/sohail-mo) · [x](https://x.com/Sohailm25)

sohailmo.ai@gmail.com

## where i sit on inference

most of what's written about inference cost is wrong in a specific way: it compares token prices instead of loaded cost per request. the gap between advertised cost and true production cost — retries, schema failures, quality gates, engineering overhead — is where most teams lose money without realizing it.

i think the open-weights cost advantage over closed apis is structural, not temporary. but "just switch to open models" is bad advice without a framework. volume, specialization requirements, and ownership constraints each independently justify (or block) migration. most teams skip straight to dedicated gpu when serverless is the right default for 90% of workloads.

on post-training: fine-tuning is underused because the feedback loop is slow and evaluation is hard. teams default to prompt engineering past the point of diminishing returns. the unlock is tighter eval → faster iteration → models that actually fit the task.

i wrote a longer version of this: [the honest field guide to production inference](/inference-field-guide/). there's also an [interactive lcpr calculator](https://inference-econ.streamlit.app/) if you want to run the math on your own workloads.
