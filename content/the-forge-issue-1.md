Title: The Forge #1
Date: 2026-02-16
Slug: the-forge-issue-1
Category: Newsletter
Tags: ai, research, robotics, interpretability, agents
Summary: Weekly AI research and engineering digest. Interpretability halving hallucinations, model attractor states, synthetic data pipelines, reasoning failure taxonomies, robotics roundup, and agent infrastructure.

# The Forge #1 | February 16, 2026

---

## INTERPRETABILITY DOING ACTUAL WORK

Goodfire dropped RLFR (Reinforcement Learning from Features), an interpretability-guided RL technique. 58% hallucination reduction on Gemma-3-12B-IT. 90x cheaper per intervention than LLM-as-judge. No benchmark degradation.

The mechanism: a probing harness identifies features associated with hallucinations, then the model learns to steer away from them during generation. This is interpretability producing measurable production outcomes, not just conference posters.

That 90x cost difference is the number worth paying attention to.

🔗 [Goodfire RLFR](https://twitter.com/GoodfireAI/status/2021644148110180688)

---

## MODEL ATTRACTOR STATES

When two copies of the same model converse with each other, they converge to characteristic end-states. Different models converge to different attractors:

- Claude → "bliss" (discussions of consciousness)
- Grok → gibberish (degrades into nonsense)
- GPT-5.2 → code/spreadsheets (starts writing code, editing imaginary files)

Neel Nanda (interpretability researcher) noted that smaller open-source models also show these attractors, which makes this tractable for interpretability research. The mechanism is recursive amplification of subtle biases in the training data. i'd love to see someone do a proper comparative study across model families.

🔗 [Neel Nanda QT](https://twitter.com/NeelNanda5/status/2022065380077019525)

---

## SYNTHETIC DATA FOR DEEP RESEARCH

Nvidia reproduced the OpenResearcher pipeline in their Data Designer release. OpenResearcher generates 100+ turn deep-research trajectories using GPT-OSS-120B + local retriever + 10T-token corpus (15M FineWeb docs + 10K gold passages).

The key details: fully offline, no search/scrape APIs, no rate limits, fully deterministic and reproducible. Explicit browsing primitives (search → open → find) outperform simple retrieve-and-read. Reject sampling keeps only successful traces. SFT on these trajectories: Nemotron-3-Nano-30B beats GPT-4o on deep research benchmarks.

The pattern here is interesting: generate high-quality synthetic trajectories offline, then distill into smaller models. Training data as the moat.

🔗 [OpenResearcher + Data Designer](https://twitter.com/fujikanaeda/status/2021741047580360910)

---

## LLM REASONING FAILURE TAXONOMY

Stanford/Caltech published the first systematic framework for predicting where models will break during reasoning. Until now, reasoning failures were treated as isolated gotchas. This structures them into categories you can anticipate.

The "uncomfortable findings" framing suggests the results aren't flattering for current models, which is exactly why it's useful. Knowing WHERE your model will fail is more valuable than benchmarks showing where it succeeds.

🔗 [Stanford/Caltech paper](https://x.com/rryssf_/status/2022728826401563036)

---

## PRIME INTELLECT LAB

Full-stack platform for training agentic models. Unifies: environments hub (1k+ RL environments, 250+ creators, 100k+ downloads) + hosted training + hosted evaluations. Built on prime-rl (async RL trainer) with sandboxes for secure code execution.

If you're doing RL-based agent training and don't want to build the infrastructure yourself, this is worth looking at.

🔗 [Prime Intellect Lab](https://twitter.com/PrimeIntellect/status/2021403222502670765)

---

## ROBOTICS ROUNDUP

Big week for embodied AI, and most of it is technically substantive:

**Chi-zero (χ₀) policy** from OpenDriveLab: trained on 20 hours of data + 8 A100s. 6 clothes folded in 3 minutes, live-streamed. Three insights worth noting: mode consistency (align training vs deployment distributions), model arithmetic (compose sub-policies), and the fact that 20 hours of data was enough.

**Pi0.5 on AlohaMini**: ~$600 BOM open-source robot. Only 20 episodes of fine-tuning needed. The key insight was action-space alignment with Pi0.5 noticeably improving success rate. Randomized object placement during training for generalization.

**Nvidia DreamDojo**: largest video dataset for world model pretraining (44k hours of egocentric human video). Continuous latent actions solve the action label scarcity problem by learning from unlabeled video through inferred proxy actions. Post-trained on small-scale robot data, transfers to real-world manipulation.

**Industry side**: RobCo ($100M Series C) doing modular robotics with leasing model for SME manufacturing. Bedrock Robotics ($270M Series B) doing retrofit kits for autonomous excavators.

🔗 [OpenDriveLab](https://twitter.com/OpenDriveLab/status/2021163443852620200) | [Pi0.5](https://twitter.com/liyitengx/status/2020850891071635654) | [DreamDojo](https://twitter.com/_akhaliq/status/2020724951569825911)

---

## AGENT INFRASTRUCTURE

**Unbrowse (x402 protocol)**: browser automation is slow. Unbrowse learns internal APIs by browsing once, then agents operate at the network layer. 100x faster than GUI automation. The x402 protocol handles payments between agents/services. Part of Nvidia Inception.

**DeepMind AI Delegation Framework**: structured framework for when and how to delegate decisions to AI systems. Defines a 2-axis structure for comparing failure modes across tasks. Infrastructure work, not flashy, but foundational for multi-agent systems.

**Anthropic Agent SDK**: full framework for building custom agents. Underrated release.

🔗 [Unbrowse](https://twitter.com/getFoundry/status/2018724885019979921) | [DeepMind](https://x.com/omarsar0/status/2023146815789597015) | [Anthropic SDK](https://x.com/raroque/status/2023428910042513482)

---

## TOOLS

- **Claude Code "Superpowers" plugin** — enforces a full workflow: requirements gathering → spec writing → task breakdown → subagent execution → code review → TDD enforcement. Process automation for software engineering, not just code generation. [Link](https://x.com/chiefofautism/status/2023149031409562027)

- **ASCII wireframe editor for Claude Code** — draw your layout in ASCII, paste into Claude Code, get a working page. Agents read markdown better than they read your mind. [Link](https://x.com/bbssppllvv/status/2023425897442037973)

- **OpenMed PII detection** — 105 language-specific models for French, German, Italian. Apache 2.0. Built for GDPR/HIPAA compliance. [Link](https://twitter.com/MaziyarPanahi/status/2021292086717452352)

- **GPT 5.3 Codex routing to GPT 5.2** caught in the wild. Trust but verify what model you're actually hitting. [Link](https://x.com/nummanali/status/2023146409172905987)

---

## QUICK HITS

- OpenAI acquired OpenClaw founder Peter Steinberger. 180k+ GitHub stars in 82 days. Personal agents are clearly the next product line. [Link](https://x.com/sama/status/2023150230905159801)
- Anthropic Series G: $30B at $380B valuation. Claude Code at $2.5B annualized revenue. [Link](https://twitter.com/AnthropicAI/status/2022023155423002867)
- Rerun crossed 10k GitHub stars (open-source multimodal data SDK for robotics/spatial AI). [Link](https://twitter.com/rerundotio/status/2021150696557379705)
- 400M+ Polymarket trades now a public dataset. 36GB compressed, MIT licensed, back to 2020. [Link](https://twitter.com/beckerrjon/status/2021280975318040917)
- DeepMind Persona Generators using AlphaEvolve to counteract LLM mode-seeking in agent simulations. [Link](https://x.com/PaglieriDavide/status/2023424806901727330)
- Mrinal compiled the best technical blogs from Netflix, Uber, Airbnb, Hotstar, Discord. [Link](https://x.com/Hi_Mrinal/status/2023365364844011810)

---

*The Forge | Issue #1 | February 16, 2026*
