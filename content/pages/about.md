Title: About
Slug: about

![with maha]({static}/images/maha-sohail.jpg)

i'm sohail. i'm a forward deployed engineer at together ai, working on inference optimization and post-training with enterprise customers.

before this i built agent platforms for 1.5m+ employees at amazon, a rag system at jpmorgan chase that went from 0 to 10k+ users, genai in the drive-thru at wendy's, gpu stuff at jack henry, and ml systems at capgemini.

i love my wife. i love the gym. i love our cats.

contributed to unsloth, mlx-lm, and some rlhf stuff.

[github](https://github.com/sohailm25) · [linkedin](https://linkedin.com/in/sohail-mo) · [x](https://x.com/Sohailm25)

sohailmo.ai@gmail.com

## where i sit on inference

most of what's written about inference cost is wrong in a specific way: it compares token prices instead of loaded cost per request. the gap between advertised cost and true production cost — retries, schema failures, quality gates, engineering overhead — is where most teams lose money without realizing it.

i think the open-weights cost advantage over closed apis is structural, not temporary. but "just switch to open models" is bad advice without a framework. volume, specialization requirements, and ownership constraints each independently justify (or block) migration. most teams skip straight to dedicated gpu when serverless is the right default for 90% of workloads.

on post-training: fine-tuning is underused because the feedback loop is slow and evaluation is hard. teams default to prompt engineering past the point of diminishing returns. the unlock is tighter eval → faster iteration → models that actually fit the task.

i wrote a longer version of this: [the honest field guide to production inference](/inference-field-guide/). there's also an [interactive lcpr calculator](https://inference-field-guide.streamlit.app/) if you want to run the math on your own workloads.
