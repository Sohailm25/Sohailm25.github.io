# Book + Calculator UI/UX Rework — Design Spec

**Date:** 2026-05-18
**Author:** Sohail Mohammad (with Claude)
**Status:** Approved, awaiting implementation plan
**Repos affected:** `Sohailm25.github.io` (book), `inference-field-guide` (calculator)

---

## 1. Context

The book at `sohailmo.ai/book/` and the calculator at `inference-econ.streamlit.app` are two halves of one argument about loaded cost per accepted result. Today they read as two separate products:

- **Book.** Eight Pelican-output HTML pages (`opener`, `part-0` → `part-5`, `appendix`) each carrying an embedded `<style>` block with ~400 lines of CSS copy-pasted byte-for-byte across all eight files. Palette is sage-green-on-cream (`#83C092` / `#faf9f6`), typography is Inter throughout, zero interactive widgets, h3/h4 nearly indistinguishable, "Where this breaks" / "Decision Rule" beats render as plain h3s. Cross-references in prose ("see Part 2 Chapter 7") are not hyperlinks. Pandoc artifacts present (Part 5 title contains a literal `\n`, mixed straight/curly quotes).
- **Calculator.** A 1650-line Streamlit monolith (`calculator/app.py`) with five core tabs plus eight advanced tabs (thirteen total). Default Streamlit chrome unsuppressed. A 12-instance `font_color="#e8e8e8"` bug renders chart labels invisible on the default light theme. `config.toml` placed in `calculator/` rather than `.streamlit/` so Streamlit's theme loader silently ignores it. Eleven `st.metric` cards across the app create generic-SaaS-dashboard aesthetics. Sidebar carries fourteen sliders.

The reference target is **Modal's *LLM Engineer's Almanac*** ([modal.com/llm-almanac/advisor](https://modal.com/llm-almanac/advisor)). Design lineage: Old Farmer's Almanac → Whole Earth Catalog → Edward Tufte (minimum-ink, sidenotes, sparklines) → Bret Victor / Tangle.js (Mad-libs selectors, direct-manipulation explorables, code-as-output). The book + calculator should sit in the same lineage as one continuous publication.

## 2. Goals

1. Unified visual identity across book + calculator, expressed as one design system with a shared token vocabulary.
2. Anti-slop editorial register. Concretely: no Inter for prose, no card grids, no `st.metric` chrome, no glassmorphism, no shadcn-default surfaces, no purple-indigo accents, no AI-generated illustration, no testimonials, no newsletter-modal CTAs.
3. Heavy embedded interactivity inside book chapters — one live widget per chapter that introduces a derivation. Direct manipulation > form fields.
4. Four-phase rollout, each phase independently shippable. Pauses between phases acceptable.
5. Honest framework alignment: migrate the calculator off Streamlit to Marimo because Streamlit is structurally fighting the design (no inline-editable prose, no custom typography without global CSS hacks, no Mad-libs sentence inputs, `st.columns` shrinks instead of stacking, tab state lost on reload).

## 3. Non-Goals

- Content rewrite. Prose stays as-is in Phase 1; structural edits only (hyperlinking cross-refs, fixing Pandoc artifacts, applying the new component vocabulary).
- Dark mode. Two-color print register only; light is the design.
- Authentication, paywall, newsletter integration, commenting, social-share, or search functionality.
- A mobile app version. Responsive web only.
- A wordmark commission in P1–P3. Title typography is the identity.
- Migration of non-book essays in `content/extra/research/` and `content/extra/writings/` to the new design system. Separate project after this one.

## 4. Decisions

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Scope | Unified publication | Modal Almanac is the reference; book and calculator are two views into one body of work. |
| 2 | Calculator framework | Migrate Streamlit → Marimo | Marimo supports reactive prose cells, inline UI, WASM/static export. `lcpr.py` domain logic ports as-is. |
| 3 | Aesthetic register | Broadsheet foundation + calm body + sidenotes + dingbat dividers | C-broadsheet for chapter openers and calculator surfaces. B-body for running prose. D-sidenotes for evidence + derivation cross-refs. A-ornaments only as section dividers. |
| 4 | Primary ink | Moss `#3A4F2A` | Headlines, rules, mad-libs chips, primary data, ornaments. |
| 5 | Secondary ink | Oxblood `#5C2A1E` | Sidenotes, "Where this breaks" callouts, evidence tags, secondary plot annotations. |
| 6 | Paper | Parchment `#faf5e9` | Page background. Warm cream; not pure white. |
| 7 | Display face | Instrument Serif (Google Fonts) | Italic chapter titles. Stripe Press / NYT Magazine register. |
| 8 | Body face | Newsreader (Google Fonts) | Purpose-built for screen long-form. opsz axis 6–72. |
| 9 | Mono face | JetBrains Mono | Already in use. Tabular numerals applied via `font-variant-numeric: tabular-nums`. |
| 10 | Widget scope | Heavy embedding | One live widget per chapter that introduces a derivation. |
| 11 | Widget delivery | Marimo WASM iframes everywhere | One source of truth: `lcpr.py` drives both the standalone calculator and the inline chapter widgets. Zero numerics drift between book and calculator. Accepts first-iframe-cold-load cost (~5–8MB Pyodide bootstrap, one time per reader, browser-cached after) in exchange for technology unity. Subsequent widget loads ≤ 200KB. |
| 12 | Calculator URL | `sohailmo.ai/book/calculator/` (subdirectory of book) | Reinforces unified-publication framing. |
| 13 | Streamlit URL handling | Static landing page with JS-redirect on `inference-econ.streamlit.app` | Streamlit Cloud does not support true HTTP 301s on its `*.streamlit.app` subdomains. The old URL serves a single HTML page with a `<meta http-equiv="refresh">` + JS `window.location.replace()` + visible "we moved" prose. |
| 14 | Wordmark | None in P1–P3 | Stripe Press style restraint. Reconsider in P4 polish. |
| 15 | Phasing | Four sequential phases, each independently shippable | Visible wins early. Bigger commitments after design system proven. |
| 16 | Marimo views (P2 collapse of 13 Streamlit tabs) | **7 views**: Landing · Compare · Sensitivity · Break-Even · Goodput · Trace-to-Margin · Advanced (collapsible group) | Reverses my earlier draft proposal to merge Goodput + Trace-to-Margin. They share a workflow (loaded-cost verification) but compute different things; merging would conflate performance-economic and finance-reconciliation surfaces. Keep separate. |
| 17 | Footnote/sidenote numbering | Per-chapter restart at 1, monospace superscript | Matches scholarly publication convention. Implemented as a Pelican filter or post-process script. |
| 18 | Mobile breakpoints | `≤ 960px`: sidebar collapses to slide-in (existing behavior retained). `≤ 700px`: sidenotes collapse to inline footnote under originating paragraph. `≤ 600px`: type scale steps down 6%, chapter top-rules stack vertically. | Three breakpoints matches existing book's two; adds the sidenote-collapse breakpoint. |
| 19 | Drop cap rule | First paragraph of each `<article>` whose first character is a letter. Selector: `article > p:first-of-type:not(.no-dropcap)::first-letter`. If first char is non-letter (quote, number), no drop cap is applied — `.no-dropcap` is set by Pandoc filter when first char is non-letter. | Avoids the quote-mark drop cap problem cleanly. |

## 5. Architecture

### 5.1 Book (Pelican static site)

The Pelican site already builds book content from `content/extra/book/` via `EXTRA_PATH_METADATA` mapping (see `pelicanconf.py:35-42`). The new design adds shared CSS to the theme, restructures part page bodies, and ships widget JS as additional static content.

**File operations:**

```
NEW    theme/static/css/book-tokens.css       (~80 lines — :root variables only)
NEW    theme/static/css/book.css              (~600 lines — all component styles)
NEW    theme/templates/book-part.html         (Pelican template extending base.html, referencing the new CSS)

NEW    theme/static/fonts/                    (optional self-host of Instrument Serif + Newsreader + JBMono woff2 — see §7.2)

MODIFY content/extra/book/index.html          (strip embedded <style>, restructure to broadsheet TOC)
MODIFY content/extra/book/opener/index.html   (strip embedded <style>, apply new component markup, hyperlink cross-refs)
MODIFY content/extra/book/part-{0,1,2,3,4,5}/index.html
MODIFY content/extra/book/appendix/index.html (strip embedded <style>, append colophon section)

MODIFY pelicanconf.py                         (ensure theme/static/css/ ships to output)

NEW    scripts/clean_pandoc_artifacts.py      (one-pass cleanup of straight quotes, --, Part 5 title \n)
NEW    scripts/migrate_book_markup.py         (one-pass migration of old structural patterns to new component classes)

P3 (book repo — markup only; widget code lives in calculator/widgets/):
MODIFY content/extra/book/part-1/index.html   (insert <iframe class="book-widget-frame">)
MODIFY content/extra/book/part-2/index.html   (insert 2 iframes — sensitivity, break-even)
MODIFY content/extra/book/part-3/index.html   (insert 2 iframes — cache gate, KV capacity)
MODIFY content/extra/book/part-4/index.html   (insert 1 iframe — goodput)
MODIFY theme/static/css/book.css              (add .book-widget-frame styles, no-JS fallback table styles)
```

**Pelican static path mechanics.** Theme CSS at `theme/static/css/*.css` is bundled by Pelican's theme handler automatically (it ships everything under `theme/static/`). No `STATIC_PATHS` change needed for theme CSS. The widget JS files live under `content/extra/book/widgets/` and are picked up by the existing `EXTRA_PATH_METADATA` walker in `pelicanconf.py` (lines 35-42). No new walker logic required.

**Part page DOM structure (after migration):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/theme/css/book-tokens.css">
  <link rel="stylesheet" href="/theme/css/book.css">
  <!-- font preconnect + Google Fonts URL — see §7.2 -->
</head>
<body>
  <div class="book-progress"></div>           <!-- existing 2px scroll progress -->
  <aside class="book-sidebar">...</aside>     <!-- existing TOC, restyled -->
  <article class="book-part">
    <header class="book-top-rule">            <!-- broadsheet header -->
      <span class="rule-anchor">Pt II · §3</span>
      <span class="rule-title">The Inference Field Guide · MMXXVI</span>
      <span class="rule-page">p. 47</span>
    </header>
    <h1 class="book-h1">The Loaded Cost.</h1>
    <p class="book-deck">What the invoice will actually say…</p>
    <div class="book-prose-grid">             <!-- 1fr + sidenote-col -->
      <div class="book-prose">
        <p class="has-dropcap">Suppose you run <span class="var-chip">500,000</span>…<sup class="book-sup" data-ref="sn-1">1</sup>…</p>
        <!-- mad-libs panel: -->
        <div class="book-madlibs">I want to serve <span class="var-active">…</span></div>
        <!-- where-this-breaks callout: -->
        <div class="book-break">
          <span class="book-break-label">Where this breaks</span>
          <p>At very low quality-gate pass rates…</p>
        </div>
        <div class="book-ornament">❦ &nbsp; ❦ &nbsp; ❦</div>
        <p class="book-verdict-label">Verdict at your volume</p>
        <div class="book-data-row"><span>LCPR · serverless</span><span class="book-data-strong">$0.234</span></div>
      </div>
      <aside class="book-sidenote-col">
        <p class="book-sidenote" id="sn-1"><sup>1</sup>Roughly a SaaS chat workload…</p>
        <div class="book-evidence">
          <span class="book-evidence-label">Evidence</span>
          <span class="book-evidence-tag tag-yes">● Public</span>
          <!-- ... -->
        </div>
      </aside>
    </div>
    <nav class="book-part-nav">...</nav>     <!-- prev/next, restyled -->
  </article>
</body>
</html>
```

### 5.2 Calculator (Marimo migration)

**File operations:**

```
NEW    calculator/marimo_app.py               (new entry point, ~800 lines target)
MODIFY calculator/view_registry.py            (7-view enum + Mad-libs landing definition; PARAM_LABELS dict)
MODIFY calculator/lcpr.py                     (no logic changes)
NEW    calculator/static/marimo-theme.css     (moss/oxblood theme; ~120 lines)
NEW    calculator/static/marimo-fonts/        (Newsreader + JBMono woff2 — only if Marimo can't reach Google Fonts in WASM)

RENAME calculator/app.py → calculator/app.py.LEGACY  (after parity verified)
DELETE calculator/config.toml                 (after parity verified)
DELETE calculator/.streamlit/                 (if exists — confirmed during P2 start)

MODIFY README.md                              (point to new entry point; deprecation note pointing to LEGACY)
```

**Marimo + Pelican coexistence at `sohailmo.ai/book/calculator/`.** Marimo's static WASM export produces a single `index.html` plus a `dist/` JS bundle. Deployment target during P2: **WASM-on-Cloudflare-Pages**, hosted as a separate Cloudflare Pages project whose output is mounted at the `/book/calculator/` path on `sohailmo.ai` via Cloudflare Workers or via the existing GitHub Pages site (preferred — keeps one hosting surface). Concrete approach:

1. Marimo build emits `marimo-build/index.html` + `marimo-build/assets/*` (Marimo's default export structure).
2. A post-build step in `Sohailm25.github.io`'s build pipeline copies `marimo-build/` into the Pelican output at `output/book/calculator/`.
3. GitHub Pages serves the unified output as one site.

This avoids the need for a redirect or cross-origin iframe. The calculator and book ship from the same domain, the same build.

**13 Streamlit tabs → 7 Marimo views (exact mapping):**

| Marimo view | Replaces Streamlit tab(s) | Source lines in current `app.py` |
|---|---|---|
| Landing (Mad-libs) | "Start Here" (replaced, not migrated) | 212–258 |
| Compare | "Compare" | 260–320 (approx — confirm during port) |
| Sensitivity | "Sensitivity" | 322–445 |
| Break-Even | "Break-Even" | 447–600 |
| Goodput | "Goodput" (advanced) | 854–971 |
| Trace-to-Margin | "Trace-to-Margin" (advanced) | 973–1120 |
| Advanced (collapsible) | "Migration", "Cache Gate", "KV Capacity", "RouteFit", "Trace Schema", "Snapshots", "Operations" | 602–852, 1126–1650 |

The Advanced group renders as one Marimo cell with a `mo.ui.tabs` control inside. Six sub-tools, one navigational entry point.

### 5.3 Widget delivery (P3) — Marimo WASM iframes

**Approach: one shared Marimo notebook, embedded six times via iframe with a `widget=` query parameter that selects which cell to render.**

```
calculator/widgets/
  inline_widgets.py         (single Marimo notebook with 6 cells, one per widget)
```

The notebook reads `mo.cli_args().get("widget")` at top-level and conditionally renders only the requested cell. Build emits one WASM bundle at `marimo-build/widgets/`. Each chapter embeds:

```html
<iframe src="/book/calculator/widgets/?widget=lcpr"
        class="book-widget-frame" loading="lazy"
        style="width:100%; aspect-ratio: 4/3; border: 1px solid var(--ink-soft);">
</iframe>
```

**Why one notebook with six cells (not six separate notebooks):**

- One WASM build = one set of cached assets. Reader pays Pyodide cost ~5–8MB ONCE at the first chapter widget encounter; every subsequent widget loads from browser cache (≤ 200KB per iframe).
- Six separate notebooks would duplicate Pyodide setup per build and complicate the deployment pipeline.
- The shared notebook still imports `from calculator.lcpr import compute_*` — same source of truth as the standalone calculator app.

**Visual integration.** Marimo iframe content is DOM-isolated. To match book typography and palette inside the iframe:

- `marimo-theme.css` is loaded inside the iframe via Marimo's `mo.Html()` or by injecting `<link>` at notebook init.
- `iframe` parent applies `border: 1px solid var(--ink-soft)` and sized via `aspect-ratio` to avoid layout shift.
- `loading="lazy"` defers iframe load until scroll-near, reducing first-chapter pain.

**No numerics parity test needed** — Marimo widgets call `compute_*` directly from `lcpr.py`, the same Python the calculator uses. Drift is structurally impossible.

## 6. Component Vocabulary

| Component | CSS class | DOM tag(s) | Color | Notes |
|---|---|---|---|---|
| Broadsheet top rule | `.book-top-rule` | `<header>` with three `<span>` children | Moss border, moss text | 3px top + 1px bottom border, monospace caption strip |
| Body prose | `.book-prose` | `<div>` containing `<p>` | Near-black text, moss accents | Newsreader, ~44ch measure, 1.65 line-height |
| Drop cap | `.has-dropcap` (modifier on first `<p>`) | `<p class="has-dropcap">` → `::first-letter` | Moss | 3-line drop, Instrument Serif italic |
| Sidenote (right rail) | `.book-sidenote` | `<p>` inside `<aside class="book-sidenote-col">` | Oxblood text + border | 2px left border, italic, smaller scale |
| Sidenote anchor | `.book-sup` | `<sup>` with `data-ref` attribute | Oxblood | Numbered per-chapter; clicking scrolls/focuses target |
| "Where this breaks" callout | `.book-break` | `<div>` with `.book-break-label` child + body `<p>` | Oxblood label + 3px border + tinted bg | Distinct from sidenotes — lives in main column |
| Decision rule callout | `.book-decision-rule` | `<div>` with `.book-decision-rule-label` child + body `<p>` | Moss label + 3px moss border | Analog of `.book-break` but for affirmative rules |
| Mad-libs panel | `.book-madlibs` | `<div>` containing prose + `<span class="var-active">` slots | Moss border, moss inverse chips | 3px moss left border, cream-tint bg |
| Variable chip (display) | `.var-chip` | `<span>` | Moss text on cream | 1px moss outline, JetBrains Mono, tabular-nums |
| Variable input (active) | `.var-active` | `<input>` styled as inline, or `<select>` for enum | Parchment on moss | Solid moss bg, inline in prose flow |
| Data row | `.book-data-row` | `<div>` with two `<span>` children | Moss top border, moss strong-value | JetBrains Mono, two-column flex, tabular-nums |
| Data row strong value | `.book-data-strong` | `<span>` inside `.book-data-row` | Moss | Right-aligned, bold |
| Verdict label | `.book-verdict-label` | `<p>` | Moss | Small-caps, JBMono, above data rows |
| Dingbat divider | `.book-ornament` | `<div>` | Moss, 0.7 opacity | Centered `❦ ❦ ❦` with 0.7em letter-spacing |
| Evidence block | `.book-evidence` | `<div>` containing label + tags | Oxblood | Lives in sidenote column |
| Evidence label | `.book-evidence-label` | `<span>` | Oxblood | Small-caps, JBMono |
| Evidence tag | `.book-evidence-tag` + `.tag-yes`/`.tag-no` | `<span>` | Oxblood | Filled (●) for "yes", outlined (○) for "no" |
| Plot canvas | `.book-plot` | `<svg>` or Plotly container | Moss primary series, oxblood secondary | Parchment bg, minimal grid, tabular-nums on axis ticks, units inline in axis labels |
| Sidebar TOC | `.book-sidebar` | `<aside>` | Moss for active | Retains existing scroll-driven IntersectionObserver behavior |
| Part nav (prev/next) | `.book-part-nav` | `<nav>` with two `<a>` children | Moss border, moss text on hover | Restyled from current `.part-nav` |
| Progress bar (existing) | `.book-progress` | `<div>` | Moss | 2px fixed-top, scroll-driven width |

## 7. Design Tokens

### 7.1 Palette tokens (`book-tokens.css`)

```css
:root {
  /* Paper */
  --paper:           #faf5e9;   /* page background */
  --paper-tint:      #f7f1e2;   /* mad-libs panel, sidenote bg if any */

  /* Primary ink — moss */
  --ink:             #3A4F2A;
  --ink-soft:        #a3ad8a;   /* soft borders, subtle outlines */
  --ink-on-paper:    #2a3a1c;   /* slightly darker variant for body emphasis */

  /* Secondary ink — oxblood */
  --brown:           #5C2A1E;
  --brown-soft:      #b39a90;
  --brown-tint:      rgba(92, 42, 30, 0.08);  /* oxblood callout bg */

  /* Text (true black avoided) */
  --text:            #1a1a1a;
  --text-deck:       #4a4a4a;
  --text-mute:       #8a8a8a;
}
```

### 7.2 Typography tokens

**Google Fonts URL (exact):**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
```

Self-hosting via `theme/static/fonts/` is optional but recommended for Lighthouse score; if self-hosted, mirror these axes and use `font-display: swap`.

**Stack tokens:**

```css
:root {
  --font-display: 'Instrument Serif', 'Iowan Old Style', 'Charter', Georgia, serif;
  --font-body:    'Newsreader',       'Iowan Old Style', 'Charter', Georgia, serif;
  --font-mono:    'JetBrains Mono',   'SF Mono', 'Fira Code', monospace;
}
```

**Type scale (rem-based, 16px root = default):**

```css
:root {
  /* Display (Instrument Serif italic) */
  --fs-h1:           2.4rem;     /* 38.4px — chapter title */
  --fs-h1-deck:      1.15rem;    /* 18.4px — italic chapter deck */

  /* Body hierarchy (Newsreader) */
  --fs-h2:           1.55rem;    /* 24.8px — section heading */
  --fs-h3:           1.15rem;    /* 18.4px — subsection */
  --fs-h4:           0.95rem;    /* 15.2px — minor heading; small-caps */
  --fs-body:         1.0625rem;  /* 17px — body prose */
  --fs-prose-large:  1.15rem;    /* 18.4px — opening paragraph, key beats */

  /* Auxiliary */
  --fs-sidenote:     0.82rem;    /* 13.1px — right-margin notes */
  --fs-mono-data:    0.85rem;    /* 13.6px — data rows, var-chip */
  --fs-mono-label:   0.72rem;    /* 11.5px — verdict label, evidence label, top-rule caption */
  --fs-mono-meta:    0.62rem;    /* 9.9px — date strings, page numbers */

  /* Line heights */
  --lh-body:         1.65;
  --lh-display:      1.1;
  --lh-mono:         1.5;
}
```

**Opsz axis usage (Newsreader):**

- Body prose: `font-variation-settings: "opsz" 16;`
- Sidenotes: `font-variation-settings: "opsz" 10;`
- Pull-quote / deck: `font-variation-settings: "opsz" 24;`

**Display face usage rule:**

- `h1` chapter titles: Instrument Serif italic, weight 400, `letter-spacing: -0.005em`.
- `h2` section headings: **Newsreader** (not Instrument Serif) at weight 700 to maintain hierarchy without leaning on display face too much.
- `.book-h1-display` modifier class enables Instrument Serif on landing page hero. Use sparingly.

### 7.3 Spacing scale

```css
:root {
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-5:  1.5rem;
  --space-6:  2rem;
  --space-8:  3rem;
  --space-10: 4rem;

  --measure:        44ch;          /* main column reading width */
  --measure-wide:   58ch;          /* widget panels, calc views */
  --sidenote-col:   180px;         /* fixed sidenote column width */
  --gutter:         1.5rem;        /* between prose and sidenote column */
}
```

### 7.4 Numeric features (apply globally to numeric contexts)

```css
.var-chip, .var-active, .book-data-row, .book-data-strong, .book-evidence-tag,
.book-plot text, .book-mono-data {
  font-variant-numeric: tabular-nums slashed-zero;
}
```

### 7.5 Old → New token migration map

Current book CSS uses different variable names. Migration script must replace, per file:

| Old (in 8 part files) | New (in `book-tokens.css`) | Notes |
|---|---|---|
| `--c-bg: #faf9f6` | `--paper: #faf5e9` | Slightly warmer cream |
| `--c-surface: #ffffff` | (removed) | No white surfaces in new design |
| `--c-text: #1a1a1a` | `--text: #1a1a1a` | Same |
| `--c-text-secondary: #5a5a5a` | `--text-deck: #4a4a4a` | Slightly darker |
| `--c-text-tertiary: #8a8a8a` | `--text-mute: #8a8a8a` | Same |
| `--c-heading: #0f0f0f` | (removed; headings use `--text` or `--ink`) | Display headings near-black; section headings moss |
| `--c-link: #5a8a60` | `--ink: #3A4F2A` (links inherit) | Links are body color + underline; hover toggles to `--brown` |
| `--c-border: #e0ddd6` | `--ink-soft: #a3ad8a` | Borders carry the ink-soft variant |
| `--c-blockquote-border: #A7C080` | `--ink: #3A4F2A` | Blockquotes use primary moss |
| `--c-accent: #83C092` | (removed) | Old sage replaced wholesale by new moss |
| `--font-body: 'Inter', …` | `--font-body: 'Newsreader', …` | **Critical replacement** |
| `--content-max: 700px` | `--measure: 44ch` | Slightly narrower, char-based |

## 8. Phase 1 — Book Visual Rework (ships first)

### 8.1 Scope

1. **CSS extraction.** Read the embedded `<style>` block from `content/extra/book/opener/index.html` (canonical version). Split into `theme/static/css/book-tokens.css` (CSS custom properties only) and `theme/static/css/book.css` (everything else). Apply the §7.5 token migration map.
2. **Pelican template.** Create `theme/templates/book-part.html` extending `theme/templates/base.html`, including the new stylesheets, Google Fonts link, and the DOM scaffold from §5.1.
3. **Strip and migrate part pages.** For each of the eight files in `content/extra/book/`:
   - Delete the embedded `<style>` block entirely.
   - Replace class-less heading h1 with `<h1 class="book-h1">`.
   - Wrap the existing prose body in `<div class="book-prose-grid"><div class="book-prose">…</div><aside class="book-sidenote-col">…</aside></div>`.
   - Add `<header class="book-top-rule">` above the h1 with three `<span>` children (anchor, title, page).
   - Promote first `<p>` of opener and each part to `<p class="has-dropcap">` if it starts with a letter.
   - Replace "Where this breaks" h3-bodied sections with `<div class="book-break">…</div>`.
   - Replace "Decision Rule" h3-bodied sections with `<div class="book-decision-rule">…</div>`.
   - Migrate inline parenthetical asides matching the Evidence Notes pattern into `<aside class="book-sidenote-col">` entries with numbered `<sup>` anchors.
   - Hyperlink every inline cross-reference (regex: `(see |See )?(Part \d+|Chapter \d+|Appendix [A-Z])(, (Chapter|Section) \d+)?` → `<a>`).
4. **Pandoc artifact cleanup** (`scripts/clean_pandoc_artifacts.py`):
   - Replace literal `\n` in titles with space.
   - Convert `"` and `'` to typographic quotes in body prose (skip code/pre).
   - Convert `--` between word characters to `—`.
   - Run as `python scripts/clean_pandoc_artifacts.py content/extra/book/`.
5. **Landing page.** Migrate `content/extra/book/index.html` to broadsheet TOC: top rule, Instrument Serif italic title, ruled `book-data-row` list (no card grid). Eight rows: opener, six parts, appendix.
6. **Colophon.** Append a `<section class="book-colophon">` to `content/extra/book/appendix/index.html` listing typography (Instrument Serif, Newsreader, JetBrains Mono via Google Fonts), palette tokens (with hex), tooling (Pelican, Charter fallback, etc.), and last-updated ISO date.
7. **Tabular-nums.** Add the §7.4 selector block to `book.css`.
8. **Mobile breakpoints.** Implement §4 decision 18 (three breakpoints: 960, 700, 600).

### 8.2 Files affected

| Op | Path |
|---|---|
| NEW | `theme/static/css/book-tokens.css` |
| NEW | `theme/static/css/book.css` |
| NEW | `theme/templates/book-part.html` |
| NEW | `scripts/clean_pandoc_artifacts.py` |
| NEW | `scripts/migrate_book_markup.py` (or hand migration, scripted is preferred for correctness) |
| MOD | `content/extra/book/index.html` |
| MOD | `content/extra/book/opener/index.html` |
| MOD | `content/extra/book/part-{0..5}/index.html` |
| MOD | `content/extra/book/appendix/index.html` |
| MOD | `pelicanconf.py` (no changes anticipated — theme/static is auto-bundled; verify during plan) |

### 8.3 Acceptance criteria (each maps to a verification command in §16)

- A1. All eight book pages render with identical typography, palette, and component vocabulary, sourced from one stylesheet.
- A2. No inline `<style>` block remains in any of the eight part pages.
- A3. No `font-family: 'Inter'` declaration remains in book CSS or HTML.
- A4. Every CROSS-PART inline reference (`Part N`, `Part N, Chapter M`, `Appendix X`) rendered with `<a href>` pointing to the correct slug. Within-part bare "Chapter N" mentions (e.g., "see Chapter 3" inside Part 1) are local navigation aids and remain unlinked until P4 polish adds `id="chapter-N"` anchors to h2 elements. See §4 decision 19 for the chapter-anchor defer.
- A5. No `\n` literal in any `<title>` or h1.
- A6. No `--` between word characters in body prose.
- A7. All eight pages link to the same two stylesheets (`book-tokens.css`, `book.css`).
- A8. Lighthouse desktop (built page): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- A9. Mobile ≤ 700px: sidenotes render as inline footnotes under their originating paragraph (verified manually + via responsive snapshot).
- A10. Print stylesheet still functions: sidenotes collapse to numbered footnotes at end of each section; ornaments and sidebar hidden.
- A11. Colophon section present in appendix with palette hex + font names.

## 9. Phase 2 — Calculator Marimo Migration

### 9.1 Scope

1. Create `calculator/marimo_app.py` as the new entry point. Structure: one Marimo cell per view from §5.2 mapping table.
2. Build the Landing cell first: a Mad-libs sentence with four editable slots (model, workload, token mix, configuration filter). Wire to `calculator.lcpr.LCPRCalculator` and surface the cheapest result as a prose verdict in the next paragraph.
3. Port each remaining view from `calculator/app.py` to its Marimo cell. Domain logic stays in `lcpr.py`, `confidence.py`, `readiness.py`, `permalink.py`. No new compute logic in P2.
4. **Bug fixes:**
   - Replace all 12 instances of `font_color="#e8e8e8"` with `font_color="var(--text)"` or, for Plotly, the hex `#1a1a1a`. Grep `app.py` for `font_color=` to locate.
   - Move `calculator/config.toml` to `.streamlit/config.toml` at project root — but only if continuing Streamlit briefly; otherwise delete entirely.
5. **Mad-libs Landing replaces "Start Here":**
   - Default workload: `saas_chat` profile (`get_profile("saas_chat")` from `workload_profiles.py`).
   - Slots: model (`mo.ui.dropdown`), workload (`mo.ui.dropdown`), token-mix (`mo.ui.text` rendering as inline editable), filter (`mo.ui.dropdown`).
   - Verdict paragraph: "At your volume, **X** is cheapest at LCPR **$Y** vs. **Z** at LCPR **$W**. Break-even to dedicated is at **V** tokens/day."
   - Glossary table from current "Start Here" moves to `mo.accordion("Terminology")`.
6. **`PARAM_LABELS` dict** in `view_registry.py`:
   ```python
   PARAM_LABELS = {
       "retry_rate":            "Retry rate",
       "quality_gate_pass_rate":"Quality gate pass rate",
       "cache_hit_rate":        "Cache hit rate",
       "batch_fraction":        "Batch fraction",
       "monthly_requests":      "Monthly requests",
       "avg_input_tokens":      "Avg input tokens",
       "avg_output_tokens":     "Avg output tokens",
       # extend as needed
   }
   ```
   Used wherever Sensitivity surfaces a parameter selector.
7. **`st.metric` → prose verdict.** Each of the 11 instances becomes a one-sentence prose statement followed by an expandable `mo.accordion("Details")` table.
8. **Plotly theme.** Every chart sets:
   ```python
   fig.update_layout(
       plot_bgcolor="#faf5e9",
       paper_bgcolor="#faf5e9",
       font_family="Newsreader, Iowan Old Style, Charter, Georgia, serif",
       font_color="#1a1a1a",
       xaxis=dict(gridcolor="#e0d8c0", tickcolor="#3A4F2A",
                  tickfont=dict(family="JetBrains Mono", size=11)),
       yaxis=dict(gridcolor="#e0d8c0", tickcolor="#3A4F2A",
                  tickfont=dict(family="JetBrains Mono", size=11)),
   )
   ```
   `DEPLOYMENT_COLORS` updates: closed_api → `#5C2A1E` (oxblood), serverless_open → `#3A4F2A` (moss), dedicated → `#7a8a5a` (moss-light).
9. **Chart caption.** Below each `fig`, render `mo.md(f"Source: provider pricing snapshot {snapshot_date} · {derivation_ref}")` reading from `view_registry.registry_rows`.
10. **Suppress Marimo chrome** via `marimo-theme.css`: hide the "Run" button, edit-mode toggle if any, default footer.
11. **Deployment.** Build Marimo export to `marimo-build/`. Copy to `Sohailm25.github.io/output/book/calculator/` during book build. Ship as part of `sohailmo.ai` deploy.
12. **Streamlit URL announcement.** Replace current Streamlit app on `inference-econ.streamlit.app` with a single-page announcement (HTML in a minimal `app.py`) that renders the new URL prominently + `<meta http-equiv="refresh" content="3; url=https://sohailmo.ai/book/calculator/">` + JS `window.location.replace()`.

### 9.2 Acceptance criteria

- B1. All seven views render with moss/oxblood palette + Newsreader+JBMono typography.
- B2. No invisible chart text. Manual smoke test: each chart at default zoom; all labels readable.
- B3. Landing view: Mad-libs sentence above any tabbed nav. Default profile produces a sensible verdict paragraph.
- B4. Every chart has units in axis labels and source-snapshot caption below.
- B5. Numerics parity test: a workload profile produces the same LCPR (to 4 decimal places) in the Marimo app as in `pytest calculator/tests/`.
- B6. `app.py` renamed to `app.py.LEGACY`. `README.md` deprecation note points to `marimo_app.py`.
- B7. `inference-econ.streamlit.app` serves announcement page; visiting it auto-redirects within 3 seconds.
- B8. Calculator visible at `sohailmo.ai/book/calculator/`; build pipeline confirmed.
- B9. Zero `st.metric` calls remain in `marimo_app.py` (verify by grep).
- B10. Zero `font_color="#e8e8e8"` instances remain anywhere in `calculator/`.

## 10. Phase 3 — Heavy Widget Embedding

### 10.1 Scope

One live widget per chapter that introduces a derivation. Embedded inline in the chapter at the point the derivation is introduced.

| Chapter | Widget | Inputs (`var-active` slots) | Output | `lcpr.py` function called |
|---|---|---|---|---|
| Part 1, Ch 2 | LCPR live formula | retry rate · quality gate · cache hit · batch fraction · monthly requests | Loaded $/result · naive $/result · ratio | `compute_lcpr` |
| Part 2, Ch 3 | Sensitivity sparkline | parameter selector · sweep range (min, max, steps) | LCPR-vs-parameter mini line chart | `compute_lcpr` (iterated) |
| Part 2, Ch 4 | Break-even crossover | daily output tokens · dedicated GPU cost/hr | Crossover volume verdict + small crossover chart | `compute_break_even` |
| Part 3, Ch 5 | Cache gate | TTL · reuse rate · prefix tokens · per-call savings | Min reuses within TTL for cache to break even | `compute_cache_break_even` |
| Part 3, Ch 6 | KV capacity envelope | context length · HBM budget · model size · KV bytes per token | Max concurrent sequences | `compute_kv_sizing` |
| Part 4, Ch 7 | Goodput frontier | latency SLO · quality SLO · request mix · provider | Accepted req/s under SLO + cost per accepted | `compute_goodput` |

### 10.2 Implementation approach

Build `calculator/widgets/inline_widgets.py` as one Marimo notebook with a top-level router cell:

```python
import marimo as mo

# Router: read which widget to show from URL query param
widget_name = mo.cli_args().get("widget", "lcpr")
```

Six conditional cells follow, each gated on `widget_name`:

```python
if widget_name == "lcpr":
    # LCPR live formula widget
    from calculator.lcpr import compute_lcpr, WorkloadProfile
    retry = mo.ui.slider(0, 0.5, value=0.03, step=0.01, label="Retry rate")
    qg    = mo.ui.slider(0.5, 1.0, value=0.95, step=0.01, label="Quality gate")
    # ... layout + call compute_lcpr ...
    mo.md(f"Loaded $/result: **${lcpr:.4f}**")
```

Same pattern for sensitivity, break-even, cache gate, KV capacity, goodput.

**Build pipeline:**

1. `marimo export html-wasm calculator/widgets/inline_widgets.py -o marimo-build/widgets/`
2. Post-build copy: `cp -r marimo-build/widgets/ Sohailm25.github.io/output/book/calculator/widgets/`
3. GitHub Pages serves under `sohailmo.ai/book/calculator/widgets/?widget=<name>`

**Visual integration inside the iframe.** Two options for matching book typography inside the iframe; default plan: inject CSS via Marimo's HTML wrapper at notebook top:

```python
mo.Html("""
  <link rel="stylesheet" href="https://sohailmo.ai/theme/css/book-tokens.css">
  <link rel="stylesheet" href="https://sohailmo.ai/theme/css/marimo-widget.css">
  <link href='https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=JetBrains+Mono:wght@400;600&display=swap' rel='stylesheet'>
""")
```

`theme/static/css/marimo-widget.css` (new file, ~80 lines) styles Marimo's default chrome to match book palette: hides "Run" buttons, restyles input controls to look like `.var-active` chips, applies moss/oxblood palette.

### 10.3 Files

```
NEW    calculator/widgets/inline_widgets.py    (~400 LOC — one Marimo notebook with 6 conditional cells)
NEW    theme/static/css/marimo-widget.css      (~80 LOC — palette + chrome suppression inside iframes)
MODIFY pyproject.toml (calculator repo)         (add `marimo` to deps; pin version)
MODIFY .github/workflows/*.yml                  (add Marimo build step; both repos coordinate)
```

Book repo changes covered in §5.1 P3 block (six `<iframe>` insertions across part 1–4 + iframe styles in `book.css`).

### 10.4 Acceptance criteria

- C1. Each widget renders inline in its chapter at the point the derivation is introduced (not at the chapter end), via `<iframe class="book-widget-frame" src="/book/calculator/widgets/?widget=<name>" loading="lazy">`.
- C2. Initial widget state matches the worked example values in the prose (set as Marimo cell defaults).
- C3. Single source of truth: each widget imports its `compute_*` function directly from `calculator.lcpr` — no separate numerics code, no parity test needed. Verified by `grep -r "from calculator.lcpr import" calculator/widgets/` showing all six widgets import from the same module.
- C4. Chapter HTML weight (excluding iframe runtime) ≤ 100KB per chapter. First-iframe cold-load on the first widget-bearing chapter ≤ 8MB total network transfer (Pyodide + numpy + lcpr stack). Subsequent iframe loads on later chapters ≤ 250KB each (Pyodide cached). Measured via Chrome DevTools Network panel, fast 3G throttle.
- C5. Each widget responds to input within 50ms (Marimo's reactive re-execution latency for arithmetic-only cells; numpy-free `compute_*` functions are fast).
- C6. Sidenotes adjacent to a widget describe the widget's variables.
- C7. Widget degrades without JS: prose paragraph above each iframe explains the derivation; a static `<table class="book-data-row">` shows the canonical worked example. `<noscript>` block inside the iframe-host renders an "interactive widget requires JavaScript; see worked example below" message.
- C8. Mobile ≤ 700px: iframes set `aspect-ratio` so they don't crush; Marimo's mobile responsive layout applies inside.
- C9. `loading="lazy"` is set on every widget iframe — verified by `grep -rE 'class="book-widget-frame"' content/extra/book/ | grep -v 'loading="lazy"'` returning empty.

## 11. Phase 4 — Polish (out of scope this round)

- GT Sectra + Berkeley Mono licensing (~$300 + $40/yr) if book monetization justifies.
- Commissioned wordmark — small hand-drawn or hand-set title mark.
- Per-chapter palette variation — opener slightly cooler, Part 5 slightly warmer.
- Restrained section-divider animation (one-shot fade for `❦` on scroll-into-view).
- Custom Open Graph and Twitter card with broadsheet preview.
- Print PDF export with proper page breaks.
- Author bio rework.

## 12. Open Questions

- **Marimo deployment target.** Default plan: WASM-on-Cloudflare-Pages mounted at `/book/calculator/`. Alternative: Marimo's own hosting. Decide during P2 setup.
- **Marimo + Pelican build sequencing.** Whether to add a Pelican plugin that triggers Marimo build, or run them as separate GitHub Actions steps merging their outputs. Default: separate Actions steps.
- **Footnote-collapse interaction on dense chapters.** If a chapter has 10+ sidenotes clustered together, the mobile-collapse may break flow. Mitigation tested in P1 acceptance; if it breaks, fall back to tap-to-expand.
- **Drop cap quote-edge case.** Resolved (§4 decision 19). Confirmed.

## 13. Risks

- **Marimo migration regresses calculator functionality.** Mitigation: P2 starts with `pytest calculator/tests/` running green; numerics parity asserted by `calculator/tests/test_fixtures.py` against a frozen JSON before and after migration.
- **Marimo WASM cold-load is heavy (~5–8MB on first chapter widget encounter).** Mitigation: `loading="lazy"` defers iframe load until scroll-near; widget iframes do not block initial page render or LCP. Measured budget enforced via CI check (`scripts/check_widget_payload.py`). Acknowledged tradeoff for single-source-of-truth widget delivery.
- **Marimo iframe DOM is isolated from book CSS.** Mitigation: `theme/static/css/marimo-widget.css` injected inside the iframe at notebook init via `mo.Html()`; iframe parent uses `aspect-ratio` to avoid layout shift.
- **Pandoc artifact cleanup script misses cases.** Mitigation: script writes a diff log; manual review of first three migrated chapters.
- **Marimo WASM iframe latency on first widget load.** Mitigation: `loading="lazy"` defers iframe load until scroll-near so it never blocks LCP. First-chapter widget cold-load is acknowledged ~5–8MB; subsequent iframes load from browser cache (≤ 250KB).
- **Cloudflare/GitHub-Pages routing for `/book/calculator/`.** Mitigation: P2 builds locally first, verifies path serves before merging.
- **Self-hosted fonts increase repo size.** Mitigation: only ship subset woff2 (Latin Basic + numerals).

## 14. Success Criteria (rollup across phases)

- S1. Book renders identically across all eight pages from one shared CSS file. No embedded `<style>` blocks.
- S2. Zero `font-family: 'Inter'` declarations anywhere in book or calculator CSS/HTML.
- S3. Calculator: zero Streamlit chrome; Marimo chrome suppressed where applicable.
- S4. All inline cross-references in book prose are hyperlinked anchors.
- S5. Tabular numerals applied to every numeric context.
- S6. Lighthouse desktop: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- S7. All six chapter widgets render as Marimo WASM iframes pointed at `inline_widgets.py`, with `loading="lazy"` and a static worked-example `book-data-row` table as the no-JS fallback.
- S8. Single source of truth: every widget imports its `compute_*` function from `calculator.lcpr` — same Python the calculator app uses. No parity test required (no second implementation to drift from).
- S9. Mobile ≤ 700px: sidenotes collapse to inline footnotes; widgets stack; tables scroll with hint.
- S10. Calculator and book share the same domain (`sohailmo.ai/book/calculator/` reachable from book TOC).
- S11. `inference-econ.streamlit.app` serves announcement-and-redirect page (visit auto-redirects within 3s).
- S12. Visual taste-signal test: a reader on `sohailmo.ai/book/` sees (a) Instrument Serif italic title, (b) top rule with anchor + date + page, (c) monospace data rows for the TOC, with zero card-grid affordances. Opener body uses zero of: "platform", "solution", "powered by", "magic", "unlock".

## 15. Out of Scope

Everything not in §8–§11. Most tempting "not now":

- Chapter content rewriting (any beyond §8 hyperlinking, smart-quote cleanup, component migration).
- Search.
- Comments, social annotation.
- AI-generated illustrations.
- Author about-page rework.
- Migration of `outputs/*` non-book essays to the new design system.

## 16. Verification Commands

These are the exact commands the implementer (or CI) runs to verify each acceptance criterion. Failures are blocking; greens are the only path to "done."

### Phase 1

```bash
# A2 — no inline <style> in part pages
grep -l '<style' content/extra/book/index.html content/extra/book/{opener,part-{0..5},appendix}/index.html
# must return 0 results

# A3 — no Inter references
grep -rE "font-family:.*Inter" theme/static/css/ content/extra/book/
# must return 0 results

# A4 — every cross-reference is hyperlinked (heuristic: no bare "Part N" or "Chapter N" outside <a>)
grep -rnE '(^|[^>])(see |See )?(Part [0-9]|Chapter [0-9]|Appendix [A-Z])([^<]|$)' content/extra/book/ \
  | grep -v 'href' \
  | grep -v '^Binary'
# must return 0 false positives (manual review of any results)

# A5 — no \n literal in titles
grep -rE '<title>[^<]*\\n' content/extra/book/
grep -rE '<h1[^>]*>[^<]*\\n' content/extra/book/
# both must return 0

# A6 — no bare -- in body prose (excluding code/pre)
python scripts/check_no_bare_double_dash.py content/extra/book/
# script must report 0 cases

# A7 — all eight pages link the same two stylesheets
for f in content/extra/book/{index,opener,part-{0..5},appendix}/index.html; do
  grep -c 'book.css\|book-tokens.css' "$f"
done
# must print "2" eight times

# A8 — Lighthouse
npx lighthouse http://localhost:8000/book/part-1/ --only-categories=performance,accessibility,best-practices \
  --output=json --quiet --chrome-flags="--headless" | jq '.categories | to_entries[] | "\(.key): \(.value.score)"'
# performance ≥ 0.90, accessibility ≥ 0.95, best-practices ≥ 0.95
```

### Phase 2

```bash
# B5 — numerics parity
pytest calculator/tests/ -v
# all green

# B6 — legacy renamed
test -f calculator/app.py.LEGACY && ! test -f calculator/app.py
# exit 0

# B9 — no st.metric remaining
grep -n 'st\.metric' calculator/marimo_app.py
# must return 0

# B10 — no invisible chart text
grep -rE 'font_color\s*=\s*"#e8e8e8"' calculator/
# must return 0

# B8 — calculator reachable at unified URL
curl -sI https://sohailmo.ai/book/calculator/ | head -1
# 200 OK
```

### Phase 3

```bash
# C1 — every widget iframe present
grep -rE 'class="book-widget-frame"' content/extra/book/ | wc -l
# must print 6 (one per derivation chapter)

# C3 — single source of truth
grep -E "from calculator.lcpr import" calculator/widgets/inline_widgets.py | wc -l
# must print ≥ 6 (or however many compute_* functions are used)

# C4 — chapter HTML weight (excluding iframe runtime)
for f in output/book/part-{1..4}/index.html; do
  size=$(wc -c < "$f")
  echo "$f: $size bytes"
done
# each must be ≤ 102400 bytes (100KB)

# C4 — Marimo widget bundle weight (cold-load)
curl -s "https://sohailmo.ai/book/calculator/widgets/?widget=lcpr" \
  | grep -oE 'src="[^"]*\.(js|wasm)"' \
  | xargs -I{} curl -sI {} \
  | grep -i "content-length"
# sum must be ≤ 8388608 bytes (8MB)

# C9 — all iframes use loading="lazy"
grep -rE 'class="book-widget-frame"' content/extra/book/ | grep -v 'loading="lazy"'
# must return 0
```

---

## Appendix A — Reference materials

- Modal *LLM Engineer's Almanac*: [advisor](https://modal.com/llm-almanac/advisor) · [quant formats](https://modal.com/llm-almanac/quant-formats/e4::0x38) · [summary](https://modal.com/llm-almanac/summary)
- Tufte CSS (sidenotes): https://edwardtufte.github.io/tufte-css/
- Bret Victor / Tangle.js (Mad-libs explorables): https://worrydream.com/Tangle/
- Stripe Press (typography register): https://press.stripe.com/
- Maggie Appleton (colophon, marginalia): https://maggieappleton.com/
- Marimo (Streamlit alternative): https://marimo.io/features/vs-streamlit-alternative
- Brutalist Web Design principles: https://brutalist-web.design/

## Appendix B — Decision log

| Question | Options considered | Decision |
|---|---|---|
| How deep should this rework go? | Unified / both-but-separate / book-first / calculator-first | **Unified publication** |
| Calculator framework? | Marimo / stay Streamlit / hybrid JS+Streamlit / FastAPI+HTMX | **Marimo** |
| Aesthetic register? | Old Farmer's Almanac / Stripe Press / Broadsheet-FT / Tufte Academic | **Broadsheet foundation + B body + D sidenotes + A ornaments as dividers** |
| Primary ink? | Forest deep / Emerald / Everforest / **Moss** / Pine | **Moss `#3A4F2A`** |
| Secondary ink? | Espresso / Walnut / Cocoa / Sienna / **Oxblood** | **Oxblood `#5C2A1E`** |
| Typography pairing? | Source Serif 4 / IBM Plex / **Instrument + Newsreader** / GT Sectra | **Instrument Serif + Newsreader + JetBrains Mono** |
| Widget embedding scope? | **Heavy** / one showcase / none / book-is-Marimo | **Heavy** |
| Widget delivery? | Vanilla JS (hand-port) / **Marimo WASM iframes** / hybrid | **Marimo WASM iframes everywhere.** One source of truth wins over page-weight optimization. One shared notebook (`inline_widgets.py`) with six conditional cells routed by `?widget=` query param. Accepts ~5–8MB first-iframe cold load in exchange for zero numerics drift. |
| Phasing? | **4 sequential phases** / big bang / book first / calculator first | **4 sequential phases** |
| Marimo views (collapse of 13 tabs)? | 6-view merge (Goodput+Trace-to-Margin) / **7-view split** / keep 13 / collapse to 5 | **7 views: Landing · Compare · Sensitivity · Break-Even · Goodput · Trace-to-Margin · Advanced** |
| Streamlit URL handling? | True 301 / **announcement+redirect page** / domain swap | **Announcement+redirect page (Streamlit Cloud doesn't support true 301s on `*.streamlit.app`)** |
| Sidenote numbering? | **Per-chapter restart** / continuous / sectional | **Per-chapter restart** |
| Mobile breakpoints? | 1 / 2 / **3 breakpoints** | **3: 960 (sidebar), 700 (sidenote), 600 (type scale)** |
| Drop cap edge case? | Apply always / **skip if non-letter first char** / strip leading punctuation | **Skip if non-letter** |
