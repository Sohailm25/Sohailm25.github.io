# Brief — Roll the book's design language out to the rest of sohailmo.ai

**For:** Next agent picking this up
**From:** Sohail (via prior agent that shipped the book + calculator rework)
**Date:** 2026-05-19
**Status:** Briefing — agent should brainstorm → spec → plan → implement

---

## Goal

The book at `sohailmo.ai/book/` and the calculator at `sohailmo.ai/book/calculator/` were just reworked with a unified broadsheet design system (moss + oxblood on parchment, Instrument Serif italic + Newsreader + JetBrains Mono, broadsheet top-rules, dingbat dividers, etc.). They look like one continuous publication.

**The rest of the site (`sohailmo.ai/`, `sohailmo.ai/writings/`, individual essays at `sohailmo.ai/<slug>/`, `/pages/research/`, `/pages/inference-economics/`, `/pages/about/`, the Forge series) still uses the older site CSS** and reads as a different aesthetic family.

The work: **audit those pages, decide what to change, and bring them visually in line with the book** — same palette, same typography, same component vocabulary where it fits. Without rewriting content. Without breaking the inbound links to existing essays.

---

## The design system to apply

All hex values, font stacks, type scale, spacing scale, and component CSS already exist. Reuse, don't reinvent.

### Tokens (canonical source)

- `theme/static/css/book-tokens.css` — the `:root` block. Contains:
  - `--paper: #faf5e9` (parchment)
  - `--ink: #3A4F2A` (moss; primary)
  - `--brown: #5C2A1E` (oxblood; secondary)
  - `--font-display: 'Instrument Serif', …` (italic chapter titles)
  - `--font-body: 'Newsreader', …` (running prose)
  - `--font-mono: 'JetBrains Mono', …` (numerics, ruled labels)
  - Full type scale (`--fs-h1` through `--fs-mono-meta`)
  - Spacing scale (`--space-1` through `--space-10`)

### Component CSS

- `theme/static/css/book.css` — broadsheet top-rule, callouts (.book-break = oxblood "Where this breaks"; .book-decision-rule = moss), drop cap, sidebar TOC, part-nav, sticky sidebar at desktop / slide-in at ≤960px, sidenote rail (scaffold), responsive @media at 960px / 700px / 600px, print stylesheet, legacy-DOM compatibility selectors.

### Spec (rationale + decision log)

- `history/2026-05-18-book-calculator-uiux-design.md` — the full design rationale. Read §3 (non-goals — these still apply: no dark mode, no purple-indigo, no card grids, no bento, no glassmorphism, etc.), §4 (the decision table), §6 (component vocabulary), §7 (tokens).

### Live references

- `https://sohailmo.ai/book/` — landing page (broadsheet TOC, Instrument Serif italic title, monospace data rows)
- `https://sohailmo.ai/book/opener/` — long-form prose page (sticky sidebar with chapter list, two-color callouts, drop cap, prev/next nav)
- `https://sohailmo.ai/book/calculator/` — Marimo-based interactive calculator

---

## What's in scope for THIS rollout

Audit and likely restyle these pages/templates:

| Surface | Template | Notes |
|---|---|---|
| Home (`/`) | `theme/templates/index.html` | Currently uses `style.css` aesthetic. Set the tone for the whole site. |
| Writings archive (`/writings/`) | `theme/templates/archives.html` | List of essays. Should look like a publication's index, not a blog roll. |
| Individual essay (`/<slug>/`) | `theme/templates/article.html` | The bulk of the work. Many essays use this. |
| Long-form essay | `theme/templates/longform_article.html` | Used by Forge and longer pieces — already has slightly different treatment. |
| Inference economics page | `theme/templates/inference-economics.html` | A series landing page. |
| The Forge series page | `theme/templates/theforge.html` | Another series landing. |
| Videos | `theme/templates/videos.html` | If used. |
| About / Research pages | `theme/templates/page.html` | Generic Pelican pages. |

You can confirm what's actually used by inspecting `content/` for markdown frontmatter `Template:` overrides.

---

## What's OUT of scope

- **The book** at `content/extra/book/*` — already shipped. Don't touch.
- **The calculator** at `content/extra/book/calculator/` — already shipped. Don't touch (it's a Marimo WASM build; the source is in the separate `inference-field-guide` repo).
- **Content rewriting.** Don't edit essay prose. Visual layer only. Structural HTML changes (component class renames, wrapper divs) are fine.
- **Dark mode.** Two-color print register only.
- **Search, comments, social-share, newsletter modals.** Out of scope.

---

## The technical setup you'll inherit (read before brainstorming)

### Two stylesheets coexist

- `theme/static/css/style.css` — the OLD site-wide stylesheet. Has `!important` rules on `html`, `body`, `h1–h6`, code blocks, etc. (verified in spec §5.1's legacy-compat audit). This is what makes most of the site look "site-default."
- `theme/static/css/book.css` — the NEW design system. Only loaded by book pages (because book pages bypass Pelican templates via `EXTRA_PATH_METADATA` and reference `book.css` directly).

**You need to decide the integration strategy.** Three options:

**(A) Replace style.css with the new design tokens.**
Cleanest long-term. Requires auditing every selector in style.css to migrate the rules over to use the new tokens + delete the !important. Riskiest because every essay re-renders against new CSS.

**(B) Add the new design tokens to style.css alongside the existing rules.**
Layer the new aesthetic on top. The !important rules still need handling (likely remove them on h1-h6 since the new typography needs to win). Less risky but messier.

**(C) Create a new stylesheet `theme/static/css/site.css`** that's a sibling of book.css, replacing style.css for new/restyled templates. Old templates that haven't been touched continue using style.css.
Lowest risk. Allows incremental migration template-by-template.

My recommendation, brief: **option C** for the initial rollout, then a separate cleanup task to retire style.css once every template is migrated. Avoids one big-bang risk on day one.

### The build + deploy

- Pelican builds via GitHub Actions on push to master (`.github/workflows/pelican.yml`).
- `publishconf.py` has `DELETE_OUTPUT_DIRECTORY = True` — output/ is generated, never committed.
- Templates live in `theme/templates/`. Static assets in `theme/static/`. Both ship to output automatically.
- The book bypasses Pelican templates and is served as raw HTML via `EXTRA_PATH_METADATA` (see `pelicanconf.py:35-42`). Don't apply the same bypass pattern to writings — they SHOULD go through templates.

### CSS gotchas already discovered

- `overflow-x: hidden` on `body` or `html` **breaks `position: sticky`** on descendants. Use `overflow-x: clip` instead. See `book.css` near the `html, body` rule.
- CSS Grid items default to `min-width: auto`. Long content forces overflow. Set `min-width: 0` on grid children.
- `.has-dropcap::first-letter` needs `display: block` on a parent paragraph (it does — `<p>` is block by default).
- `position: sticky` requires no `overflow: hidden`/`scroll`/`auto`/`clip` on any ancestor — except `overflow-x: clip` is safe.

---

## Suggested workflow

Use the `superpowers:brainstorming` skill to walk this out properly. Approximate phases:

### 1. Audit (read-only)

- Visit each live URL in scope (home, writings, 3-5 random essays, inference-economics, the Forge, about/research).
- Inspect the rendered HTML for each.
- Inventory: what selectors are in style.css? What does article.html actually emit? What's the existing DOM vocabulary?
- Note slop signals (Inter typography, generic blog-card layout, default link styling, etc.) — same anti-slop principles as spec §2.

### 2. Brainstorm

- Decide: option A, B, or C above.
- Decide: home page layout — broadsheet (like `/book/`) or something else?
- Decide: writings archive — ruled list of all essays (like `/book/`'s TOC) or grouped by series?
- Decide: individual essay — sticky sidebar (with section anchors)? Drop cap? Where do the broadsheet top-rule + dingbat dividers fit?
- Decide what to defer to a polish phase.

### 3. Spec

Save to `history/2026-05-XX-site-design-rollout-spec.md`. Same structure as `history/2026-05-18-book-calculator-uiux-design.md`. Include a decision table, list of templates affected, integration-strategy choice, and acceptance criteria.

### 4. Plan

Per-template implementation plan. TDD where applicable. Save to `history/2026-05-XX-site-design-rollout-plan.md`.

### 5. Implement

Branch off master: `wip/site-design-rollout`. Commit per task. Push, merge with `--no-ff` per the existing pattern (see master's merge commits `2ffcb26` and the others).

---

## Acceptance criteria (sketch — refine in your spec)

- Home page uses Instrument Serif italic for the site title or hero.
- Writings archive uses moss/oxblood palette, monospace data rows for the essay list, no card grid.
- Individual essay pages match the book's body typography (Newsreader, 88ch column, optional drop cap on opener paragraph).
- No `font-family: 'Inter'` references remain anywhere in `theme/static/css/` except as a fallback in font stacks.
- No purple/indigo accents anywhere.
- Mobile responsive: works on iPhone-SE-width (375px) without horizontal scroll.
- All existing essay URLs still resolve and render. No content lost.
- Lighthouse desktop: Performance ≥90, Accessibility ≥95, Best Practices ≥95 on the home page and a representative essay.

---

## Extra context you'll want

### Mid-execution amendments already recorded

When the book rework executed, four plan defects were caught and fixed:
1. Pandoc smart-quote regex over-matched HTML attributes (smart-quote conversion deferred).
2. The migration script wrapped too much in `<article>` (tightened to wrap `div.main-content` only).
3. The cross-reference hyperlinker injected `<a>` tags inside `<title>` and `<hN>` — visible breakage. Extended skip set.
4. Acceptance criterion A4 was scoped down to "cross-PART references only" because chapter-level `id` anchors don't exist yet.

These are in `history/2026-05-18-phase1-book-visual-rework.md` as amendment blocks. Read them — the same plan-defect categories will likely appear in this rollout (existing CSS will surprise you in similar ways).

### Stubbed items worth knowing about

Inside the book + calculator, these sub-tools currently render as `mo.md("_TODO_")` placeholders:
- Calculator's Advanced view: Migration scoring, RouteFit matrix, Trace Schema reference, Snapshots browser, Operations views (P2-T11.1 through T11.5)

If your work touches the calculator domain, file those follow-ups separately. They're not in scope here.

### Don't forget the calculator repo

The calculator source lives at `/Users/sohailmo/inference-field-guide/`. If you change anything there, run `scripts/build_marimo_to_book.py` to rebuild + redeploy the WASM bundle into `content/extra/book/calculator/` in this repo.

---

## File index for fast onboarding

| Path | Purpose |
|---|---|
| `history/2026-05-18-book-calculator-uiux-design.md` | The design spec — read §4 (decisions), §6 (components), §7 (tokens) |
| `history/2026-05-18-phase1-book-visual-rework.md` | The book rework plan — read the amendments at top of Task 7/9/11.5 |
| `history/2026-05-18-phase1-HANDOFF.md` | Doesn't exist for P1; see Phase 2 handoff: `inference-field-guide/history/2026-05-18-phase2-HANDOFF.md` |
| `theme/static/css/book-tokens.css` | All design tokens |
| `theme/static/css/book.css` | All book component styles + responsive + legacy-DOM compat |
| `theme/static/css/style.css` | The OLD site CSS — the thing you're working around or replacing |
| `theme/templates/` | All Pelican templates |
| `pelicanconf.py` | Build config; line 35-42 = book's EXTRA_PATH_METADATA walker |
| `publishconf.py` | Production overlay; DELETE_OUTPUT_DIRECTORY=True |

---

**Ready to start? Begin with `superpowers:brainstorming` and walk through scope first.**
