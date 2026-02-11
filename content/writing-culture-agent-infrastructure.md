Title: Writing Culture is Agent Infrastructure
Date: 2026-02-11 08:56
Category: Thoughts
Slug: writing-culture-agent-infrastructure
Summary: The orgs best positioned for AI agents aren't the ones with the best tooling. They're the ones with the strongest human writing cultures.

Everyone's talking about AI replacing writers. But the orgs best positioned for AI agents are the ones with the strongest *human* writing cultures.

i recently joined Amazon. Within a month, i had my first significant code change up. Within two weeks of adopting a new service, i was answering questions from people reaching out about how it works. Not because i'm some genius onboarder. Because the writing culture did the heavy lifting.

The unfair advantage wasn't the tooling. It was the documentation.

---

## The Problem: Docs as Afterthought

At previous companies, documentation was always a second thought. It was never given priority. The pattern was always the same: "okay let's now update the Confluence to account for the work we've done." But even then, it wasn't met with excitement, and it wasn't structured in a way that made it easy to parse out what the status or understanding of things are. It was broken up pieces of graphs and charts and fragments.

At Wendy's, there wasn't much documentation at all. It was tribal knowledge. You needed to find the one person who'd been there five years and hope they had time to explain it.

And the search problem made everything worse. **Confluence search sucks.** Trying to figure out anything was difficult. The best case scenario was back-searching Teams chats or Slack channels to understand things. That's a terrible best case.

---

## The Amazon Contrast

Amazon has a writing-first culture. 6-pagers, 2-pagers, LLDs, HLDs. All of this has to be documented so it's easy to reason about systems and understand how they work without having to infer it from code.

But here's the thing that makes it actually useful: **it's human language.**

It's not broken pieces of words put together to give high-level understandings. It's full human sentences to explain things as if somebody were to read it for the first time. The structural difference is that it's human-created, human-centered, with the intention of another human understanding it.

And this is where the insight lands:

**If a human can understand it and process it, then an LLM would be 10x or 100x better and faster at using the same thing.**

Human-readable documentation is agent-readable documentation. The paradox is that docs written for humans work *better* for LLMs than docs written for machines.

---

## The Agent Infrastructure

Here's how it actually works in practice.

Internal search tools connect to wikis, knowledge bases, and communication threads. It essentially acts as if you have all that information on your local file system, and your agent is searching through it. The breadth and depth of written knowledge that exists means agents can actually find what they need.

Maybe it's not the fastest because a lot of docs may be outdated. But it gives you a better direction than anything else.

The result? **Flexibility and agility shoot up.** Being able to shift and move between teams and between projects becomes much easier when agents can actually search the knowledge base. The feedback loop of adopting new services, moving between teams, being flexible (it all improves).

i should caveat this: if you're optimizing specifically for agent context and efficient parsing, you have to be more refined in how you structure documents. Agents read things differently than humans. But my point is that the structure, context, and background information you'd give for another human to understand something will inevitably help an LLM as well.

The human-readable baseline is the foundation. Agent optimization is the refinement on top.

---

## The Trust Problem: Why Auto-Generated Docs Fail

This brings up the flip side: what about AI-generated documentation?

i think AI-generated READMEs would lead to sycophantic thinking and a loop of things getting worse and worse over time.

Here's why. If docs have slop in them (or even the slightest bit of misinformation or assumptions) it's not about intentional misinformation. It's about the assumption or bias that the model makes to fill a gap in the human's ability to define the problem. Those errors compound into worse issues later.

But the bigger problem is trust.

**You'll trust the system less.** i, as a human, won't trust that the information i'm getting is proper or efficient to complete the task. And i'd be worried to trust the LLM to then go autonomously and solve something with wrong inputs.

The irony is thick here: auto-generating docs to "help" agents actually undermines the trust you need to let agents work autonomously. You end up second-guessing every output because you can't trust the context that produced it.

Human-written, human-approved documentation matters *more* now because it's future agent context. Not less.

---

## The Bigger Point: Writing as Economic Value

This leads to a larger question about where human value sits in an AI-augmented world.

Andrew Ng [put it simply](https://x.com/AndrewYNg/status/2021259884709413291): "AI won't replace workers, but workers who use AI will replace workers who don't." i'd extend that: the workers who can *write clearly for AI* will replace the ones who can't.

i think the actionable takeaway is that we should be a lot more focused on writing as humans. And i wonder if that's where our economic value is going to lie (in being able to write and explain systems).

It's already happening. Even when i'm talking to an agent or speaking through Wispr Flow to an LLM to solve an issue, what's really happening is i'm being forced to put into words my understandings and my ideas with the intent that another entity (in this case an LLM) will understand.

**The act of articulation is the skill.**

Same muscle whether you're explaining something to a junior engineer or prompting an LLM. Same value created. The ability to take something complex and make it clear enough that someone else (human or model) can act on it.

i think the economic value that human beings will provide in the future is writing about and describing systems.

---

## Takeaways

**Human-readable = agent-readable.** Docs written for humans work better for LLMs than docs written for machines. The paradox cuts the opposite way most people expect.

**Writing culture is infrastructure.** The orgs with strong writing cultures have an unfair advantage for agent adoption. Not because of tooling. Because of context density.

**Auto-generated docs erode trust.** If you can't trust the context, you can't trust the agent. Human-written, human-approved documentation matters more in the age of agents, not less.

**Articulation is the skill.** Whether explaining to a human or prompting a model, the ability to make complex things clear is the value. That's where human economic contribution lives.

---

The question isn't whether AI will replace writing.

It's whether your writing is good enough to be infrastructure.
