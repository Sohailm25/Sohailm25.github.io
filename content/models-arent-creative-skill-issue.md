Title: "Models Aren't Creative" is a Skill Issue
Date: 2026-02-12 12:11
Category: Thoughts
Slug: models-arent-creative-skill-issue
Summary: The lack of creative output isn't a model problem. It's a skill issue. Yours, not the model's.

"LLMs can't be creative. They just regurgitate. No originality, no novelty, no surprising ideas."

i hear this constantly. And its so wrong.

The lack of creative output isn't a model problem. It's a skill issue. Yours, not the model's.

---

## The Real Problem: Your Map is Too Simple

When people ask a model for creative ideas and get generic slop back, the instinct is to blame the model. "It's just pattern matching." "It can't think outside the box."

But look at what they actually gave it:

- A one-shot prompt
- No files attached
- No specific context
- No planning done beforehand
- No research done prior

You're asking for creative ideas without giving it anything to be creative *with*.

**The real issue is that our map of the territory is too simplistic.** We assume we've given the model a detailed enough understanding of the domain, when really we've handed it a napkin sketch and asked for a masterpiece.

If you don't know enough about the landscape yourself (what's been tried, what failed, what exists, what the constraints are) then how can you expect the model to navigate it creatively?

---

## Constraints Enable Creativity

Here's the counterintuitive part: **"thinking outside the box" requires a well-defined box.**

Twitter's 280 character limit is a perfect example. That constraint forced people to condense knowledge into succinct chunks. It created a specific kind of creative output (threads, punchlines, dense insights) that wouldn't exist without the limitation.

Constraints are a forcing function. Without them, you get generic. With them, you get density.

Same applies to prompts. The more constraints you provide (requirements, prior art, what NOT to do, specific tradeoffs), the more creative the output becomes. You're not limiting the model. You're giving it edges to push against.

---

## The Two-Phase Process

When i want genuinely novel output, i don't just fire off a prompt. i run two phases:

**Phase 1: Research (Curiosity-Driven)**

This is exploration. Follow threads guided purely by curiosity. Build the map of the territory. No implementation pressure, just learning. 

The goal is to understand the domain deeply enough that you know what's been tried, what exists, what the open problems are.

**Phase 2: Implementation (Context-Loaded)**

Once i've sparked an idea that warrants deeper work, i attach that research as context for a new agent. First step is always a spec (GitHub's spec-kit is solid, or prometheus plans if you're using sisyphus).

The key is ensuring the plan is bulletproof. Use your own judgment to call out where assumptions are being made that you didn't explicitly set. The model will fill gaps with defaults. Your job is to make sure those gaps are intentional.

**The insight:** The research phase IS the creative work. The model is a synthesis engine, not an idea generator. You provide the raw material; it finds the patterns you couldn't see.

---

## What "Enough Context" Actually Means

When asking for creative or novel ideas, are you attaching:

1. **All previously attempted approaches** (and why they failed)
2. **Current landscape** (what exists, status, success metrics, customer feedback)
3. **For research** (every existing approach via deep research agents)
4. **Personal context** (your constraints, preferences, past decisions)

People assume the model has inherent knowledge up to today's date. But even if it was trained on information, that doesn't mean it surfaces for YOUR specific query. The knowledge is there. You have to bring it into context.

This is why one-shots fail. You're relying on the model to recall relevant information from its training. But recall is lossy. Context is precise.

---

## The Takeaway

Models can be creative. You just have to give them something to be creative with.

The bottleneck isn't model capability. It's your ability to define the problem space clearly enough that novel solutions can emerge.

**Constraints enable creativity.** They give the model edges to push against.

**Research enables novelty.** You can't find new paths without mapping the existing ones.

**Context enables relevance.** The model synthesizes what you give it.

Next time you get generic output, ask yourself: did i give it a detailed map, or a napkin sketch?
