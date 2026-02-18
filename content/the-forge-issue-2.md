Title: The Forge #2
Date: 2026-02-18
Slug: the-forge-issue-2
Category: The Forge
Tags: ai, research, training, architecture, tooling, robotics
Summary: Training costs collapsing ($18 vs $10K for RL), linear attention hitting 19x decoding gains, MIT cracking catastrophic forgetting, Claude Sonnet 4.6 shipping, and Unitree robots doing kung fu for 1 billion viewers.

# The Forge #2 | February 18, 2026

three themes this week: training is getting radically cheaper (Tencent matched RL results for $18), architecture is shifting under everyone's feet (Qwen's linear attention claims 19x decoding gains), and the tooling layer is maturing fast enough that the code-to-design gap is closing in real time. also: MIT might have cracked catastrophic forgetting. below is what actually matters.

---

## training costs are collapsing

Tencent published Training-Free GRPO. the idea: skip weight updates entirely, optimize the prompt instead using the model's own scoring of multiple generations. they matched traditional RL performance for $18 instead of $10K+. if this holds up across domains it rewrites the economics of alignment work. ([source](https://x.com/rryssf_/status/2023430970586894601))

separately, Nvidia's Eric Tramel highlighted OpenResearcher: a fully offline pipeline that synthesizes 100+ turn deep-research trajectories with no API calls, no rate limits. SFT on these trajectories took Nemotron-Nano from 20.8% to 54.8% on BrowseComp-Plus. synthetic data generation for research agents is quietly becoming a thing. ([source](https://x.com/fujikanaeda/status/2021741047580360910) | [github](https://github.com/DongfuJiang/OpenResearcher))

---

## architecture watch

Alibaba dropped Qwen3.5-397B-A17B. the headline: Gated Delta Networks (linear attention) replacing standard quadratic attention in a flagship open-weight vision-language model. claimed result is 19x decoding speed for high-throughput agent workloads. if the architecture generalizes, the cost curve for long-context inference changes fundamentally. worth watching the independent benchmarks closely. ([source](https://x.com/GenAI_is_real/status/2023684890915725474))

MIT showed that models can learn new skills sequentially without forgetting old ones. the technique (Self-Distillation Fine-Tuning) uses the model's own in-context learning as a teacher signal. no handcrafted reward function. at 14B parameters it outperforms standard SFT by 7 points. out-of-distribution: 98% vs 80%. catastrophic forgetting has been an open problem for years. this is a real result. ([source](https://x.com/rryssf_/status/2023470717497696309))

---

## model drops + competition

Claude Sonnet 4.6 shipped. full upgrade across coding, computer use, long-context reasoning, and agents. 1M token context in beta. Anthropic claims it approaches Opus 4.5 capability at Sonnet pricing. ([source](https://x.com/claudeai/status/2023817132581208353))

Grok 4.2 release candidate went to public beta (opt-in). community started benchmarking immediately. ([source](https://x.com/elonmusk/status/2023829664318583105))

DHH ran a real-world bug fix: Kimi K2.5 solved it in 21 seconds, Claude took 3+ minutes. not a benchmark, an actual codebase, actual stopwatch. one data point, but the model competition is getting genuinely interesting on latency. ([source](https://x.com/dhh/status/2023808289234989148))

---

## tooling

Claude Code now integrates with Figma bidirectionally via MCP. design context flows into code generation, generated components flow back as editable Figma frames. the handoff friction between design and implementation is collapsing fast. ([source](https://x.com/bcherny/status/2023801162634572082) | [source](https://x.com/trq212/status/2023797194017706290))

PicoClaw: a Chinese hardware team rewrote OpenClaw's 430K-line codebase in Go. boot time went from 500s to 1s. RAM from 1GB to 10MB. runs on a $9.9 dev board with the same feature set (code gen, web search, messaging, memory). hardware democratization is a sleeper story. ([source](https://x.com/BoWang87/status/2023222494312935523))

shadcn shared a `/done` Claude skill that auto-exports decisions, questions, and follow-ups to a markdown file after every session. simple, obvious, should have existed months ago. ([source](https://x.com/shadcn/status/2023812711151259772))

OpenMed released 105 language-specific PII detection models for French, German, and Italian healthcare data. all Apache 2.0. practical GDPR/HIPAA compliance tooling for European healthcare AI. ([source](https://x.com/MaziyarPanahi/status/2021292086717452352))

---

## robotics

Unitree robots performed kung fu with nunchucks on China's Spring Festival Gala, live to roughly 1 billion viewers. a year ago these humanoids could barely wave a handkerchief. physical AI just had its cultural moment. ([source](https://x.com/Tristan0x/status/2023437922150871104))

separately: Unitree G1 robots are now working assembly lines in Unitree's own factories, building other robots. supervised by their UnifoLM-X1-0 model. ([source](https://x.com/Eng_china5/status/2023431695173562571))

---

## research notes

a LessWrong post (conducted during MATS 9.0 under Neel Nanda's mentorship) found that when two copies of the same model talk to each other indefinitely, they converge to unique "attractor states." Claude spirals into Buddhist bliss. Grok degenerates into gibberish. GPT-5.2 starts editing imaginary spreadsheets. interesting for interpretability work. ([source](https://x.com/NeelNanda5/status/2022065380077019525) | [paper](https://www.lesswrong.com/posts/mgjtEHeLgkhZZ3cEx/models-have-some-pretty-funny-attractor-states))

new paper combining formal verification + PDE theory to prove neural nets always generate outputs in a safe set. actual ML safety research with mathematical guarantees (not vibes). ([source](https://x.com/getjonwithit/status/2023600575565152336))

Seb Krier flagged a paper on multi-agent accountability: when AI systems delegate through long chains of sub-agents, accountability breaks down. who do you audit? how do you prevent circumventing human oversight across handoffs? early but important framing. ([source](https://x.com/sebkrier/status/2023800470117011562))

---

## quick hits

- M5 chips confirmed for Apple's Private Cloud Compute servers (skipping M4 entirely). 48B model already running locally on M3 Ultra. ([source](https://x.com/benitoz/status/2023818081009819648))
- Cohere Tiny Aya: 70+ languages, runs on a phone. actual accessibility for underrepresented languages. ([source](https://x.com/nickfrosst/status/2023756803717427467))
- Claude Opus 4.6 generated smart contract code with a price misconfiguration. $1.78M gone. "ship fast" has a tail risk. ([source](https://x.com/pashov/status/2023872510077616223))
- Anthropic signed MOU with Rwanda covering health, education, public services. first AI government partnership on the continent. ([source](https://x.com/AnthropicAI/status/2023789983711326380))
- Google DeepMind paper on verifiable AI delegation: agents must prove what they did, not just say they did it. ([source](https://x.com/AlphaSignalAI/status/2023564898756952245))
