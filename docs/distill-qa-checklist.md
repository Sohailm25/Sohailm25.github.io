# Distill Page QA Checklist

Run through every item before publishing or after any edit pass. Check = verified, X = failed (must fix before publish).

---

## Structure

- [ ] Page has `d-front-matter` with title, description, authors, katex config
- [ ] Page has `d-title` with h1 + one-line subtitle paragraph
- [ ] Page has `d-byline` (auto-populated)
- [ ] Page has `div.page-layout` wrapper containing `aside.toc-rail` + `d-article`
- [ ] Section order: Abstract → Why this matters → At a glance → Core sections → Decision relevance → Limitations → References
- [ ] "At a glance" has all 4 subsections: What we did / What we found / What this does NOT show / How to use this
- [ ] "What this does NOT show" section exists and has substantive items
- [ ] References use manual block (not `<d-bibliography>`)

## Desktop Layout (1440px / 1280px)

- [ ] Left rail TOC visible and sticky
- [ ] TOC has comfortable gap from top banner (≥80px from byline bottom to first TOC item)
- [ ] TOC does not overlap article content
- [ ] Title h1 left edge aligns with first article paragraph left edge (delta < 5px)
- [ ] Byline content aligns with article column
- [ ] Sidenotes appear in right margin, not overlapping article text
- [ ] Article max-width ~680px within the grid
- [ ] No horizontal scrollbar at any width ≥1200px

## Mobile Layout (<1200px)

- [ ] TOC appears as inline card (bg-dim background, border, border-radius)
- [ ] Sidenotes hidden by default
- [ ] Sidenote numbers are tappable; tapping reveals sidenote content
- [ ] No content overflow or horizontal scroll
- [ ] Title/byline centered normally (no margin-left offset)

## Header

- [ ] d-title background is transparent (same as page body)
- [ ] d-byline background is transparent
- [ ] Single subtle separator line under byline only (1px, --ef-border)
- [ ] No box/card appearance around header area
- [ ] Published/DOI fields hidden
- [ ] Author name: readable weight (500)
- [ ] Affiliation: smaller (0.85em) and muted (opacity 0.7)

## Typography & Theme

- [ ] All colors match Everforest dark tokens (see style guide)
- [ ] h2: green (#A7C080), bottom border
- [ ] h3: aqua (#83C092)
- [ ] Links: aqua default, green on hover
- [ ] Body text: #d3c6aa
- [ ] Muted text: #859289
- [ ] No harsh boxes or bright backgrounds anywhere

## Content Quality

- [ ] **No em dashes** anywhere in the document
- [ ] **No "Paper A" or "Paper B"** in any visible text
- [ ] **No causal language**: no "predicts", "proves", "confirms mechanism", "validates"
- [ ] Uses approved language: "associated with", "consistent with", "we observe", "this does not establish"
- [ ] Every figure has a decision-relevant caption (descriptive + "if building X..." + constraint)
- [ ] Every table has a caption or heading
- [ ] All locked caveats present and unweakened (check against style guide §10)

## Sidenotes

- [ ] Each sidenote has matching label + checkbox + span
- [ ] IDs are sequential with correct prefix (sn-ev-, sn-ftle-, sn-as-, etc.)
- [ ] No `<d-cite>` tags inside sidenotes (use plain text citations)
- [ ] Sidenote content is ≤2 sentences
- [ ] Sidenote numbers render as superscript aqua numerals on desktop

## Figures & Tables

- [ ] All images load (no broken src paths)
- [ ] Images have `border: 1px solid var(--ef-border)` and `border-radius: 4px`
- [ ] Table headers use bg-dim background
- [ ] Even rows use bg-card background
- [ ] No figures removed from previous versions (unless explicitly approved)

## References

- [ ] Manual references block used (not d-bibliography)
- [ ] All citations in text have corresponding reference entries
- [ ] DOI links are working
- [ ] No `[link]` artifacts from Distill auto-rendering

## Deploy Verification

- [ ] `git diff --stat` shows only expected files changed
- [ ] Commit message describes the change clearly
- [ ] GitHub Actions deploy succeeded
- [ ] Live page loads without console errors
- [ ] Cache-busted verification (append `?v=N` to URL)
- [ ] Checked at 1280px, 1440px, and mobile (375px) viewports
