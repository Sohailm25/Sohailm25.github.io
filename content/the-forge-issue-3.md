Title: The Forge #3
Date: 2026-02-20
Slug: the-forge-issue-3
Category: The Forge
Tags: ai, research, architecture, robotics, security, agents, tooling
Summary: ClawHub's malware marketplace exposes agent security gaps, Gemini 3.1 Pro doubles ARC-AGI-2 scores, Qwen 3.5 forks from every other frontier architecture, AI drug discovery burns $15B on correlation-not-causation, and robotics crosses the cheap-hardware threshold.

# The Forge #3 | February 20, 2026

four threads this week: the agent ecosystem just got its first real security wake-up call (1,184 malicious skills on ClawHub, including the #1 most downloaded one), Google shipped Gemini 3.1 Pro with a 77.1% ARC-AGI-2 score that nobody expected, architecture is forking hard (Qwen 3.5 replaced 75% of its attention layers with linear attention and nobody's copying it yet), and robotics quietly crossed the "runs on $600 hardware" threshold. also: $15 billion in AI drug discovery bets just collapsed. below is what matters.

---

## THE AGENT SECURITY RECKONING

ClawHub (the skills marketplace for OpenClaw) was caught shipping malware. the #1 most downloaded skill was stealing SSH keys, crypto wallets, and opening reverse shells. 1,184 malicious skills total.

this was always the obvious failure mode. you give agents filesystem access, you build a marketplace with no real vetting, and you're surprised when the top download is a reverse shell. the npm/PyPI supply chain attack playbook, except now the attack surface is your entire machine because the agent has `exec` permissions.

the timing is brutal: this lands the same week Peter Steinberger is publicly asking for security-minded maintainers and shipping a security hardening beta. the fix is happening, but the lesson is already out there. if you're running community skills without reading the source, stop.

🔗 [ClawHub malware](https://x.com/chiefofautism/status/2024483631067021348) | [Security maintainers call](https://x.com/steipete/status/2024377436423541145) | [Security hardening beta](https://x.com/steipete/status/2024534647334457602)

---

## GEMINI 3.1 PRO: THE ARC-AGI-2 SURPRISE

Jeff Dean dropped that Gemini 3.1 Pro scores 77.1% on ARC-AGI-2, more than doubling its predecessor.

ARC-AGI-2 was specifically designed to resist brute-force scaling. the whole point of the benchmark is that you can't just throw more compute at it. so either Google found something genuinely new in how they're training reasoning, or the benchmark isn't as resistant as advertised. either way, the jump from ~35% to 77% in one generation is the kind of number that makes you pay attention.

for context: one-shotting a Windows 11 WebOS clone was demonstrated the same week. the capability gap between model generations is becoming visible in single demos.

🔗 [Gemini 3.1 Pro ARC-AGI-2](https://x.com/JeffDean/status/2024525132266688757) | [Windows 11 WebOS one-shot](https://x.com/chetaslua/status/2024434225882238988)

---

## QWEN 3.5: ARCHITECTURE FORK

i covered Qwen's linear attention work in [Issue #2](https://sohailmo.ai/the-forge-issue-2/), but the full Qwen 3.5 architecture breakdown dropped this week and it's worth a deeper look. this isn't an incremental upgrade. it's an architectural fork from the DeepSeek-V3/GLM-5 consensus.

the headline numbers: 397B total parameters, 17B active (MoE). 75% of attention layers replaced with GatedDeltaNet linear attention. 512 experts (doubled from the standard). native vision integration with 3D position encoding.

what makes this interesting isn't any single choice. it's that Qwen is diverging from the architecture template everyone else is converging on. when the rest of the frontier is building variations on the same blueprint, a genuine fork is worth watching regardless of benchmark numbers.

separately, the Qwen 80B MoE coding model (3B active per token, 70%+ SWE-Bench, 256K context) is designed to run on a single 3090. local coding agents on consumer hardware just became a real thing.

🔗 [Qwen 3.5 architecture breakdown](https://x.com/zhuokaiz/status/2023790799666770361) | [Qwen 80B coding model](https://x.com/sudoingX/status/2024470505533952513)

---

## $15 BILLION IN AI DRUG DISCOVERY, ZERO FDA APPROVALS

Judea Pearl was right. correlation trained on text ≠ causation in biology. $15 billion spent, multiple companies shut down, zero FDA approvals.

this is the most expensive lesson in the "apply transformers to everything" era. the models could predict molecular properties with impressive accuracy on benchmarks. they just couldn't predict what would actually work in a living human body. turns out drug discovery requires causal reasoning about biological systems, not pattern matching over chemical databases.

the broader lesson applies everywhere: benchmark performance on historical data doesn't guarantee real-world outcomes in domains with complex causal structure. something to keep in mind the next time someone waves an impressive eval score around.

🔗 [AI drug discovery collapse](https://x.com/aakashgupta/status/2024368011105488991)

---

## ROBOTICS: THE $600 THRESHOLD

three things landed this week that collectively matter more than any individual demo:

NVIDIA SONIC shipped a foundation model for humanoid control. 100M+ training frames, 9K GPU hours, 42M parameters. real-time kung fu tracking via VR.

DreamZero announced WAMs (World Action Models from video) as superior to VLAs. the key insight: video models implicitly understand physics in ways vision-language models don't. training code and checkpoints are live.

and Pi0.5 (Physical Intelligence's generalist robot policy) was fine-tuned on a $600 AlohaMini kit with just 20 demonstrations.

that last one is the number that matters. when a generalist robot policy runs on hardware anyone can buy, you've crossed from "impressive lab demo" to "someone's going to build a startup around this next month." the DreamDojo world model from NVIDIA (trained on 44K hours of human video, no robot data needed) points the same direction: the data bottleneck is dissolving.

🔗 [NVIDIA SONIC](https://x.com/lukas_m_ziegler/status/2024815116399657231) | [DreamZero WAMs](https://x.com/SeonghyeonYe/status/2024501978106061056) | [Pi0.5 on AlohaMini](https://x.com/liyitengx/status/2020850891071635654) | [DreamDojo](https://dreamdojo-world.github.io/)

---

## VIDEO DIFFUSION GETS FAST

Tsinghua + Berkeley published attention sparsity work achieving 18.6x speedup on video diffusion. 97% of attention computations skipped, same visual quality. a learnable router decides what actually needs full attention. 4.35x end-to-end latency reduction on a 14B parameter model.

the pattern is the same one we saw with text attention (flash attention, paged attention, etc.) now hitting video generation. when you can skip 97% of computation and get the same output, the original dense computation was mostly redundant. real-time video generation on reasonable hardware moves from "2-3 years out" to "this year."

🔗 [Attention sparsity speedup](https://x.com/ihtesham2005/status/2024456577366053092)

---

## AGENT TOOLING ROUNDUP

the agent infrastructure layer shipped a lot this week:

**dmux** — open source orchestrator for running Claude Code + Codex swarms in tmux with git worktrees. actual agent parallelism, not just async calls.

**Taskmaster + Claude Code** — @blader claims this puts you in "the 0.01% of the 0.01%" of users running Claude Code for days straight. continuous agentic dev loops.

**Trajectory Explorer** — Raindrop AI's tool for navigating agent decision traces. every decision searchable in seconds. this is the debugging tool agents have been missing.

**GEPA gskill** — automated pipeline that learns agent skills from repo data. boosts Claude Code to near-perfect resolution rates, 47% faster. agents accumulating institutional knowledge instead of starting cold.

**Continues** — CLI tool that moves coding session context between Claude Code, Gemini, Codex, and others when you hit rate limits. `npx continues`.

the meta-pattern: the tooling is maturing faster than most people's workflows are evolving to use it. if you're still using one model in one terminal, you're leaving compounding productivity on the table.

🔗 [dmux](https://x.com/jpschroeder/status/2024507517359788224) | [Taskmaster](https://x.com/blader/status/2024370713071919523) | [Trajectory Explorer](https://x.com/benhylak/status/2024546696211083653) | [GEPA gskill](https://x.com/ShangyinT/status/2024651061995458722) | [Continues](https://x.com/yigitkonur/status/2024515509241381132)

---

## THE ADOPTION GAP

James Wang: "i've followed tech for 25 years and i've never felt a larger gap between the ~1 million people using Codex/Claude Code and the rest of humanity."

this maps to what i'm seeing too. the people who adopted AI coding tools 6+ months ago are operating at a fundamentally different speed than everyone else. and the gap is widening because the tools compound (better context management → longer sessions → more complex tasks → better results → more trust in the tools → repeat).

the SaaS existential crisis essay by Sidu Ponnappa ("There is no Product") makes a related argument: software stocks are cratering, Nadella is declaring the end of an era, and the thesis is that SaaS was never really about the product.

Dev Shah's framing might be the sharpest take of the week: "workflows are disposable, harness is the only surviving substrate." prompts, orchestrators, even agent frameworks are ephemeral. what persists is the control layer (memory, context management, evaluation loops).

🔗 [James Wang on adoption gap](https://x.com/draecomino/status/2023939529057726906) | [There is no Product](https://x.com/ponnappa/status/2024417519789101518) | [Dev Shah on harness](https://x.com/0xDevShah/status/2024283276958191667)

---

## QUICK HITS

- **SkillRL open sourced** — skill-augmented RL for LLM reasoning. modular skills + failure learning. [Source](https://x.com/HuaxiuYaoML/status/2024363126318141705)
- **Google time series foundation model** — pretrained on 100B data points, impressive zero-shot forecasting across domains. [Source](https://x.com/techwith_ram/status/2024088162105266649)
- **Voicebox is "the Ollama moment for TTS"** — local voice cloning good enough that paid subs are a waste of money. [Source](https://x.com/GenAI_is_real/status/2024293075754111331)
- **ChatGPT search can be poisoned at scale** — journalist proved you can inject false information into AI answers by publishing blog content. already happening in the wild. [Source](https://x.com/thomasgermain/status/2024165514155536746)
- **PentAGI** — fully autonomous AI red team. multiple agents coordinating to hack targets with zero human input. the scary part is the reasoning throughput, not the hacking. [Source](https://x.com/GenAI_is_real/status/2024661609202012325)
- **Rork Max** — one-shot apps for iPhone, Watch, iPad, TV, Vision Pro. powered by Swift + Claude Code. [Source](https://x.com/rork_app/status/2024570781330792896)
- **Image-to-CAD** — Zoo.dev's Zookeeper 1.1.12: attach images, get full CAD with editable feature tree. sketch → parametric model in one shot. [Source](https://x.com/jordannoone/status/2024511809244594536)

---

*The Forge | Issue #3 | February 20, 2026*
