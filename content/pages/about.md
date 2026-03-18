Title: About
Slug: about

![with maha]({static}/images/maha-sohail.jpg)

i'm sohail. i'm building ai systems at amazon.

right now i'm working on agent platforms for 1.5m+ employees. before this i built a rag system at jpmorgan chase that went from 0 to 10k+ users. before that: mlops at wendy's (genai in the drive thru), gpu stuff at jack henry, ml systems at capgemini.

i love my wife. i love the gym. i love our cats.

contributed to unsloth, mlx-lm, and some rlhf stuff.

[github](https://github.com/sohailm25) · [linkedin](https://linkedin.com/in/sohail-mo) · [x](https://x.com/sohailmo)

sohailmo.ai@gmail.com

## current snapshot of my research beliefs (mechinterp)

i've been in technical work long enough to know output is cheap and signal is rare. publishing work that doesn't meaningfully move understanding forward feels empty. i optimize for depth over volume.

i still feel like an amateur in mechanistic interpretability. i think that is the right posture. in this field, taste is earned experimentally. it is not declared. i bias toward fast, structured iteration. i run small ablations, smoke tests, and aggressive pruning of weak directions before scaling anything expensive.

most failures sit below the abstraction layer you start with. i default to questioning assumptions in my own framing, in papers, and in the incentives behind what gets called good research. local maxima often present as consensus.

i am most interested in applied interpretability. this includes auditing, production oversight, and practical intervention. i am less interested in interpretability as pure reverse engineering. this includes open questions around reasoning models, training regimes, and architecture shifts such as moe and multimodal systems. older interpretability intuitions may not transfer cleanly.

i also think mechinterp is partly a meta-science right now. it is not only about studying model mechanisms. it is also about defining what valid mechanistic evidence should look like. causal mechanistic interpretability is methodological infrastructure for the field. this work helps future papers make stronger causal claims.

my current mental model is a three-level hierarchy.

1. **level 1: activation steering.** can i reliably manipulate behavior through internal interventions?
2. **level 2: causal mediation.** which components causally transmit specific effects?
3. **level 3: causal abstraction.** does the model's computation structurally correspond to an interpretable algorithm at the right grain?

tools are increasingly accessible. i can run serious 8b forward-pass experiments locally. leverage now comes from better questions, tighter experiment design, and clearer visualizations. visuals are not decoration. they are part of the reasoning process.

net: i am aiming for research that is technically rigorous, operationally useful, and genuinely novel.
