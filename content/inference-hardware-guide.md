Title: hopper, blackwell, and instinct: the exhaustive guide to llm inference hardware
Date: 2026-08-12
Category: Writings
Slug: inference-hardware-guide
Summary: everything i could verify about nvidia hopper/blackwell and amd mi300x through mi355x for llm inference. silicon, number formats, interconnect, how vllm/sglang/tensorrt-llm change per chip, what the benchmarks measure, where they lie, and the fp6 question. every number traces to a primary source.
Template: longform_article
Status: published

<div class="tldr" markdown="1">
**tl;dr:** which gpu wins llm inference depends on workload shape, and the shape is stable enough to memorize: amd wins cost-per-token on prefill-heavy moe serving below ~100-130 tokens/s/user; nvidia wins decode-heavy shapes, high interactivity, disaggregated serving, dense models, and all rack scale, often by multiples. the engines (vllm, sglang, tensorrt-llm) are one codebase each, and hardware support lives in readable dispatch tables that predict benchmark results before benchmarks run. several of the most-cited benchmark wins on both sides compare fresh software against opponent baselines frozen months earlier. fp6 exists on both vendors' silicon; amd runs it 2x faster on paper; nothing on earth serves it. this guide is the full reference: silicon, formats, memory math, interconnect, engine internals, benchmark forensics, and a buyer's checklist.
</div>

---

## part 0: what this is and how it was made

i work at together ai. we run inference on nvidia fleets, we sell inference, and nvidia and amd are both companies my employer has commercial relationships with. read every judgment in this piece with that in mind. everything here comes from public sources: vendor whitepapers and datasheets, hot chips decks, mlcommons result tables, engine source code, engineering blogs, and the public api behind semianalysis's inferencex benchmark. no internal information from any employer or customer appears in this piece.
{: .has-dropcap}

this started as a simple question: what is architecturally different between hopper, blackwell, and amd's instinct line, and how much does it matter for serving llms? the honest answer took 23 research agents, about 4.3 million tokens of reading, and 1,092 tool calls across two days. agents read the cdna4 whitepaper and the blackwell datasheets, cloned vllm and sglang and read their dispatch code at commits from this week, pulled about 8,000 raw benchmark rows from the inferencex api, and audited the benchmark's own ci configs to find out when each number was actually produced. i then went through everything and wrote this.

two rules govern every number below. first, vendor claims are labeled as vendor claims, and independently measured numbers are preferred wherever they exist. second, every benchmark number carries a date in my notes, because the single most useful lesson of this whole exercise is that benchmark rows rot. software in this space moves double-digit percent per quarter, and a comparison whose two sides were measured four months apart is a comparison of calendars, not chips.

how to read this: parts 1 through 4 are the hardware (silicon, number formats, memory, interconnect). part 5 is how the serving engines change shape per chip. parts 6 through 8 are what the benchmarks say, where they mislead, and where theory and measurement disagree. part 9 is fp6. part 10 is what operating each fleet is like. part 11 is the decision guide. if you're just here to pick hardware, read part 11 and the win map in part 6, then come back for the mechanisms when a vendor slide confuses you.

---

## part 1: the silicon

### 1.1 the family tree

```
nvidia                                      amd
======                                      ===
hopper (2022, tsmc 4n, monolithic)          cdna3 (dec 2023, n5+n6 chiplets, "3.5d")
├─ h100 sxm   80gb hbm3   3.35tb/s  700w    ├─ mi300x  192gb hbm3   5.3tb/s  750w
├─ h100 pcie  80gb hbm2e  2.0 tb/s  350w    ├─ mi300a  128gb (apu, 24 zen4 cores)
├─ h100 nvl   94gb hbm3   3.9 tb/s  400w    └─ mi325x  256gb hbm3e  6.0tb/s  1000w
└─ h200      141gb hbm3e  4.8 tb/s  700w
   (same compute as h100; memory refresh)   cdna4 (jun 2025, n3p+n6 chiplets)
                                            ├─ mi350x  288gb hbm3e  8tb/s  1000w air
blackwell (2024-25, 4np, dual-die)          └─ mi355x  288gb hbm3e  8tb/s  1400w liquid
├─ b200   180/186gb hbm3e ~8tb/s 1000-1200w    (same silicon, +200mhz from +400w)
├─ gb200  = grace cpu + 2x b200 → nvl72
└─ b300/gb300 "ultra" 288gb, 1400w          cdna-next (2026-27, announced)
   (fp4 1.5x, attention sfu 2x)             └─ mi400/mi455x + helios 72-gpu rack
                                               (432gb hbm4, ualink-over-ethernet)
```

the two vendors refresh on different rhythms, and the rhythm tells you what each thinks the bottleneck is. nvidia does mid-cycle *memory* refreshes: h200 is h100's exact compute with 141gb at 4.8tb/s, and b300 is b200's die with 288gb and a couple of targeted units doubled. that's a bet that decode is memory-bound, which it is. amd does mid-cycle *power* splits: mi355x is mi350x's identical 185b-transistor silicon at 2.4ghz instead of 2.2, bought with 400 extra watts and direct liquid cooling. that's a bet that sustained clocks are the difference between paper flops and real ones, which is also true.

### 1.2 hopper: one big die

```
                h100 / h200 package
   ┌──────────────────────────────────────────┐
   │  hbm   hbm   ┌────────────────┐  hbm     │
   │ stack stack  │  gh100 die     │ stack    │
   │              │  814 mm², 80b  │          │
   │              │  transistors   │          │
   │  hbm   hbm   │ 132 sms (sxm)  │ (6th site│
   │ stack stack  │ 50mb l2        │  dark)   │
   │              └────────────────┘          │
   │  h100: 5x16gb hbm3  = 80gb  @ 3.35tb/s   │
   │  h200: 6x24gb hbm3e = 141gb @ 4.8 tb/s   │
   └──────────────────────────────────────────┘
```

hopper is one monolithic die on tsmc's 4n process: 80 billion transistors, 814 mm², compute capability 9.0. the full die has 144 streaming multiprocessors and 60mb of l2; the h100 sxm ships 132 sms and 50mb, the pcie card 114 sms. every hopper product (sxm, pcie, nvl, h200) is this same silicon with different enabled units, memory, and power.

each sm carries 4 fourth-generation tensor cores, a 256kb register file, and 256kb of unified l1/shared memory (up to 228kb configurable as shared). the 50mb l2 has a quirk worth knowing: it is physically two 25mb partitions, and a hit in the far partition costs nearly 2x a near hit. chips and cheese measured about 5.5tb/s reading the near partition and about 3.8tb/s streaming the full 50mb.

four architectural features carry every fast hopper inference kernel, and they compose into one design pattern:

1. **tma** (tensor memory accelerator): a per-sm async copy engine. one thread posts a descriptor, the hardware moves the tile, no threads burn registers on address math.
2. **wgmma**: asynchronous warpgroup-wide matrix multiply. this one is load-bearing: legacy `mma` instructions cap at about 63% of hopper's peak (measured), so any kernel that didn't adopt wgmma left a third of the machine idle.
3. **thread block clusters + distributed shared memory**: sms in a cluster can read each other's shared memory over an on-die network at ~180 cycles measured, about 32% faster than bouncing through l2.
4. **async transaction barriers**: barriers that count bytes delivered by tma in addition to thread arrivals.

put together, these enable warp specialization: producer warps drive tma, consumer warps drive wgmma, and the barriers keep them honest. flashattention-3 is exactly this pattern, and it hit 740 tflops fp16 forward on h100 (75% of peak) where flashattention-2 managed about 35% utilization. when people say "hopper is mature," they mean this: the fast idiom is known, open source, and everywhere.

h200 deserves its own note because it is the cleanest experiment nvidia ever ran on the memory-bound hypothesis: identical flops, 1.76x capacity, 1.43x bandwidth. measured result: +28% llama-2-70b throughput at matched 700w in mlperf, roughly +40% comparing best submissions across rounds. bandwidth converted to throughput at better than half efficiency, on decode-heavy serving, with zero compute change. also, when the h200 press release said "2.4x more bandwidth," the comparison was against a100, a gpu from 2020. reading footnotes is a competitive advantage in this field.

the other footnote that matters: every tensor-core number on nvidia's spec pages (tf32 and below) carries a 2:4 structured-sparsity asterisk, and the footnote says dense is half. llm inference runs dense weights. h100 sxm dense reality: 989 tflops bf16, 1,979 tflops fp8. when a slide says "4 petaflops h100," it is quoting sparse fp8 that no llm deployment uses.

### 1.3 blackwell: two dies pretending to be one

```
                    b200 package
   ┌────────────────────────────────────────────────┐
   │ hbm3e  hbm3e   ┌────────┐║┌────────┐  hbm3e    │
   │ stack  stack   │ die 0  │║│ die 1  │  stack    │
   │                │ 74 sms │║│ 74 sms │           │
   │ hbm3e  hbm3e   │ ~63mb  │║│ ~63mb  │  hbm3e    │
   │ stack  stack   │  l2    │║│  l2    │  stack    │
   │                └────────┘║└────────┘           │
   │                  nv-hbi 10 tb/s                │
   │  180gb @ 7.7tb/s (hgx)  186gb @ 8tb/s (gb200)  │
   │  288gb (b300 ultra, 12-hi stacks)              │
   └────────────────────────────────────────────────┘
   cuda sees ONE gpu: one device, one l2, one hbm pool
```

blackwell is two reticle-limit dies on tsmc 4np, 208 billion transistors total, joined by a 10tb/s link called nv-hbi. software sees a single gpu: one device in cuda, a unified 126mb l2, one memory pool. 160 sms physical (80 per die); b200 ships 148, b300 ships all 160.

the unification is real but not free. measured cross-die effects: atomics run 90-100ns same-die versus 190-220ns cross-die, and l2 bandwidth drops from about 21tb/s same-partition to about 16.8tb/s across the seam. it is numa inside "one gpu." no code changes required, but autotuners feel it. compare amd's mi250x from the prior generation, which exposed its two dies as two devices and made every framework deal with it; nvidia hid the seam and ate the engineering cost itself. that choice is a big part of why blackwell adoption was faster than cdna adoption despite blackwell's own kernel churn.

and the churn was real, because blackwell changed the tensor-core programming model outright:

```
  hopper (wgmma)                        blackwell (tcgen05)
  ──────────────                        ───────────────────
  smem ──► tensor core ──► REGISTERS    smem(a,b) ──► tensor core ──► TMEM
  - accumulator lives in the register   - accumulator lives in tmem, a new
    file, competing with cuda cores       256kb-per-sm scratch memory
    for register bandwidth              - register file is out of the mma
  - issued by a 128-thread warpgroup      path entirely
                                        - issued by ONE thread per block,
                                          fully async
                                        - two sms can gang up on one matmul
                                          (tiles up to 256 wide)
```

`wgmma` is deprecated on blackwell, and code compiled for `sm_90a` (which is every flashattention-3-class hopper kernel) does not run on `sm_100` at all. so the entire fast-kernel inventory (fa3, cutlass hopper gemms, machete, the vllm/sglang hopper kernels) had to be rewritten. the rewrites took most of 2025: flashattention-4 arrived at 1,605 tflops bf16 forward (71% of b200 peak), cutlass 3.8+ shipped sm100 collectives, and deepgemm was ported to the new mma. once kernels exist, the hardware delivers: independent microbenchmarks measure 96-98% of dense peak across fp16/fp8/fp4.

one more blackwell wrinkle that shaped kernel design: tensor flops went up 2.25x over hopper while the special function units (which compute exponentials) stayed flat, so softmax became the attention bottleneck. fa4 works around it with a software polynomial exponential spread across the fma units. b300 then fixed it in hardware, doubling sfu exponential rate (10.7 tera-exponentials/s, nvidia's number) and marketing it as "2x attention" for long context. b300 also cuts int8 and fp64 rates to near zero to pay for its 15-petaflop dense fp4. every one of these chips is a budget; the interesting part is what got cut.

a couple of honest asterisks on blackwell's spec sheet: the hardware decompression engine claims 800gb/s and the one independent measurement got 219.8gb/s on lz4; and consumer blackwell (rtx 50 series, `sm_120`) has a different tensor-core isa than datacenter blackwell, so "runs on blackwell" claims need a suffix. gb200 pairs each two gpus with a grace cpu over a 900gb/s coherent link (480gb of lpddr5x per cpu), which matters later for kv offload and expert-weight streaming.

### 1.4 cdna3 (mi300x / mi325x): the 3.5d chiplet stack

```
     top view (package)                 side view (one quadrant)
  ┌────┐┌────┐  ┌────┐┌────┐
  │hbm ││hbm │  │hbm ││hbm │           ┌──────┐  ┌──────┐
  └────┘└────┘  └────┘└────┘           │ xcd  │  │ xcd  │  ← n5 compute dies,
  ┌───────────┬───────────┐            │(38cu)│  │(38cu)│    hybrid-bonded on top
  │ [xcd][xcd]│[xcd][xcd] │            ├──────┴──┴──────┤
  │   iod 0   │   iod 1   │            │   iod (n6)     │  ← 64mb infinity cache
  ├───────────┼───────────┤            │ 2x hbm phy,    │    slice + fabric + phys
  │ [xcd][xcd]│[xcd][xcd] │            │ xgmi/pcie phy  │
  │   iod 2   │   iod 3   │            ├────────────────┤
  └───────────┴───────────┘            │ cowos interposer│
  ┌────┐┌────┐  ┌────┐┌────┐           └────────────────┘
  │hbm ││hbm │  │hbm ││hbm │
  └────┘└────┘  └────┘└────┘
  8 xcds stacked on 4 iods, 153b transistors, 13 active dies
```

mi300x is the most aggressive packaging in the group: eight compute chiplets (xcds, tsmc n5) hybrid-bonded on top of four i/o dies (n6), the whole stack on a silicon interposer. amd calls it "3.5d." 304 compute units at 2.1ghz peak, 192gb of hbm3 at 5.3tb/s, 750w. mi325x is the same silicon at 1000w with 256gb of hbm3e at 6tb/s (announced at 288gb, shipped at 256; capacity announcements are aspirations until a datasheet says otherwise).

the memory-side design is the distinctive part. a 256mb infinity cache lives in the i/o dies next to the hbm controllers (claimed 17.2tb/s, measured 11.9), amplifying bandwidth for streaming reads and absorbing cross-chiplet coherence through a snoop filter. each xcd has its own private 4mb l2, coherent only within that xcd. in the default spx mode the hardware round-robins workgroups across all eight xcds with no placement control, so l2 locality is luck, and amd's own tuning guide says to size grids in multiples of eight. the chiplet seams show up in small ways: xcd clocks vary 3-10% under load, and cross-xcd anything costs more than the diagram suggests.

cdna3 also has a genuinely unique capability nvidia can't match: runtime partitioning. one mi300x can become 2, 4, or 8 logical gpus (down to one xcd + 24gb each, with memory locality options), reconfigurable with a cli command, no reboot. it is a better multi-tenant story than mig on paper. as far as i can find, nobody has published a serious serving benchmark of it, which tells its own story (part 8).

the number that defines cdna3, though, is the gap between paper and delivered. marketed: 1,307 tflops dense bf16, ahead of h100's 989. measured by semianalysis over five months: about 620 tflops achievable gemm, 47% of peak, versus h100's 720 (73% of its peak). the specs read 32% ahead; the delivered gemms ran 14% behind. everything about amd's 2024-2025 software story is downstream of that one measurement.

### 1.5 cdna4 (mi350x / mi355x): same idea, fewer seams, fp4

```
  ┌────┐┌────┐  ┌────┐┌────┐
  │hbm ││hbm │  │hbm ││hbm │        changes vs cdna3:
  └────┘└────┘  └────┘└────┘        - 4 iods → 2 iods (simpler fabric;
  ┌───────────────────────┐           iod-to-iod link ~14% faster)
  │ [xcd][xcd] [xcd][xcd] │         - xcds n5 → n3p; 32 cu/xcd active
  │        iod 0          │           (256 total: fewer, faster, 2.4ghz)
  ├───────────────────────┤         - 185b transistors
  │ [xcd][xcd] [xcd][xcd] │         - lds 64kb → 160kb per cu
  │        iod 1          │         - matrix cores 2x for ≤16-bit types;
  └───────────────────────┘           mxfp4/mxfp6 at 4x the fp16 rate
  ┌────┐┌────┐  ┌────┐┌────┐        - fp8 goes ocp-standard (fixes cdna3's
  │hbm ││hbm │  │hbm ││hbm │          fnuz mess, part 2)
  └────┘└────┘  └────┘└────┘        - 288gb hbm3e (8x36gb) @ 8tb/s
```

cdna4 is a deliberate ai-over-hpc rebalance, and the cuts are as informative as the additions: fp64 matrix rate halved, tf32 dropped entirely (emulated via bf16 now), 304 compute units down to 256 but clocked higher. added: doubled matrix throughput for 16-bit and smaller, native fp4 and fp6 at 4x the fp16 rate, doubled transcendental rate (the same softmax motivation as b300's sfu bump, a year earlier), and 160kb of local data share per cu, up from 64kb, which more than doubles occupancy for lds-hungry kernels.

mi350x and mi355x are the same 185-billion-transistor package. the 400 extra watts on mi355x buy 9% more peak clock and, more importantly, sustained clocks under real load; the mi350x at 1000w is the air-cooled drop-in for existing mi325x system designs, while mi355x wants direct liquid and a rack that can feed it. amd's rack configurations run 64 gpus at 120-130kw on air or up to 128 gpus at ~200kw on liquid, and it's worth saying plainly: the 128-gpu rack is sixteen separate 8-gpu servers sharing sheet metal, not one coherent machine. amd's coherent domain is still 8 gpus (part 4).

### 1.6 the spec table, dense and honest

| | h100 sxm | h200 | b200 (hgx) | b300 | mi300x | mi325x | mi355x |
|---|---|---|---|---|---|---|---|
| bf16 dense | 989 tf | 989 tf | 2.25 pf | 2.5 pf | 1.31 pf | 1.31 pf | 2.52 pf |
| fp8 dense | 1.98 pf | 1.98 pf | 4.5 pf | 5 pf | 2.61 pf | 2.61 pf | 5.03 pf |
| fp6 dense | none | none | 4.5 pf | 5 pf | none | none | 10.07 pf |
| fp4 dense | none | none | 9 pf | 15 pf | none | none | 10.07 pf |
| hbm | 80 gb | 141 gb | 180-186 gb | 288 gb | 192 gb | 256 gb | 288 gb |
| bandwidth | 3.35 tb/s | 4.8 tb/s | 7.7-8 tb/s | 8 tb/s | 5.3 tb/s | 6 tb/s | 8 tb/s |
| l2 / cache | 50 mb | 50 mb | 126 mb | 126 mb | 8x4mb + 256mb | same | 8x4mb + 256mb |
| scale-up per gpu | 900 gb/s switched | 900 gb/s | 1.8 tb/s switched | 1.8 tb/s | 896 gb/s mesh (128/pair) | same | 1,075 gb/s mesh (153.6/pair) |
| coherent domain | 8 | 8 | 8 (72 in nvl72) | 8 / 72 | 8 | 8 | 8 |
| tdp | 700 w | 700 w | 1,000 w | 1,400 w | 750 w | 1,000 w | 1,400 w |

three traps hide in this table. first, every vendor marketing page quotes sparse numbers for nvidia and sometimes-sparse for amd; this table is dense, which is what llm serving uses. second, the amd "scale-up per gpu" number is an aggregate across seven links to seven different peers; any single pair of amd gpus talks at 128-153.6 gb/s, while nvidia's switched number is available to any single pair. that per-pair versus aggregate confusion is the single most misleading comparison in vendor decks. third, b300's "288gb" is the chip's nominal; nvidia's own 8-gpu system pages list 2.1tb per node, or 262gb usable per gpu.

---

## part 2: the number format wars

precision is where the vendors differentiate hardest, and where the most silent failures live. this part is short but almost everything in parts 6-9 depends on it.

### 2.1 fp8: one name, three encodings

```
e4m3 (ocp standard: nvidia, cdna4):  bias 7,  max ±448,   nan = s.1111.111
e4m3fnuz (cdna3 only):               bias 8,  max ±240,   no -0, nan = 0x80
e5m2 (ocp):                          bias 15, max ±57344, keeps inf/nan
```

the same bit pattern decodes to half the value on mi300x as it does everywhere else. cdna3 implemented a nonstandard fp8 variant called fnuz, so every ocp-format checkpoint (deepseek's native fp8, redhat's, nvidia's) gets converted at load: reinterpret the bytes, zero out any 0x80 pattern (which means negative zero in the standard format but nan in fnuz), and multiply every scale by 2.0. vllm and sglang both carry this shim.

the failure mode when a conversion path gets missed is the nastiest kind: silent output corruption with an http 200. a documented vllm issue had a minimax model with fp8 kv cache on mi300x returning fluent garbage, root-caused to exactly this byte-interpretation mismatch stacked on a kernel layout assumption. this is why serious amd deployments gate releases on accuracy evals, not health checks, and it is a one-generation problem: cdna4 went ocp-standard and the shim disappears on mi355x. the punchline for buyers: amd's own cdna3 whitepaper claims ocp compliance. the rocm docs, pytorch, vllm, and the quantizer all say fnuz. when marketing and the precision-support matrix disagree, believe the matrix.

one more fp8 nuance that shapes benchmarks: hopper's fp8 tensor cores have no hardware block scaling, so deepseek-style fine-grained scaling (one scale per 128-value block) is emulated in software; deepgemm does two-level accumulation on cuda cores to patch hopper's imprecise fp8 accumulation. blackwell and cdna4 both moved block scaling into the tensor core, which is why "fp8 serving" quietly means different kernels per generation.

### 2.2 fp4: nvfp4 versus mxfp4

```
mxfp4 (ocp standard; amd, gpt-oss checkpoints):
  [ 32x e2m1 elements ][ e8m0 scale ]        scale = power of two ONLY

nvfp4 (nvidia proprietary; blackwell tensor cores):
  [ 16x e2m1 elements ][ fp8 e4m3 scale ]    fractional scale precision
  ... whole tensor      x [ fp32 second-level scale ]
```

both formats store 4-bit elements; the fight is over the scale factors. nvfp4's blocks are half the size (16 elements versus 32), so one outlier poisons half as many neighbors, and its scales are fractional fp8 instead of power-of-two, so scale rounding error mostly disappears. measured under naive round-to-nearest quantization, the difference is large (wikitext-2 perplexity 6.47 versus 7.31 on qwen2.5-7b). nvidia publishes ~1%-class accuracy deltas going fp8 to nvfp4 on deepseek-r1 and ships ready nvfp4 checkpoints for the big models.

three complications keep this from being a clean nvidia win. mxfp4 with good calibration (group-rotation gptq variants) closes to within 1-2% of nvfp4's accuracy. mxfp4 kernels measured about 15% faster than nvfp4 on b200 itself (simpler scale math). and the distribution asymmetry cuts both ways: gpt-oss and kimi k3 ship native mxfp4 weights that both vendors can serve, while nvfp4 checkpoints are blackwell-only and lock amd users out entirely. no public benchmark scores quality-adjusted cost per token, so the "better accuracy at 4 bits" argument, real as it is, has never been converted into a measured serving win.

---

## part 3: memory, the roofline, and the fit matrix

### 3.1 why every refresh is a memory refresh

decode re-reads the model weights (divided by batch size) plus the kv cache for every generated token. h100's fp8 compute only becomes the bottleneck above roughly 591 flops per byte of memory traffic; h200's above roughly 412. decode workloads sit far below both. that's the whole story of why h200 (bandwidth-only refresh) gained ~28-40% on real serving, and why mi355x, b200, and b300 all landing at ~8tb/s makes single-gpu decode bandwidth a tie this generation. when bandwidth ties, the matchups get decided by capacity, interconnect, and software, which is the rest of this guide.

### 3.2 kv cache math you can do on a napkin

per-token kv cost, computed from each model's config.json:

| model | attention | kv/token bf16 | kv/token fp8 |
|---|---|---|---|
| llama 3.1 70b | gqa, 8 kv heads, 80 layers | 320 kib | 160 kib |
| llama 3.1 405b | gqa, 8 kv heads, 126 layers | 504 kib | 252 kib |
| deepseek-v3/r1, kimi k2 | mla, 61 layers | 68.6 kib | 34.3 kib |
| kimi k3 | mla on 24 of 93 layers + linear attention | 27 kib | 13.5 kib |

mla (deepseek's compressed-latent attention) is 4.7-7.3x smaller per token than gqa. one 128k-token gqa sequence on llama-405b costs 61.5 gib of kv, which is most of an h100. and there's a trap inside the trap: mla has effectively one kv head, so under plain tensor parallelism the latent cache is *replicated on every gpu*. tp8 means 8x the kv memory. sglang's dp-attention mode (data-parallel attention, introduced for exactly this) dedups it, which is why `--enable-dp-attention` shows up in every serious deepseek deployment on every vendor. a launch flag changes node kv capacity by 8x. hardware reviews rarely mention it.

### 3.3 the fit matrix

weights at tp8, 90% memory budget, 8-gpu nodes:

| model + precision | 8x h100 (640g) | 8x h200 (1128g) | 8x b200 (1440g) | 8x mi300x (1536g) | 8x mi325x (2048g) | 8x mi355x / b300 (2304g) |
|---|---|---|---|---|---|---|
| llama 405b fp8 (410 gb) | fits, tight | fits | fits | fits | fits | fits |
| deepseek-r1 fp8 (689 gb) | no | fits (~714k tokens kv at tp8) | fits | fits | fits | roomy |
| kimi k2 fp8 (1.03 tb) | no | ~108k tokens; unusable | fits | fits | fits | fits |
| kimi k3 mxfp4 (1.56 tb) | no | no | no (misses by ~25 gb) | no | fits (but no fp4 hardware) | fits (71% util incl. a 1m-token fp8 kv) |

this table is where "memory is amd's weapon" stops being a slogan and becomes arithmetic. the minimum clean single-node home for deepseek-r1 fp8 on nvidia is 8x h200. the 1.5tb kimi k3 checkpoint fits only 288gb-class nodes, and 8x b200 misses by about the size of a laptop's ram, forcing a two-node deployment that pays a cross-node network tax on every decode step. part 7 covers what that tax measured out to, and what happened when b300 showed up with its own 288gb.

on cache philosophy: nvidia scales one big gpu-side l2 (50mb → 126mb); amd keeps small per-chiplet l2s and puts 256mb of memory-side cache at the hbm controllers. the amd design amplifies streaming weight reads and does nothing for cross-chiplet reuse. intuition says a 256mb cache should help low-batch decode; part 8 has the measurement that says otherwise.

---

## part 4: interconnect, or why "8 gpus" means three different things

### 4.1 the three topologies

```
 hgx h100/h200/b200 (switched, 8 gpus)      mi300x/mi355x ubb (switchless mesh, 8 gpus)
 ┌────┐┌────┐┌────┐┌────┐                   gpu0──gpu1──gpu2──gpu3
 │gpu ││gpu ││gpu ││gpu │ x8                  │╲ ╳ │ ╳ ╱│ ╳ ╱ │     every gpu: ONE
 └─┬──┘└─┬──┘└─┬──┘└─┬──┘                     │ ╳ ╳ ╳ ╳ ╳ ╳  │     direct link to each
 ══╪═════╪═════╪═════╪══ 18 links/gpu         │╱ ╳ │ ╳ ╲│ ╳ ╲ │     of 7 peers (28 links)
 ┌──────────────────────┐                   gpu4──gpu5──gpu6──gpu7
 │ 4x nvswitch chips    │
 │ any pair @ full rate │                   per-pair: 128 gb/s (mi300x)
 │ in-switch reductions │                             153.6 gb/s (mi355x)
 │ (sharp/nvls)         │                   aggregate: 896 / 1,075 gb/s
 └──────────────────────┘                   no switch → no in-network reduction
 any pair: 900 gb/s (hopper) / 1.8 tb/s (blackwell)

 gb200/gb300 nvl72 (one rack = one gpu domain)
 ┌─────────────────────────────────────────┐
 │ 18x compute trays (2x [grace + 2 b200]) │  72 gpus, ONE nvlink domain
 │ 9x nvlink-switch trays (18 switch chips)│  1.8 tb/s per gpu to ANY peer
 │ copper backplane: 5,184 cables,         │  130 tb/s aggregate
 │ no optics inside the rack               │  13.4 tb hbm3e @ 576 tb/s
 │ ~120 kw, direct liquid                  │  (gb300: 20 tb, 288 gb/gpu)
 └─────────────────────────────────────────┘
```

nvidia's 8-gpu node is switched: every gpu's 18 nvlink lanes terminate in four nvswitch chips, so any pair communicates at the full per-gpu rate, and the switch silicon runs reductions itself (sharp), so all-reduce math executes in the network. amd's 8-gpu node is a switchless full mesh: seven direct links per gpu, one to each peer. the aggregate number looks comparable; the per-pair number is 7x smaller, and there is no switch to host in-network reductions.

nvl72 is the third thing: 72 blackwell gpus in one rack behaving as one nvlink domain, wired with over 5,000 copper cables because copper at that density saved roughly 20kw and half a million dollars per rack versus optics. amd has no counterpart until helios (mi400 generation, 72 gpus over ualink-tunneled-through-ethernet), with production tokens estimated around q2 2027.

### 4.2 what topology does to serving

1. **tensor-parallel all-reduce** sits on the decode critical path twice per layer. measured: nccl with in-switch reductions delivers ~450 gb/s effective per gpu on hgx; mi300x's rccl tops out around 315-319 gb/s at huge message sizes and falls off harder at the small messages inference uses. amd's mitigations are software (msccl++ kernels below a size threshold, and int4-quantized all-reduce on mi355x).
2. **the tp8 wall.** crossing the node boundary drops per-gpu bandwidth to nic rate, ~50 gb/s, an order-of-magnitude cliff on both vendors. nobody runs tensor parallelism across nodes if they can help it.
3. **mixture-of-experts all-to-all** is where nvl72 earns its rent. deepseek-r1 routes each token to 8 of 256 experts; spread experts wider than one node and the dispatch/combine traffic rides the scale-out network. measured: deepseek's deepep library moves ~740 gb/s inside an nvlink node but 61-91 gb/s per gpu across nodes on 400g rdma. inside an nvl72, "cross-node" traffic is still nvlink, so wide expert parallelism spans 72 gpus with no rdma hop. lmsys measured deepseek-r1 decode at 7,583 tokens/s/gpu on gb200 nvl72 (2.7x per-gpu versus h100), later 13,386 with fp8 attention and nvfp4 moe. amd's answer at node scale is a library called mori (dispatch up to ~345 gb/s over xgmi on mi355x, plus rdma paths), and it works; it just can't conjure a 72-gpu coherent domain out of an 8-gpu mesh.
4. **disaggregated prefill/decode** (separate gpu pools for prompt processing and token generation, kv cache shipped between them) stays on nvlink inside an nvl72; everywhere else it rides rdma via mooncake, nixl, or mori-io. amd only got disaggregation working on mi355x, in 2026; cdna3 never got it at all.
5. **dense-model caveat, because nvl72 marketing loves to skip it:** measured per-gpu throughput for dense models on the rack is 0.94-1.04x a plain 8-gpu b200 node. the rack premium (3-4.4x per gpu) is a mixture-of-experts phenomenon. if you serve dense 70b-class models, nvl72 sells you nvlink you will not use.

a small story that captures how tightly topology shapes software: sglang has a feature called two-batch overlap that splits each batch in half so expert-communication overlaps compute. on h100 clusters it's worth +25-35% and every serious deployment uses it. on gb200 nvl72 the team deleted it, because nvlink-speed cross-node communication made the overlap machinery cost more than it hid. on mi355x it survives and got promoted: amd routes the overlap traffic through dedicated dma engines so it consumes zero compute units. same engine, same flag, three different answers, each correct for its wiring.

---

## part 5: the engines, and how silicon reshapes them

this is the part i most wish someone had written before i started. vllm and sglang are each one codebase across all four chip families, and tensorrt-llm is nvidia-only by construction. hardware support in the open engines lives in dispatch tables you can read, and the tables predict benchmark results weeks before benchmarks exist.

### 5.1 one engine, four choke points

```
                        ┌─────────────────────────────┐
                        │   one engine (vllm/sglang)  │
                        │  scheduler, kv manager,     │
                        │  batching: hardware-agnostic│
                        └──────────┬──────────────────┘
                 hardware enters here, at import/launch time
                                   │
      ┌────────────────┬───────────┴────────┬──────────────────┐
      ▼                ▼                    ▼                  ▼
 1. platform      2. attention         3. quant-gemm      4. parallelism
 probe            priority ladder      priority ladder    backend
 pynvml? amdsmi?  per-arch list;       per-format table;  all-to-all lib per
 → cc 9.0/10.0    first backend whose  first kernel that  fabric: deepep
 or gfx942/950    validation passes    supports your cc   (nvlink) vs mori
                  wins                 wins               (xgmi, amd-only)
```

vllm figures out what it's running on by probing device libraries at import (does pynvml initialize? does amdsmi?). from there, every hardware difference flows through per-platform predicates and priority ladders: an ordered list of attention backends, an ordered table of quantized-gemm kernels per number format, a declared graph-capture capability per backend. the first candidate that validates wins. sglang does the same job through a 2,600-line defaults pipeline plus a per-model override registry (deepseek-family models get different defaults than llama-family models on the same gpu).

a design property with big operational consequences: fallback ladders don't error, they degrade. the canonical case: amd's fast mla attention kernel asserted a head count of 16 or 128. kimi-k2.5 has 12 heads after tensor-parallel sharding. vllm silently fell through to a triton fallback, the model served fine, and it was slow in a way nobody could see from health checks. one fix later, the same model on the same gpus ran 12x more interactively. an engine that looks healthy while slow is worse than one that crashes, because a crash gets a ticket.

### 5.2 what each chip actually resolves to (from source, this week)

| | sm90 (h100/h200) | sm100/103 (b200/b300) | gfx942 (mi300x/325x) | gfx950 (mi355x) |
|---|---|---|---|---|
| vllm attention default | flashattention-3 | flashinfer → nvidia's trtllm-gen cubins | aiter ladder → triton fallbacks | same |
| sglang attention default | fa3 | `trtllm_mha` / `trtllm_mla` | aiter | aiter |
| 4-bit weight gemm (gptq/awq) | machete (pinned to cc 9.0 exactly) | falls to marlin, an ampere-era kernel | triton-class | same |
| fp4 | marlin dequant only | nvfp4 native | dequant only | mxfp4 native |
| fp8 bytes in memory | standard e4m3 | standard e4m3 | fnuz (shimmed, part 2) | standard e4m3 |
| graph capture ceiling | full graphs, mixed batches (fa3) | uniform-batch only (trtllm decode) | uniform-batch only (aiter) | same |
| moe all-to-all | deepep | deepep-blackwell + nvlink variants | mori | mori + dma engines |
| disagg kv transfer | mooncake/nixl | mooncake-nvlink / nixl | none exists | mori-io |

things in this table that i'd never have guessed without reading source:

1. **on b200, the open engines run closed kernels.** vllm's "flashinfer backend" on blackwell is mostly a dispatcher into pre-compiled nvidia binaries (trtllm-gen cubins) downloaded from nvidia's artifact server, pinned by hash, built only for datacenter blackwell. the container needs that download to succeed and needs nvcc present for jit, or you silently get slower attention. hopper's fast kernel is open source; blackwell's is a binary distribution channel.
2. **4-bit weight quantization still lives on hopper.** the fast mixed-input kernels are wgmma code pinned to compute capability 9.0, exactly; nobody has ported them to blackwell's tcgen05, so gptq/awq-class checkpoints on b200 fall back to a kernel designed for a100s. two years into the blackwell era.
3. **graph capture, which is worth up to 7x in min-latency serving, has a per-backend ceiling.** fa3 can capture whole-model graphs over mixed batches; blackwell's trtllm decode kernels and all of amd's aiter backends only capture uniform batches. identical launch flags, different graph behavior per gpu.
4. **page sizes quietly change your prefix cache.** sglang backends snap page sizes (blackwell mla kernels want 64 or 128 tokens per page; hopper fa3 runs page size 1), and the radix prefix cache matches at page granularity. on b200 a prefix hit is a 64-token-aligned event; on h200 it's exact. agentic workloads with long shared prefixes feel this.
5. **and the launch scripts show the philosophy difference.** these are the tuned public ci configs for deepseek-r1 fp8 on 8 gpus, condensed:

```
h200:   sglang --tp 8 --attention-backend flashinfer
        --chunked-prefill-size 32768

b200:   SGL_ENABLE_JIT_DEEPGEMM=false SGLANG_ENABLE_FLASHINFER_GEMM=true
        sglang --tp 8 --attention-backend trtllm_mla --kv-cache-dtype fp8_e4m3
        --moe-runner-backend flashinfer_trtllm --fp8-gemm-backend flashinfer_trtllm

mi300x: sglang --tp 8 --attention-backend aiter --kv-cache-dtype fp8_e4m3
        --chunked-prefill-size 131072 --num-continuous-decode-steps 4

mi355x: SGLANG_USE_AITER=1 ROCM_QUICK_REDUCE_QUANTIZATION=INT4
        sglang --tp 8 --attention-backend aiter --kv-cache-dtype fp8_e4m3
        --chunked-prefill-size 196608 --num-continuous-decode-steps 8
```

nvidia tuning is choosing which vendor kernel family to trust. amd tuning is compensating: prefill chunks four to six times larger to amortize dispatch overhead, multi-step decode to amortize scheduling, all-reduce quantized to int4 to survive the mesh. neither is wrong; they're describing different machines.

### 5.3 tensorrt-llm, and what a moat is made of

```
┌───────────────────────────────────────────────┐
│ ring 1: runtime (apache-2.0, open since 2025) │  schedulers, kv manager, disagg
│  ┌─────────────────────────────────────────┐  │  orchestration: forkable
│  │ ring 2: kernel source (open, cuda-bound)│  │  xqa, fmha, cutlass heuristics:
│  │  ┌───────────────────────────────────┐  │  │  portable in theory only
│  │  │ ring 3: trtllm-gen cubins (closed)│  │  │
│  │  │ per-chip binaries, written by a   │  │  │
│  │  │ team with pre-silicon access      │  │  │
│  │  └───────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

tensorrt-llm stopped being a "compile your model" system in 2025; since 1.0 it is a pytorch-runtime engine whose forward pass calls nvidia's kernel inventory directly. its measured lead over the open engines on identical b200s is now regime-dependent: about 2.15x over sglang at the max-throughput end of single-node deepseek-r1 fp8, shrinking to 3-15% at 100-130 tokens/s/user, and near parity on single-node fp4. the durable advantages concentrate where integration is hardest: disaggregated serving with wide expert parallelism (2-3x class), hopper decode kernels the open engines never fully replicated (up to 3.5x at the throughput end), and speculative decoding depth (including an "accept slightly-wrong draft tokens" knob that trades measured accuracy for speed, which no open engine ships).

the mechanism list for why it wins is public and itemized: shape-tuned pre-compiled kernels, fusion depth (nvidia's own min-latency ladder for deepseek-r1 documents each fusion's contribution, 67 to 368 tokens/s/user), cuda graphs everywhere (their custom moe communication kernels exist specifically to keep dynamic-size transfers inside captured graphs), and rack co-design (the expert load balancer keeps 348 gib of deepseek expert weights in grace cpu memory and restreams hot experts over the 900 gb/s cpu-gpu link without breaking graphs; nothing about that design fits an 8-gpu node, let alone another vendor).

amd's structural answer is an engine called atom: vendor engine on vendor kernels, same shape as trt-llm, measured 1.14-1.8x faster than amd's own sglang path on single-node moe serving, and, per semianalysis, zero known production customers. amd's production answer today is vllm/sglang plus its kernel library (aiter) plus mori, with atom as the velocity vehicle whose wins get folded upstream. the counterweight to the whole moat story: nvidia now ships its best kernels into the open engines through flashinfer, which is exactly why the single-node gap closed through 2026. moats made of kernels erode when you export the kernels; moats made of rack co-design don't.

### 5.4 day-0 expectations, honestly

when a frontier model drops, production-grade serving lands in a predictable order: blackwell and hopper via trt-llm/flashinfer within days (nvidia has, by one boutique founder's estimate, ~4,000 engineers on inference software), mi355x in days-to-weeks when amd co-develops the bring-up (deepseek-r1 and gpt-oss were genuine day-0s; kimi k3 was a day-0 via atom), and mi300x in weeks. the structural reason is boring: upstream vllm ci has zero mi355x machines, so the maintainers literally cannot promise day-0 rocm support regardless of goodwill. and the improvement curve after bring-up is steep on amd when they focus: deepseek-v4 on mi355x improved 110x in 26 days. any amd number from launch week is provisional in both directions.

---

## part 6: what the benchmarks say

### 6.1 the mlperf record, one table

mlperf is the audited, apples-closest-to-apples record. the trajectory in five rounds:

| round | matchup | result |
|---|---|---|
| v4.1 (aug 2024) | 8x mi300x vs 8x h100, llama-2-70b | 23,512 vs 24,323 tok/s offline: parity within 3% |
| v5.0 (apr 2025) | 8x mi325x vs 8x h200, both fp8 | 33,397 vs 34,988: mi325x at 93-95% |
| v5.0 | 8x b200 (nvfp4) enters | 98,858: ~3x both fp8 systems |
| v5.1 (sep 2025) | 8x mi355x (mxfp4, open division) vs 8x b200 (nvfp4, closed) | 92,081 vs 102,725: b200 +12%/gpu, different divisions and fp4 recipes |
| v5.1 | gb300 nvl72 debuts deepseek-r1 | 5,842 tok/s/gpu offline; amd did not submit r1 |
| v6.0 (apr 2026) | 8x mi355x vs 8x b300, llama-2-70b | amd at 92% offline, 93% server, and 104% interactive; first amd million-tok/s cluster row (87 gpus, 1.016m tok/s) |
| v6.0 | nvidia deepseek-r1 records | gb300 nvl72 8,064 tok/s/gpu server; 288-gpu system 1.55m tok/s; amd again absent from r1 |

the through-line: amd reached parity-class on the benchmark it chose (llama-2-70b) within each generation, wins the interactive scenario outright in v6.0, and has never submitted the reasoning-model benchmark where nvidia's rack-scale numbers live. absence from a benchmark is also data.

### 6.2 the win map, from ~8,000 raw rows

semianalysis's inferencex harness sweeps concurrency and traces throughput-versus-interactivity frontiers (tokens/s/gpu against tokens/s/user) for real engines on real hardware, nightly-ish, in public ci. i pulled the latest frontier for every hardware/engine/precision combination across eleven models and scored every cell twice: raw tokens/s/gpu, and dollars per million tokens at semianalysis's ownership rates (mi355x $1.48/gpu-hr, b200 $1.95, b300 $2.34, gb200 $2.21, gb300 $2.65, h200 $1.41).

```
                     interactivity (tok/s/user) →
              <40          40-80         80-130        >130
prefill-heavy amd $/tok    amd $/tok     contested     nvidia
8k in/1k out  (moe)        (fp8 moe)     (stale data)
chat 1k/1k    mixed        nvidia        nvidia        nvidia
decode-heavy  scattered    nvidia        nvidia        nvidia
1k/8k         amd points   1.4-3x        2-7x          only

disagg + wide-ep: nvidia nearly everywhere (2-40x with rack scale pooled);
                  exceptions in 6.3
dense models:     nvidia by default of evidence, except mlperf v6.0
                  interactive (amd 104% of b300)
```

where amd wins, with the numbers:

1. **deepseek-r1 fp8, single node, prefill-heavy: amd wins cost at every interactivity level, 1.13-1.17x** (fresh software both sides). nvidia's throughput lead is a uniform ~1.15x; the $1.48-versus-$1.95 hourly rate flips it. the cleanest like-for-like amd win in the dataset.
2. **minimax-m3: amd wins cost nearly across the board** (1.04-1.35x, fresh both sides), amd's best model in the harness.
3. **kimi-k2.5 aggregated: nvidia's throughput lead (1.08-1.16x) is smaller than the rate gap, so amd wins cost 1.24-1.42x.**
4. **kimi-k3, the single-node-fit story: 8x mi355x beats 16x two-node b200 by 2.05-2.92x per physical gpu** (details and corrections in part 7), and 3-4.8x on cost. then b300 matched the 288gb and beat mi355x on every published k3 point by 1.25-1.75x, leaving amd an ~11% ownership-cost edge. the capacity moat lasted one hardware generation.
5. **mlperf v6.0 llama-70b interactive: 104% of b300**, the one dense-model scenario amd currently wins.

where nvidia wins: everything else, usually 1.3-4x on throughput single-node and 2-40x when disaggregation and rack-scale parts enter. decode-heavy shapes are the starkest: amd loses every blackwell comparison at 1k-in/8k-out, frequently 2-10x, despite bandwidth parity on paper (part 8 explains why).

three structural findings worth more than any single cell:

1. **interactivity is the dominant axis and the crossover is consistent.** every amd cost win shrinks or flips somewhere between 100 and 150 tokens/s/user. above that you are in min-latency territory, where cuda graphs, speculative-decoding depth, and trt-llm fusion dominate, and that stack has no amd equal yet.
2. **prefill-heavy is amd's shape; decode-heavy is amd's graveyard.** counter-intuitive given "decode is memory-bound" and the 8tb/s tie, until you learn the measured bottleneck at low batch is kernel-dispatch chains, not bandwidth (part 8, item 5).
3. **the throughput winner and the cost winner disagree in about 30% of cells, always the same direction: nvidia faster, amd cheaper.** at ownership rates, an nvidia lead under 1.32x versus b200 (1.58x versus b300) is an amd cost win. fix the metric before you argue about the hardware.

one honesty note about the cost column: those are hyperscaler *ownership* rates. rental markets are messier (mid-2026 on-demand medians ran h200 ~$4.4/hr and b200 ~$6.2/hr, while bookable mi355x quotes spanned $2.59 to $8.60 on thin supply), and every viral perf-per-dollar chart is hostage to whichever denominator its author picked. one widely shared kimi-k3 comparison used a $2.50/hr mi355x price that hacker news commenters couldn't find bookable anywhere that week.

---

## part 7: benchmark forensics, or how both vendors' charts are true

this part exists because two claims about the same cell circulated simultaneously in 2026: "mi355x beats b200 on deepseek-r1 disaggregated serving" and "b200's serving stack is 2-3x ahead of amd's." i audited the benchmark's own repository to reconcile them. both are true. the reconciliation is a checklist you can reuse on every future chart.

**check the dates on both sides.** the most-cited amd win compares amd software from may 31, 2026 against nvidia's strongest configuration last run on january 29, 2026. the staleness is structural: the harness re-runs a configuration only when someone submits a change for it, nvidia stopped submitting that config (its engineers moved to newer models and rack-scale hardware), and the maintainers document triaging their gpu hours. against the frozen january baseline, fresh amd leads 1.05-1.30x on throughput and wins cost across the whole band; against nvidia's fresh-but-second-best engine, amd leads 1.15-2.8x; and above ~165 tokens/s/user the frozen nvidia rows still win. which of those three sentences appears on a slide tells you who made the slide.

**check what's enabled on both sides.** the famous "kimi-k3 fits one amd node, needs two nvidia nodes" chart ran speculative decoding on amd only, because nvidia's day-0 configuration couldn't combine speculative decoding with pipeline parallelism (a real engine limitation, fixed via a different parallelism layout 14 days later). corrected from raw ci artifacts with speculation on both sides, amd's lead shrinks from 3.1-3.6x to 2.05-2.92x per physical gpu. still a real win, built on 288gb versus 180gb.

**check the denominator on per-gpu numbers.** the corrected nvidia k3 recipe self-reports 8 gpus in its result files because it counts tensor-parallel ranks and not data-parallel replicas; the deployment is 16 physical gpus. taken at face value it would double nvidia's apparent per-gpu throughput. per-physical-gpu is the only defensible accounting.

**know that speculative-decoding rows are simulated.** the harness pins every vendor's speculative decoding to a committed "golden" acceptance-length curve so runs are comparable, and the k3 draft model's *real* acceptance on 100k-token contexts is far below the pinned value. every published k3 decode number on every vendor overstates production reality by roughly the same factor. comparable, but inflated.

**and know that both sides have shipped broken rows.** the frozen nvidia software generation later showed a numeric-accuracy bug (the only before/after re-run got slower at mid interactivity once it was fixed, so the stale rows were optimistic if anything). amd's may dataset carried an accuracy collapse above concurrency 1024: a kernel bug froze a split parameter at graph capture and gsm8k accuracy fell from 0.953 to 0.0023 inside published benchmark runs, caught weeks later. benchmark rows are software artifacts. they rot, in both directions, and the only defense is accuracy gates riding along with every performance number.

---

## part 8: where theory and measurement disagree

fourteen claims i started this project believing, or seeing argued, each checked against whatever measurement exists. the table is the summary; the prose after covers the five most consequential.

| # | claim | favors | verdict |
|---|---|---|---|
| 1 | fp6 at the fp4 rate (2.2x b200) | amd | paper-only; nothing serves fp6 (part 9) |
| 2 | 288gb dominates long context | amd | untested: no neutral harness runs inputs past 8k tokens |
| 3 | single-node fit for 1.5tb models | amd | confirmed in a neutral harness, then closed by b300 in one generation |
| 4 | chiplet partitioning for multi-tenant | amd | publicly unproven; the entire record is one vendor benchmark of the 2-partition mode |
| 5 | infinity cache accelerates decode | amd | refuted by the only deep measurement |
| 6 | bandwidth parity + 24% cheaper = cost win | amd | holds only in amd's best configs |
| 7 | blackwell wins prefill | nvidia | confirmed 1.5-2.2x, for a reason worth reading below |
| 8 | b300's 2x attention hardware helps long context | nvidia | confirmed once: 1.35x at the kernel, 1.5-1.9x end to end |
| 9 | nvl72 helps dense models | nvidia | refuted: 0.94-1.04x per gpu versus a plain 8-gpu node |
| 10 | nvfp4 accuracy converts to serving wins | nvidia | half-true: accuracy real, throughput opposite, nobody measures quality-adjusted cost |
| 11 | b300 fp4 = 1.67x b200 | nvidia | software lag: 1.1-1.26x at launch, ~1.4-1.5x by spring |
| 12 | cdna4 closed the gemm efficiency gap | cross | half-closed: 47% → 62-64% of peak, versus blackwell's ~86% |
| 13 | 1,400w vs 1,000w throttling decides it | cross | unresolved; evidence points to ~10%-class effects, an order below software effects |
| 14 | quantization hurts speculative decoding | cross | confirmed, three ways, occasionally catastrophically |

**the prefill reversal (7 + 12).** on paper, mi355x's dense fp8 is 12% ahead of b200 (5.03 versus 4.5 petaflops). measured gemm efficiency reverses it: b200 delivers about 86% of its datasheet rate; amd's own engineering blog puts mi355x at 62-64%. cdna4 plus amd's kernel work closed half the cdna3-era gap (47% → 62-64%) and the remaining half happens to cancel amd's paper advantage almost exactly, which is why nvidia wins measured prefill 1.5-2.2x while losing the spec-sheet comparison. a register-resident microbenchmark sustains 97% of peak on mi355x, so the shortfall is data movement and scheduling, not power throttling.

**the infinity cache result (5).** intuition says a 256mb cache next to the memory controllers should help small-batch decode. the only deep instrumentation (an independent kimi-k3 bring-up on mi355x) found batch-1 decode running 12x above the memory-bandwidth floor, bottlenecked on a 2,459-packet-per-token dispatch chain and cache-maintenance operations repeated per chiplet. the weights are 190gb against a 256mb cache; nothing that matters can live in it. the cache is real and helps streaming; the decode story attached to it is folklore.

**nvl72 and dense models (9).** covered in part 4, but it belongs in this list because it is the most expensive way to be wrong in this table: llama-2-70b per-gpu throughput on the full rack computes to 12,072 tokens/s versus 12,841 on a plain 8x b200 node. the rack premium is a wide-expert-parallelism phenomenon. dense serving on nvl72 is buying a stadium to host a dinner party.

**the long-context hole (2 + 8).** amd's capacity advantage should be most visible at 32k-128k context, and no neutral harness measures it; inferencex caps at 8k input. the only published 128k serving comparison is nvidia benchmarking gb300 against gb200 (1.35x at the attention kernel from the doubled sfu, 1.5-1.9x end to end, plus the capacity effect). amd doubled its own transcendental rate in cdna4 and nobody, including amd, has published what that does to attention kernels. this is the single biggest measurement gap in the public record.

**quantization versus speculative decoding (14).** three failure modes, all real: quantized targets shift the token distribution the draft model was trained against (measured 45% acceptance on an nvfp4 quant versus 70% on other quants of the same model); engine-specific bugs on quantized checkpoints can zero acceptance entirely (0.33 in one engine, 0.63 in another, same checkpoint); and the vendor fix is acceptance-relaxation knobs that buy speed with measured accuracy. if you serve quantized with spec decode, eval acceptance rate per quant, per engine.

---

## part 9: fp6, the spec-sheet ghost

fp6 keeps coming up in amd-versus-nvidia threads because amd's datasheet shows a 2.2x advantage, so here is the complete story.

fp6 is not unique to amd. the formats (e2m3, e3m2, and block-scaled mxfp6) come from the ocp microscaling spec of september 2023, which amd and nvidia co-authored alongside arm, intel, meta, microsoft, and qualcomm. blackwell executes fp6 in hardware with full cutlass template support. cdna4 executes it through its matrix instructions. hopper and cdna3 have no fp6 at all.

what is unique to amd is the rate, and it comes from opposite datapath choices:

```
nvidia blackwell:                        amd cdna4:
every element rides an 8-BIT CONTAINER   multiplier datapath sized at 6 BITS
[ fp8 ][ fp8 ][ fp8 ]  same issue rate   fp6, fp4: full rate (16 cycles)
[ fp6_][ fp6_][ fp6_]  2 pad bits each   fp8:      half rate (32 cycles)
→ fp6 rate = fp8 rate (4.5-5 pf)         → fp6 = fp4 = 10.07 pf = 2x fp8
fp4 gets its own packed path (2/byte)      (2.24x b200's paper fp6)
→ fp4 = 2x. there is no packed fp6.
```

nvidia put fp6 in fp8's container and gave the doubling only to a separate packed fp4 path; amd sized the multiplier at 6 bits and made fp8 the type that pays double. fp6 still saves memory on blackwell (stored packed, unpacked on load); it never saves compute there. and the one published measurement claiming b200 fp6 runs faster than fp8 is an accounting artifact: its fp6-to-fp8 ratio is exactly 8/6 in both of the paper's tables, its assumed fp6 peak appears on no nvidia document, and the instruction set makes any fp6 rate above fp8 physically impossible on blackwell.

now the part that answers the question: nothing serves fp6. as of this week, no engine executes a native fp6 matmul on any hardware. vllm loads fp6 checkpoints and dequantizes them to bf16 for compute, even on mi355x. sglang has zero fp6 code. tensorrt-llm's quantization list has no fp6 entry. nvidia's quantization tool cannot produce an fp6 checkpoint. huggingface hosts ten fp6 model repos total, the largest being a two-layer debugging artifact, zero from any vendor (amd's promised fp6 checkpoints from october 2025 never shipped). no mlperf or inferencex configuration has ever run fp6.

why it's dormant: on nvidia, fp6 buys 25% memory over fp8 at zero compute gain while fp4 offers 2x compute below it. on amd, fp6 costs nothing versus fp4 on paper but gains only accuracy, and amd's own data says well-calibrated mxfp4 already retains over 99.5% on flagship evals. six-bit packing is genuinely painful (three bytes per four elements, alignment constraints, a breaking-change repack to match the matrix-instruction layout). and the accuracy niche fp6 was designed for in 2023 got eaten from below by better-scaled 4-bit formats before fp6 hardware existed.

the one live use is elegant: amd's own engineers run mxfp4 *weights* with mxfp6 *activations* on mi355x, which costs 2.8% throughput versus pure mxfp4 and recovered 13.9 gsm8k points on llama-3.1-8b. fp6 where it's free, fp4 where it pays. that trick only works on cdna4, where fp6 keeps the fp4 rate.

and the kicker: amd's mi455x preview puts fp6 back at the fp8 rate. fp6-at-fp4-rate is a single-generation quirk that its own creator is walking away from. when a spec-sheet capability has no software, no checkpoints, and no benchmark after 14 months, it is trivia. interesting trivia. i clearly spent a day on it. but trivia.

---

## part 10: operating the fleets

a condensed version of what changes for the team that actually runs these. (the four-fleet run-book with every flag and failure mode is in my notes; this is the shape of it.)

| dimension | h200 | b200 | mi300x/mi325x | mi355x |
|---|---|---|---|---|
| driver floor | any modern branch | r570+, cuda 12.8+, nvcc in container | amdgpu driver matrix x rocm 6/7 | rocm 7.0 minimum, hard floor |
| images | one image covers the generation | same image as h200 covers sm100 | per-gfx image tags (`-mi30x`) | per-gfx tags (`-mi35x`); running the wrong one is a real mistake the naming exists to prevent |
| quantized checkpoints | native fp8 everywhere | nvidia's nvfp4 repos | amd quark repos + auto-converted (fnuz shim) | amd mxfp4 repos, ocp-native fp8 |
| flag burden | low | medium (backend/graph choices) | high (kernel-library env family + host tuning) | high (+ mesh collectives + partition modes) |
| disagg serving | dynamo, mature | dynamo, best-in-class | does not exist | new, mi355x-only |
| characteristic silent failure | graph-capture stalls | missing-kernel fallbacks ("no kernel image" or quiet slowness) | fnuz/layout corruption: wrong outputs, http 200 | kernel version skew week to week |
| accuracy gating | recommended | recommended | mandatory | mandatory (nightly-image world) |
| multi-tenant | mig, 7 slices | mig, 7 slices | cpx, 8 partitions x 24gb, runtime-switchable | cpx, 8 x 36gb |
| cooling | air, legacy racks fine | air at the edge (~56kw/rack) | air | direct liquid for full clocks; facility decision, not server decision |

the theme: nvidia fleets pin one driver branch per generation and pull public images; amd fleets manage a two-dimensional compatibility matrix (kernel driver x rocm userspace x per-chip image) and compensate with something nvidia fleets don't have: nightly ci with accuracy gates that catches regressions in days. the mi355x world moves fast enough that this is not optional. an on-prem practitioner's summary from the research: "quite capable" when the model fits, and "a ton more ops time." both halves are accurate.

---

## part 11: the decision guide

**h100/h200 wins when:** fp8 is your floor anyway, you want zero enablement risk and the deepest kernel maturity, or you're buying the now-discounted tco tier ($1.30-1.41/hr ownership class). h200 is the minimum clean single-node home for deepseek-r1 fp8 on nvidia.

**b200/gb200 wins when:** fp4 serving (nvfp4 checkpoints + tensorrt-llm is the deepest quantized-serving stack in existence), latency-critical interactive serving (speculative decoding + graphs + fusion), or frontier moe at scale, where the nvl72 rack has no competitor until 2027. skip the rack for dense models; the premium is moe-only.

**mi300x/mi325x wins when:** big dense fp8 models at high batch and relaxed latency, price-sensitive vllm serving, or partitioned multi-tenant fleets (the 8-way runtime partitioning has no nvidia equivalent). accept: no disaggregation, the fnuz shim, and weeks-not-days for new-model support.

**mi355x wins when:** the model barely fits 2.3tb per node, single-node fp8 moe serving below ~130 tokens/s/user scored on cost, or tco-driven fleets with the ops maturity to ride nightly images and accuracy gates. it ties b200 on bandwidth, beats it 1.6x on capacity, and costs 24% less to own; it loses composed disaggregation + wide-ep + fp4, and has no rack-scale answer.

**the five-check reading protocol for any benchmark chart, mine included:**

1. fix the metric: tokens/s/gpu and $/m tokens disagree in a third of real cells.
2. match precision and engine across both sides, or say loudly that they differ.
3. read the run dates on both sides; a quarter-old number is history, not evidence.
4. demand a tokens/s/user operating point; a claim without one cannot be falsified.
5. ask whether the claim is node-scale or rack-scale, and whether the model is moe.

**what to watch from here:** b300 volume (its 288gb + doubled attention hardware neutralizes amd's two best cards), whether mi355x machines land in upstream vllm ci (the structural blocker for amd day-0 support), helios versus vera rubin in 2027 (amd's first rack-scale answer against nvidia's next platform), and whether anyone ever ships an fp6 serving stack (i am not holding my breath).

---

## closing

the meta-lesson from two days and 4.3 million tokens of reading: in this market, hardware announcements are futures contracts, benchmarks are snapshots of software, and the truth has a timestamp. the vendors aren't lying, mostly. they're choosing operating points, engines, precisions, and dates, and the chart that results is true the way a vacation photo is true.

the single most useful artifact i found is the inferencex public api: `https://inferencex.semianalysis.com/api/v1/benchmarks?model=<name>` (add `&date=yyyy-mm-dd` for historical snapshots). it returns the raw rows behind every published chart, with container images, gpu counts, speculative-decoding config, and ci run links per point. every disputed claim in this guide was settled by pulling those rows and reading the dates. argue from the rows.

---

## sources

primary sources this guide rests on, by part: nvidia hopper architecture whitepaper/blog and cuda tuning guides; nvidia blackwell datasheet, blackwell-ultra blog, and the cuda compatibility guide (parts 1-2); amd cdna3 and cdna4 whitepapers, hot chips 2024/2025 decks, and the rocm precision-support docs (parts 1-2); the ocp microscaling spec and nvidia's nvfp4 blog (part 2); model config.json files and vendor datasheets for the memory math (part 3); nvidia nvlink/nvl72 materials, amd infinity fabric docs, deepep and mori repositories, and lmsys's gb200/gb300 posts (part 4); vllm and sglang source at 2026-08-12 commits, tensorrt-llm docs and tech blogs, and the rocm vllm optimization guide (part 5); mlcommons result tables and submitter blogs, the inferencex public api and its github repository including configs and changelog (parts 6-7); semianalysis's mi300x report, inferencemax/inferencex articles, chips and cheese microbenchmarks, tri dao's flashattention posts, and amd's rocm engineering blogs (parts 8-9). independent microbenchmark papers and github issues are cited inline in my research notes, which run to about 24 dossiers with per-fact urls; if you want a specific citation, ask and i'll dig it out.

*sohail mohammad --- august 2026*

*research assembled with claude agents against public sources; all judgments and errors mine. nothing in this piece uses non-public information from any employer, vendor, or customer.*
