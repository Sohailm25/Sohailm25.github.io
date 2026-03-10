Title: The Paradox of First Principles (And Why Nobody Wants to Hear That You're in Pursuit of Greatness)
Date: 2026-03-10 09:35
Author: Sohail Mohammad
Category: Essays
Slug: paradox-of-first-principles-pursuit-of-greatness
Summary: First-principles thinking matters, but reality and rapid experimentation are the only reliable validators for complex systems and ambitious work.

---

![The Paradox of First Principles](/images/paradox-of-first-principles-header.png)

There's a moment in Nicholas Carlini's essay "How to Win a Best Paper Award" where he describes his process for coming up with research ideas. Read everything, he says. Absorb the entire body of scientific literature in your field. Understand what's known, what's been tried, what failed and why.

Then forget all of it.

Not because it doesn't matter (it does, deeply) but because if you only think in terms of what's already been done, you'll never produce anything worth doing. The existing literature can poison your thinking. Once you've seen ten papers use Approach X, you implicitly assume Approach X is the right way, even when it isn't. Carlini describes watching an entire subfield of machine learning pursue membership inference attacks using overcomplicated neural network methods that made no sense to him. Instead of following along, he put the field out of his mind, developed his own approach from basic principles (treating membership inference as the hypothesis test it actually is) and wrote a paper that changed how everyone does it.

First principles thinking. Strip away the accumulated assumptions. Go back to what's fundamentally true. Build up from there.

Elon Musk would recognize the move instantly.

---

When Musk couldn't afford the Russians' $8 million asking price for a refurbished ICBM, he didn't negotiate harder or look for a cheaper seller. He sat down and calculated the cost of carbon fiber, metal, and fuel, the raw materials that actually go into a rocket. The gap between that number and what the aerospace industry was charging was absurd. Finished rockets cost at least 50x their raw materials. He called this ratio the "idiot index": the cost of a finished product divided by the cost of its component materials. If the ratio is high, you're an idiot. Or more precisely, somewhere in the chain between raw material and finished product, a massive amount of unnecessary complexity, bureaucracy, or tradition has been layered on top.

The idiot index became SpaceX's operating philosophy. Musk had a financial analyst named Lucas Hughes track the worst-performing components on the Raptor engine by this metric. When Hughes couldn't produce the list on the spot, Musk threatened to accept his resignation. Hughes came back with the 20 worst parts. Musk set a goal to reduce the Raptor's cost from $2 million to $200,000 (a 10x reduction) in one year.

The pattern is the same as Carlini's. Question every assumption. Delete every requirement you can. If you're not adding back at least 10% of what you deleted, you didn't delete enough. Both Musk and Carlini are describing the same cognitive discipline: the refusal to accept "this is how it's done" as justification for anything.

Most people who worship first principles thinking get the next part wrong.

---

## You Can't Think Your Way to Mars

First principles thinking is necessary. It is not sufficient.

Carlini is remarkably honest about this. After laying out all his advice on developing good taste, finding collaborators, reading the literature, and picking high-impact problems, he keeps returning to the same uncomfortable truth: most ideas die on contact with reality. You can do everything right (have the perfect insight, the perfect collaborator, the perfect timing) and the idea still doesn't work. He describes starting five times as many papers as he finishes, each one a good idea with real merit, where things simply didn't play out.

His advice is to prototype faster.

"Don't build the polished version of your experiment when a small prototype will tell you whether the core idea works," he writes. "If the prototype shows promise, clean it up later. If it doesn't, you've saved yourself months."

The paradox of first principles is that analysis alone cannot tell you what works. Complex systems (whether they're rocket engines, neural networks, or research programs) have emergent behaviors that only appear when the pieces are actually bolted together. The physics of a turbopump looks one way on paper and behaves differently when it's bolted to a combustion chamber running at full throttle in the specific thermal environment of a test stand in Boca Chica, Texas. How those physics interact with a specific environment has to be discovered, not derived.

Musk lives this paradox. SpaceX doesn't just theorize about rockets. It builds them, launches them, watches them explode, and iterates. The Starship program is the most public example of "fail fast" thinking ever attempted in aerospace. Every explosion is data. Every anomaly is signal. Musk uses reality as his primary validation tool because he understands that you cannot think your way to perfect solutions for problems you don't fully understand.

Carlini says the same thing, just in the language of academia: "You can't predict what will or won't work ahead of time (that's what separates science from engineering), so you have to get lucky that the idea you're trying will actually work."

Both are saying: invest in prototypes. Run the experiment. Let the universe tell you what's true.

Failures are data.

---

## The Idiot Index for AI Systems

I'm an AI Engineer at Amazon, and this framework (the tension between first principles reasoning and empirical reality) is the central challenge of my career.

The AI systems we're building today are high-idiot-index products. The gap between what a model is supposed to do and what it actually does is enormous and often invisible. A language model can score well on benchmarks, pass evaluations with flying colors, and still hallucinate confidently in production. It can appear aligned in testing and behave unpredictably when deployed at scale with real users making real requests that no evaluation suite anticipated.

You cannot think your way to understanding this gap. You cannot derive model behavior from architecture diagrams and training loss curves alone. The behavior of these systems is emergent. It arises from the interaction of billions of parameters with specific inputs in specific contexts, and it has to be observed, measured, and instrumented in the real world.

AI observability is the discipline of closing that gap. The idiot index applied to AI: if the ratio between intended behavior and actual behavior is high, something in the system needs to be stripped back to first principles and rebuilt.

I've spent the last several years working on this problem across different organizations: building RAG platforms that serve thousands of analysts, deploying LLM systems handling hundreds of thousands of daily calls, running mechanistic interpretability research to understand what's happening inside these models at the level of individual neurons and attention heads. And every single time, the same lesson shows up. The theory gets you oriented. Reality gets you to the answer.

My father passed away in early 2026. Grief rearranges you. The question of where to spend your finite time stops being abstract when you watch someone run out of it. I stopped optimizing for compensation and titles and started optimizing for the answer to a single question: where can I make the most impact with whatever time I have? That question, once it becomes real for you, doesn't let you settle. It doesn't let you optimize for comfort or prestige. It rearranges what you're willing to tolerate. We can die any time. I learned that not as a phrase but as a fact, and it made the decision about what to work on, and who to work with, non-negotiable.

My independent research reflects this exact tension. I've studied conversational collapse dynamics (how model outputs degrade over extended interactions in ways that don't show up in standard benchmarks). I've investigated activation steering and found inverse scaling effects that violate the predictions of the theory. I've built probes to test whether a specific model behavior was memorization or generation, using pre-registered thresholds and contrastive baselines. The kind of empirical rigor that Carlini describes as essential.

None of these findings came from reasoning about what should happen. They came from building the instrument, running the experiment, and letting the data speak.

---

## On the Pursuit of Greatness

At the SAG Awards in February 2025, Timothée Chalamet said something that most people in his position would never say out loud.

"I know we're in a subjective business, but the truth is, I'm really in pursuit of greatness. I know people don't usually talk like that, but I want to be one of the greats."

He named Daniel Day-Lewis, Marlon Brando, and Viola Davis in the same breath as Michael Jordan and Michael Phelps. He wasn't performing humility. He was stating, plainly and publicly, that he cares about being excellent at his craft and that everything else in his career is organized around that pursuit.

Some people found this inspiring. Others found it cringe.

I find this double standard fascinating. When Kobe Bryant talked about the Mamba Mentality (waking up at 3 AM, putting in work that nobody else was willing to put in, being openly obsessed with greatness) people built a cultural religion around it. When Michael Jordan was ruthlessly competitive and said he wanted to be the greatest ever, it became the defining narrative of sports documentary. When David Goggins talks about suffering as the path to self-mastery, millions of people share the clips. When Conor McGregor said "if you can see it here and you have the courage enough to speak it, it will happen," it became a manifesto.

But when an actor says it at an awards show, people shift uncomfortably. And when someone in a technical field says it (when an AI engineer says "I want to work at a frontier lab because I believe this is the most important work being done right now and I want to be excellent at it") the reaction ranges from awkward silence to outright dismissal. Like ambition is only acceptable in arenas with scoreboards.

Carlini, notably, doesn't hedge about this either. His entire essay is a guide to producing research that wins best paper awards. Research that matters, that changes fields, that is so much better than the average paper that it demands recognition. He quotes Hamming: "What's the most important problem in your field, and why aren't you working on it?" He says one excellent paper is worth a thousand mediocre ones. He writes about putting in "an unreasonable amount of effort" and choosing problems where you have a unique comparative advantage.

Pursuit of greatness, articulated in the language of a computer science researcher. Same frequency Chalamet is broadcasting on, same intensity Musk brings to every SpaceX launch.

The difference is just the domain. And whether your culture gives you permission to say it out loud.

---

## Everybody Is Stupid (Including You)

One of the threads running through all of this (Carlini, Musk, Chalamet) is the willingness to start from the assumption that the conventional approach is wrong.

Musk's entire career is built on this premise. The aerospace industry charged 50x raw material cost for rockets because that's how the industry worked. Nobody questioned it until someone sat down with a spreadsheet and the basic cost of carbon fiber. The auto industry assumed electric vehicles couldn't be mass-market because that's what the industry believed. The satellite internet industry assumed you needed massive geostationary satellites because that's what had always been built.

Carlini says the same thing about research: "Every field has bad ideas. Someone famous published an influential paper that got something critical wrong, and the rest of the field followed along without thinking critically."

The uncomfortable implication is that most of what most people are doing most of the time is, at minimum, suboptimal and quite possibly wrong. Musk has been quoted as saying "everybody is stupid." Not as an insult. As an operating assumption. The default position in any system is that unnecessary complexity has accumulated, that assumptions have calcified into requirements, and that the gap between what is being done and what should be done is large.

The idiot index quantifies this. It gives the gap a number.

The willingness to actually look at that number, to measure the gap rather than assume it away, is what separates people who produce breakthrough work from people who produce competent work.

Carlini writes that good collaborators don't just offload work. They catch your mistakes, push back on bad ideas, and bring skills you don't have. I've spent years building AI systems across organizations where I was often the one driving the technical vision for how these systems should be monitored and evaluated. I'm proud of that work. But I also know where its limits are. The limits are mine. I've built tools that serve thousands of users, but I haven't built tools that surface unexpected patterns across hundreds of thousands of conversations in real time. I've run interpretability experiments on individual model behaviors, but I haven't operated at the scale where those experiments inform decisions about how models are deployed to millions of people. I know what I'm good at. What I want is to be in a room where the things I don't yet know how to do are the things being done at the highest level, where the standard is set by the work itself, and where my ideas get sharpened by people who have context I haven't earned yet.

---

## Reality as the Primary Validation Tool

Use reality as your primary validation tool. Not theory. Not consensus. Reality.

Carlini prototypes fast and kills papers that aren't working because reality told him the idea was dead. Musk launches rockets and lets them explode because the explosion contains more information than any simulation. Chalamet poured five years into embodying Bob Dylan because the craft demands contact with the actual material.

And in AI (the field I've chosen to pursue with everything I have) this principle matters more than anywhere else. These models are the most complex artifacts humanity has ever built. Their behavior is not fully predictable from their specifications. The only way to understand what they do is to watch what they do, measure what they do, and build the instruments that let us see what's happening inside.

I want to do this work. I believe it's the most important problem in the field right now, and I think I'm positioned to contribute to solving it.

There's a version of AI safety that looks like a locked room with a few researchers guarding the keys. I don't believe in that version. The gap between intended and actual model behavior gets solved by building instruments so good that the entire research community can use them. When you make oversight tools widely available, you're not giving away competitive advantage. You're multiplying the number of people who can catch what you missed. Democratizing the instruments of observation is itself an alignment strategy (maybe the most important one).

Carlini would call that good taste in problems. Musk would call it first principles. Chalamet would call it the pursuit of greatness.

I think they're all describing the same thing: the decision to care deeply about your craft, to build and test and fail and iterate, and to say out loud that you're trying to be excellent. Even when nobody wants to hear it.

Especially when nobody wants to hear it.
