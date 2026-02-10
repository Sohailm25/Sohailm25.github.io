Title: Robotics Beyond Humanoids: Getting My Hands Dirty
Date: 2026-02-10 13:30
Category: Thoughts
Slug: robotics-beyond-humanoids
Summary: Everyone's watching humanoid robots. But if you think something is revolutionary, variants probably exist. The robotics community is vast. Here's what I'm learning as a software engineer jumping in.

---

Everyone's watching humanoid robots right now. Tesla's Optimus. Figure. The demos are impressive. The anthropomorphized form factor has a wow factor that no "box" or "arm" robot can match. When you see a humanoid fold laundry, it feels revolutionary.

But here's a framework i keep coming back to: if you think something is novel or brand new or revolutionary, the likelihood that variants of the same thing (just as impressive) exist and have existed for a while is high. Except for rare breakthrough cases.

So look deeper. The robotics community is vast and heavily explored.

i've spent the past few weeks reading about robotics (specifically lab automation and manipulation), and what i'm learning is reshaping how i think about the field. i'm a software engineer with an ML background. i just ordered an Aloha Mini. i have no robotics experience. This is me documenting the beginning of that journey.

---

## Why Now

Honestly? It's about time.

i've realized that if i'm in the "it would be cool to..." or "one day i want to..." or "my future career goal..." mindset, or if i'm simply interested in reading about a domain, why not just get hands-on as soon as possible?

Close the gap between theorizing and doing.

Getting my hands dirty will break the romanticized outside opinion and force me to develop real personal opinions. That's where the value exists. Move from the outgroup to the ingroup. Outgroup romanticizes. Ingroup has lived through the frustrations and the pit of despair.

i want the pit of despair. That's where you actually learn something.

There's also something to the "touching grass" angle. As a software engineer, everything is abstract. Code, models, APIs, infrastructure. It all lives on screens. Robotics is physical. You build something, it moves (or doesn't), and you can see why. i miss hands-on tinkering. Men used to go to war. i'm going to scoop cat litter with a robot.

---

## The Utilization Problem

The insight that reframed robotics for me came from an [Owl Posting article on lab automation](https://www.owlposting.com/p/heuristics-for-lab-robotics-and-where). The core problem isn't that robots can't do tasks. It's that they sit idle.

The article walks through an example: consider a liquid handler in a biology lab (a robot that pipettes liquids). It costs $40,000-$100,000. It can pipette with superhuman speed and precision. But setting up a new protocol for it takes an automation engineer 40+ hours. If you're running that protocol 10,000 times, the setup cost amortizes to pennies per run. Worth it. But if you're running it 50 times? That's $80 per run in setup costs. You'd be better off doing it by hand.

Most protocols in most labs fall into the second category. Research is exploratory. You run an experiment, look at results, change something, run a different experiment. The automation sits unused.

This is the same problem GPUs had before cloud compute. Expensive hardware. High utilization required to justify cost. Individual users couldn't fill capacity. Cloud providers (AWS, Modal, Lambda Labs) pooled demand and achieved utilization rates no individual could match.

Cloud labs (Emerald Cloud Labs, Transcriptic) are trying to do the same for robotics. Centralized facilities with standardized automation that multiple customers can access. When one customer's experiment finishes, another's begins. The robot never sits idle.

---

## Humanoids Are Impressive. Arms Are the Business.

The humanoid demos have the wow factor. But the bottleneck in robotics isn't the form factor. It's:

- **Scheduling software** to batch tasks and maximize utilization
- **Translation layers** that let non-experts program robots without 40 hours of setup
- **Standardized interfaces** so different robots and instruments can work together

A humanoid robot in a lab still faces the same utilization problem. If it takes 40 hours to teach it a new protocol and you only need that protocol 50 times, you're still better off doing it by hand.

What's actually changing:

**Imitation learning at scale.** Physical Intelligence [recently showed](https://www.pi.website/research/human_to_robot) that as you scale up robot training data, the ability to transfer from human video emerges automatically. You don't need perfect robot demonstrations. Train on enough robot data, and the model learns to absorb human video during fine-tuning (~2x improvement on limited-data tasks).

**LLM-powered translation.** [Briefly Bio](https://brieflybio.substack.com/p/how-to-make-lab-automation-flex-as) is building tools that convert natural-language protocols into robot-executable code. The automation engineer bottleneck starts to dissolve when an LLM can handle the translation.

**Modular, task-specific hardware.** Instead of one humanoid that does everything, modular arms and "workcells" (multiple instruments connected by robotic arms) that can be reconfigured for different tasks.

The [Universal Robots](https://www.universal-robots.com/) arms feel like the BMW of this space. Sleek, metal, smooth motion. Not humanoid, but undeniably impressive in a different way. When i saw them, i thought: yeah, i want that.

---

## Why Aloha Mini

i looked at a few options. The SO-100 and SO-101 have dual arms, which is cool, but no mobility. i felt like i'd quickly outgrow just the arms. Aloha Mini has arms AND motion (it's on a mobile base). That felt like more room to explore.

First task i want to try: scooping cat litter.

my wife and i have 3 kittens. They're going to be very curious about the robot. Especially the exposed wires. This will either go well or become an expensive cat toy. Either way, i'll learn something.

---

## What I Think Will Transfer from ML

My background is CNNs, OCR, distributed training, inference at scale. Some things i expect will transfer:

- **Data quality > data quantity.** In ML, garbage in, garbage out. i assume the same is true for imitation learning demonstrations.
- **Evaluation is harder than training.** Getting a model to do something is easier than knowing if it's doing it well. Robot evaluation seems even harder (you can't just run a test set, you have to physically watch it).
- **Community matters.** LeRobot on HuggingFace, robotics Twitter/X, research labs sharing datasets and models. Same pattern as ML. Find the communities, learn what people are actually using.

What i suspect won't transfer: intuition for hardware failure modes. Software fails in predictable ways. Hardware fails in ways that involve physics, wear, and cats chewing on wires.

---

## The Centralization Question

There's a tension in all of this that [Keoni Gandall captures in Synbio25](https://synbio25.com/):

> "The vast majority of experiments are done with human hands, manually. It is like if we are mining bitcoin on abacuses."

Centralized automation will be more efficient. That's the economic reality. But centralization can go two ways:

**Monopolization:** A few large players control the infrastructure, capture the value, and individual researchers lose agency.

**Democratization:** Centralized infrastructure becomes a platform anyone can build on. AWS is massive, but the software running on it is diverse. Cloud labs could follow the same pattern.

The window matters. The infrastructure is being built now. If you care about this space, now is the time to pay attention (or, in my case, to buy an Aloha Mini and start learning).

---

## What I'm Curious About

A few questions i'm holding as i start:

**Where does simulation fit?** Sim-to-real transfer has been a research topic for years. Is it actually useful in practice, or is real-world data still king?

**What breaks first?** Software breaks in logs. Hardware breaks in the physical world. i'm curious what the failure modes look like and how you debug them.

---

## Following Along

This is the start. i'll write more as i learn (what works, what breaks, what surprises me).

If you're a software engineer curious about robotics, or just someone who vibes with this kind of exploratory writing, you're the audience i'm writing for. We're figuring this out together.

The humanoid demos are cool. But i'm more interested in the boring, task-specific, infrastructure-level work that nobody's making viral videos about.

And scooping cat litter. i'm definitely interested in that.

---

*References:*
- [Heuristics for Lab Robotics (Owl Posting)](https://www.owlposting.com/p/heuristics-for-lab-robotics-and-where)
- [Human to Robot Transfer (Physical Intelligence)](https://www.pi.website/research/human_to_robot)
- [Lab Automation Flexibility (Briefly Bio)](https://brieflybio.substack.com/p/how-to-make-lab-automation-flex-as)
- [Synbio25 (Keoni Gandall)](https://synbio25.com/)
