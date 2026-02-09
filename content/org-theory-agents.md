Title: What Three Jobs Taught Me About Agent Orchestration
Date: 2026-02-09 06:30
Category: Notes & Projects
Slug: org-theory-agents
Summary: Org theory applies to agent swarms. I've lived three different org structures—here's how they map to multi-agent patterns.

![Ethan Mollick tweet on org theory for agentic AI](/images/mollick-org-theory-tweet.png)

[Ethan Mollick's post](https://x.com/emollick/status/2020303173362012667) about applying org theory to agent swarms got me thinking. i enjoyed reading it, and it sparked this writeup. Spans of control, boundary objects, and coupling are the highlights.

i've worked under three very different org structures in the past few years. And watching the multi-agent discourse unfold, i keep seeing patterns i've already lived through. Not necessarily with agents, but with humans.

---

## The Integrated Model

At a QSR company, i was the MLOps architect embedded directly in the data science team. No separate infrastructure org. Just me, in the standups, watching the work happen.

This meant i didn't need boundary objects. i didn't need someone else's summary of what was going well or what was broken. i could observe firsthand, form my own conclusions, apply my own judgment and taste.

The upside: direct signal. No telephone game. i could see when a model was struggling before anyone filed a ticket. i could spot infrastructure bottlenecks by watching the team work around them.

The downside: scope creep. i was always available. Always in the room. Always getting pulled into ad hoc issues because "you're right here, can you just look at this?" Boundary setting became crucial but difficult, because helping was technically my job.

i stayed sane by staying in interviewer mode. Instead of injecting my own opinions constantly, i spent time gathering perspectives from the data scientists. Asking questions. Letting them surface their own pain points. It kept me from becoming the bottleneck i was supposed to prevent.

**The agent equivalent:** an agent with direct data access is powerful. It can form its own conclusions from raw signal. But it needs structured interaction patterns, or it becomes the thing that handles everything and eventually chokes. The agent that sees everything can get pulled into everything.

---

## The Over-Coupled Model

At a large financial institution, the structure was the opposite. Red tape everywhere. Multiple layers of approval for everything. Security reviews and risk assessments.

The frustrating part: even when i had context, even when i knew what the right call was, i often couldn't act. Personal intuition had no value. The coupling was so tight that judgment got squeezed out.

This wasn't safety. It was friction. The organization had optimized for control at the expense of velocity and responsiveness. Scrum going well was more important than the actual work.

**The agent equivalent:** if your critic can veto but can't exercise judgment about *when* to veto, you've built friction and not reliability. The [Team of Rivals paper](https://arxiv.org/abs/2601.14351) talks about hierarchical veto authority. But veto authority only works if the critic has enough context and autonomy to make real decisions.

---

## The Balanced Model

At my current role, i've found a better mix. There's oversight. There are approval processes. But there's also enough autonomy to scout information myself.

The key difference: a writing culture. Six-pagers, two-pagers, LLDs, HLDs. Documentation isn't busywork here. Writing is thinking. It forces deep thought about deliverables and contact points. The boundary objects exist, but they're backed by business and customer agendas.

This creates boundary objects that actually help. They share context without obscuring it. They provide structure without strangling judgment.

**The agent equivalent:** pre-declared acceptance criteria (what the Team of Rivals paper calls their key innovation) are basically six-pagers for agents. Structured handoffs that force the agent to think about what success looks like before execution starts. Not vague "make this good" prompts. Explicit conditions defined upfront.

---

## My Approach Now

When i'm building agent pipelines, i find myself reaching for a few principles:

**Exhaustive logging, true to raw output.** i want the actual signal, not someone else's interpretation of the signal. No bias injection through summarization layers unless it's explicitly needed for review or critic models.

**Strong prompts for format, not for judgment.** Format is mechanical. Judgment should come from the agent reasoning about the actual problem. Mixing them leads to prompts that are trying to do too much.

**Shallow agent hierarchies.** i don't go super deep in agent levels for specific projects. The Team of Rivals paper describes 50+ agents with hierarchical veto. That works for their use case (arbitrary queries against complex data). For more bounded problems, shallow hierarchies with clear boundaries work better.

**Upfront boundary work.** Git worktrees and a screen full of Codex terminals is a valid approach. But it only works when you've spent time outlining the boundaries of projects and intra-project features beforehand. The hierarchy can be shallow because the boundaries are tight.

---

## The Tradeoff

Mollick's org theory concepts are right. But the implementation depends on a tradeoff most people don't make explicit:

**Deep agent hierarchies compensate for loose boundaries.** If you don't know exactly what you're asking for, you need more layers of validation, refinement, and critique to catch errors.

**Shallow hierarchies require tight boundaries upfront.** If you define the scope clearly before execution, you don't need as many layers of oversight.

The Team of Rivals paper builds elaborate internal structure because they're handling arbitrary queries. i can stay shallow because i define the boundaries externally.

Neither approach is wrong. But knowing which model you're building matters.

i think the lesson generalizes: agent orchestration patterns aren't new. We've been figuring out coordination at scale with humans for decades. The constraints are different (agents are cheaper, faster, more parallel) but the organizational dynamics are surprisingly familiar.

The question isn't "what's the best agent architecture." It's "what coordination pattern does your problem actually need."
