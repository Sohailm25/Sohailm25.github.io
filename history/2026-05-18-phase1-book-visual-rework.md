# Phase 1 — Book Visual Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the unified-publication design (moss + oxblood on parchment, broadsheet typography, sidenotes, anti-slop component vocabulary) to all 9 book pages, sourced from a single shared stylesheet. Calculator migration and inline widgets come in Phase 2 and 3 — out of scope here.

**Architecture:** Extract the embedded `<style>` block (copy-pasted 8× across part files) into `theme/static/css/book-tokens.css` + `theme/static/css/book.css`. Add Pelican template `theme/templates/book-part.html`. Write two Python scripts (Pandoc artifact cleanup + structural markup migration) under TDD. Apply scripts to all 9 book pages. Hand-author the broadsheet landing page and the appendix colophon. Verify with the §16 grep/Lighthouse commands from the spec.

**Tech Stack:** Pelican (static site generator), Python 3.14 (`scripts/` + tests), `beautifulsoup4` (HTML manipulation), `pytest` (test runner), `lighthouse` CLI (web perf audit). No new runtime dependencies in the site itself — typography loads from Google Fonts CDN (or self-hosted woff2 if Lighthouse demands).

**Spec reference:** `history/2026-05-18-book-calculator-uiux-design.md` (commit `3274afa`). Sections referenced below.

---

## File Structure

```
NEW    theme/static/css/book-tokens.css          (~80 LOC — CSS custom properties from spec §7)
NEW    theme/static/css/book.css                 (~600 LOC — component styles from spec §6 + §7.4)
NEW    theme/templates/book-part.html            (Pelican template — extends base.html)
NEW    scripts/__init__.py
NEW    scripts/clean_pandoc_artifacts.py         (one-pass cleanup of \n in titles, straight quotes, bare --)
NEW    scripts/migrate_book_markup.py            (strip <style>, restructure DOM, hyperlink cross-refs)
NEW    tests/__init__.py
NEW    tests/conftest.py                         (pytest fixtures: sample HTML strings)
NEW    tests/test_clean_pandoc_artifacts.py
NEW    tests/test_migrate_book_markup.py
NEW    pyproject.toml                            (declare pytest + bs4 dependencies)

MODIFY content/extra/book/index.html             (hand-author broadsheet TOC; do NOT run migration script on this file)
MODIFY content/extra/book/opener/index.html      (apply both scripts)
MODIFY content/extra/book/part-0/index.html      (apply both scripts)
MODIFY content/extra/book/part-1/index.html      (apply both scripts)
MODIFY content/extra/book/part-2/index.html      (apply both scripts)
MODIFY content/extra/book/part-3/index.html      (apply both scripts)
MODIFY content/extra/book/part-4/index.html      (apply both scripts)
MODIFY content/extra/book/part-5/index.html      (apply both scripts)
MODIFY content/extra/book/appendix/index.html    (apply both scripts + hand-author colophon section)

UNCHANGED (verified during Task 14): pelicanconf.py — theme/static/css/ is auto-bundled.
```

Pages handled by `migrate_book_markup.py`: 8 (opener, part-0..5, appendix).
Pages hand-authored: 1 (landing `index.html` — the broadsheet TOC is too divergent from the part pattern to script).

---

## Task 1: Set up Python environment + dependencies

**Files:**
- Create: `pyproject.toml`
- Create: `tests/__init__.py`
- Create: `tests/conftest.py`
- Create: `scripts/__init__.py`

- [ ] **Step 1: Create `pyproject.toml`**

```toml
[project]
name = "sohailm25-github-io-tools"
version = "0.1.0"
description = "Build-time tools for the book + writings site."
requires-python = ">=3.11"
dependencies = [
    "beautifulsoup4>=4.12",
    "lxml>=5.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 2: Create empty package files**

```bash
touch scripts/__init__.py tests/__init__.py
```

- [ ] **Step 3: Create `tests/conftest.py` with shared fixtures**

```python
# ABOUTME: pytest fixtures shared across migration script tests.
# ABOUTME: Provides sample HTML strings matching the book's structural patterns.

import pytest


@pytest.fixture
def canonical_part_html():
    """Minimal HTML matching the structural pattern of every part page."""
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Part 1: The Field Problem</title>
  <style>
    :root { --c-bg: #faf9f6; --c-text: #1a1a1a; }
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  <h1>The Field Problem</h1>
  <p>First sentence with a "quoted phrase" and an em -- dash.</p>
  <h3>Where This Breaks</h3>
  <p>At very low quality-gate pass rates.</p>
  <h3>Decision Rule</h3>
  <p>Pick serverless when monthly tokens stay below 42M/d.</p>
  <p>See Part 2, Chapter 3 for the derivation.</p>
</body>
</html>"""


@pytest.fixture
def canonical_part_html_with_newline_title():
    """The Part 5 case — title containing a literal \\n artifact."""
    return """<!DOCTYPE html>
<html><head><title>Part 5: Operating The
Decision</title></head><body><h1>Operating The
Decision</h1></body></html>"""
```

- [ ] **Step 4: Install dependencies + confirm pytest runs**

```bash
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/pytest --collect-only -q
```

Expected: `0 tests collected` (no tests yet) without errors.

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml scripts/__init__.py tests/__init__.py tests/conftest.py
git commit -m "build(scripts): scaffold pyproject + tests dir for book tooling"
```

---

## Task 2: Create `book-tokens.css`

**Files:**
- Create: `theme/static/css/book-tokens.css`

- [ ] **Step 1: Write the tokens file with the exact palette + type tokens from spec §7.1, §7.2, §7.3, §7.4**

Create `theme/static/css/book-tokens.css`:

```css
/* ABOUTME: Design tokens for the Production Inference Economics book.
   ABOUTME: Palette, typography, spacing. Single source of truth — see spec §7. */

:root {
  /* Paper */
  --paper:           #faf5e9;
  --paper-tint:      #f7f1e2;

  /* Primary ink — moss */
  --ink:             #3A4F2A;
  --ink-soft:        #a3ad8a;
  --ink-on-paper:    #2a3a1c;

  /* Secondary ink — oxblood */
  --brown:           #5C2A1E;
  --brown-soft:      #b39a90;
  --brown-tint:      rgba(92, 42, 30, 0.08);

  /* Text */
  --text:            #1a1a1a;
  --text-deck:       #4a4a4a;
  --text-mute:       #8a8a8a;

  /* Font stacks */
  --font-display: 'Instrument Serif', 'Iowan Old Style', 'Charter', Georgia, serif;
  --font-body:    'Newsreader',       'Iowan Old Style', 'Charter', Georgia, serif;
  --font-mono:    'JetBrains Mono',   'SF Mono', 'Fira Code', monospace;

  /* Type scale */
  --fs-h1:           2.4rem;
  --fs-h1-deck:      1.15rem;
  --fs-h2:           1.55rem;
  --fs-h3:           1.15rem;
  --fs-h4:           0.95rem;
  --fs-body:         1.0625rem;
  --fs-prose-large:  1.15rem;
  --fs-sidenote:     0.82rem;
  --fs-mono-data:    0.85rem;
  --fs-mono-label:   0.72rem;
  --fs-mono-meta:    0.62rem;

  /* Line heights */
  --lh-body:         1.65;
  --lh-display:      1.1;
  --lh-mono:         1.5;

  /* Spacing */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-5:  1.5rem;
  --space-6:  2rem;
  --space-8:  3rem;
  --space-10: 4rem;

  /* Layout */
  --measure:        44ch;
  --measure-wide:   58ch;
  --sidenote-col:   180px;
  --gutter:         1.5rem;
}
```

- [ ] **Step 2: Verify file matches spec § token block exactly**

```bash
wc -l theme/static/css/book-tokens.css
```

Expected: file exists, ~70 lines.

- [ ] **Step 3: Commit**

```bash
git add theme/static/css/book-tokens.css
git commit -m "feat(book-css): add book-tokens.css with moss+oxblood palette"
```

---

## Task 3: Create `book.css` with component styles

**Files:**
- Create: `theme/static/css/book.css`

This is the largest manual file. Build it in three commits: base layout + typography, components, responsive.

- [ ] **Step 1: Write base layout + typography section**

Create `theme/static/css/book.css` starting with:

```css
/* ABOUTME: Component styles for the Production Inference Economics book.
   ABOUTME: Loads after book-tokens.css. Component vocabulary per spec §6. */

/* ── Reset ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 16.5px;
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  scrollbar-gutter: stable;
}

body {
  font-family: var(--font-body);
  color: var(--text);
  background: var(--paper);
  line-height: var(--lh-body);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Links ─────────────────────────────────────── */
a {
  color: var(--text);
  text-decoration: underline;
  text-decoration-color: var(--ink-soft);
  text-underline-offset: 0.18em;
  transition: color 0.15s, text-decoration-color 0.15s;
}
a:hover {
  color: var(--brown);
  text-decoration-color: var(--brown);
}

/* ── Typography ────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-body);
  color: var(--text);
  line-height: var(--lh-display);
  letter-spacing: -0.015em;
  font-weight: 700;
}

.book-h1 {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: var(--fs-h1);
  letter-spacing: -0.005em;
  margin-bottom: var(--space-2);
}

.book-h1-display {
  /* used on landing page only — see spec §7.2 display face usage rule */
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
}

h2 { font-size: var(--fs-h2); margin-top: var(--space-6); margin-bottom: var(--space-3); color: var(--ink); }
h3 { font-size: var(--fs-h3); margin-top: var(--space-5); margin-bottom: var(--space-2); color: var(--ink); }
h4 { font-size: var(--fs-h4); margin-top: var(--space-4); margin-bottom: var(--space-2); color: var(--ink); text-transform: uppercase; letter-spacing: 0.08em; font-family: var(--font-mono); }

p { margin-bottom: var(--space-4); max-width: var(--measure); }
strong { font-weight: 600; }

/* Opsz axis for Newsreader */
.book-prose p { font-variation-settings: "opsz" 16; }
.book-sidenote { font-variation-settings: "opsz" 10; }
.book-deck { font-variation-settings: "opsz" 24; font-style: italic; font-size: var(--fs-h1-deck); color: var(--text-deck); max-width: 50ch; margin-bottom: var(--space-5); }
```

- [ ] **Step 2: Append component styles section**

Continue appending to `theme/static/css/book.css`:

```css
/* ── Broadsheet top rule ──────────────────────── */
.book-top-rule {
  border-top: 3px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  padding: var(--space-2) 0;
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink);
  font-weight: 700;
  margin-bottom: var(--space-5);
}

/* ── Prose grid: main column + sidenote column ── */
.book-prose-grid {
  display: grid;
  grid-template-columns: 1fr var(--sidenote-col);
  gap: var(--gutter);
  align-items: start;
}

.book-prose { font-family: var(--font-body); }
.book-prose p { font-size: var(--fs-body); margin-bottom: var(--space-4); max-width: var(--measure); }

/* ── Drop cap ─────────────────────────────────── */
.book-prose p.has-dropcap::first-letter {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  float: left;
  font-size: 3.6rem;
  line-height: 0.85;
  padding-right: 0.08em;
  padding-top: 0.05em;
  color: var(--ink);
}

/* ── Sidenotes ────────────────────────────────── */
.book-sidenote-col { padding-top: var(--space-1); }
.book-sidenote {
  font-family: var(--font-body);
  font-style: italic;
  font-size: var(--fs-sidenote);
  color: var(--brown);
  line-height: 1.55;
  padding-left: var(--space-3);
  border-left: 2px solid var(--brown-soft);
  margin-bottom: var(--space-4);
}
.book-sidenote code {
  font-family: var(--font-mono);
  background: var(--brown-tint);
  color: var(--brown);
  padding: 0 0.18em;
  border-radius: 2px;
  font-style: normal;
}
.book-sup, sup.book-sup {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  vertical-align: super;
  font-weight: 700;
  color: var(--brown);
  text-decoration: none;
}

/* ── "Where this breaks" callout (oxblood) ────── */
.book-break {
  background: var(--brown-tint);
  border-left: 3px solid var(--brown);
  padding: var(--space-3) var(--space-4);
  margin: var(--space-4) 0;
  font-style: italic;
}
.book-break-label {
  display: block;
  font-family: var(--font-mono);
  font-style: normal;
  font-size: var(--fs-mono-label);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--brown);
  font-weight: 700;
  margin-bottom: var(--space-1);
}

/* ── Decision rule callout (moss) ─────────────── */
.book-decision-rule {
  background: rgba(58, 79, 42, 0.06);
  border-left: 3px solid var(--ink);
  padding: var(--space-3) var(--space-4);
  margin: var(--space-4) 0;
}
.book-decision-rule-label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-label);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink);
  font-weight: 700;
  margin-bottom: var(--space-1);
}

/* ── Mad-libs panel ───────────────────────────── */
.book-madlibs {
  background: var(--paper-tint);
  border-left: 3px solid var(--ink);
  padding: var(--space-3) var(--space-4);
  margin: var(--space-4) 0;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: 1.7;
}

/* ── Variable chips ───────────────────────────── */
.var-chip {
  font-family: var(--font-mono);
  font-style: normal;
  background: var(--paper);
  color: var(--ink);
  padding: 1px 5px;
  border: 1px solid var(--ink-soft);
  border-radius: 2px;
  font-size: var(--fs-mono-data);
  font-weight: 600;
}
.var-active {
  font-family: var(--font-mono);
  font-style: normal;
  background: var(--ink);
  color: var(--paper);
  padding: 1px 5px;
  border-radius: 2px;
  font-size: var(--fs-mono-data);
  font-weight: 500;
}

/* ── Data row ─────────────────────────────────── */
.book-data-row {
  border-top: 1px solid var(--ink);
  padding: var(--space-2) 0;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  display: grid;
  grid-template-columns: 1fr auto;
}
.book-data-row:last-of-type { border-bottom: 1px solid var(--ink); }
.book-data-strong { font-weight: 700; color: var(--ink); }

.book-verdict-label {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-label);
  color: var(--ink);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: var(--space-4);
  margin-bottom: var(--space-1);
}

/* ── Ornament ─────────────────────────────────── */
.book-ornament {
  text-align: center;
  color: var(--ink);
  letter-spacing: 0.7em;
  margin: var(--space-5) 0;
  font-size: var(--fs-mono-data);
  opacity: 0.7;
}

/* ── Evidence block ───────────────────────────── */
.book-evidence {
  margin-top: var(--space-5);
  padding-left: var(--space-3);
  border-left: 2px solid var(--brown-soft);
}
.book-evidence-label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-label);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--brown);
  font-weight: 700;
  margin-bottom: var(--space-1);
}
.book-evidence-tag {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  color: var(--brown);
  line-height: 1.7;
}

/* ── Tabular numerics (apply globally to numeric contexts) ── */
.var-chip, .var-active, .book-data-row, .book-data-strong, .book-evidence-tag,
.book-plot text, .book-mono-data {
  font-variant-numeric: tabular-nums slashed-zero;
}

/* ── Code blocks (preserve from existing) ──────── */
code {
  font-family: var(--font-mono);
  font-size: 0.87em;
  background: var(--paper-tint);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}
pre {
  background: var(--paper-tint);
  border: 1px solid var(--ink-soft);
  border-radius: 8px;
  padding: var(--space-4) var(--space-5);
  overflow-x: auto;
  margin-bottom: var(--space-5);
  line-height: 1.55;
}
pre code { background: none; padding: 0; font-size: 0.85rem; }

/* ── Blockquote ────────────────────────────────── */
blockquote {
  border-left: 3px solid var(--ink);
  background: rgba(58, 79, 42, 0.04);
  padding: var(--space-3) var(--space-4);
  margin: var(--space-4) 0;
  font-style: italic;
  color: var(--text-deck);
}

/* ── Tables (data; not the book-data-row component) ─ */
table { border-collapse: collapse; width: 100%; margin: var(--space-4) 0; font-size: 0.92rem; }
th, td { padding: var(--space-2) var(--space-3); text-align: left; border-bottom: 1px solid var(--ink-soft); }
th { font-family: var(--font-mono); font-size: var(--fs-mono-label); text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink); background: var(--paper-tint); }
tbody tr:hover { background: rgba(58, 79, 42, 0.03); }

/* ── HR as section ornament (keep existing convention) ── */
hr { border: none; height: 1px; background: var(--ink-soft); max-width: 40%; margin: var(--space-6) auto; }

/* ── Part navigation (prev/next) ──────────────── */
.book-part-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-8);
  padding-top: var(--space-4);
  border-top: 1px solid var(--ink-soft);
}
.book-part-nav a {
  display: block;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--ink-soft);
  border-radius: 4px;
  text-decoration: none;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
}
.book-part-nav a:hover { border-color: var(--ink); background: rgba(58, 79, 42, 0.04); }

/* ── Sidebar (existing TOC) ────────────────────── */
.book-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  padding: var(--space-6) var(--space-4);
  background: var(--paper-tint);
  border-right: 1px solid var(--ink-soft);
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
}
.book-sidebar a { display: block; padding: var(--space-1) 0; color: var(--text-deck); text-decoration: none; }
.book-sidebar a.active { color: var(--ink); font-weight: 700; }

/* ── Reading progress bar (existing) ──────────── */
.book-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  background: var(--ink);
  z-index: 100;
  transition: width 50ms linear;
}

/* ── Article shell (offset for sidebar) ───────── */
.book-part {
  max-width: calc(var(--measure) + var(--sidenote-col) + var(--gutter) + var(--space-8));
  margin-left: calc(280px + var(--space-8));
  margin-right: var(--space-6);
  padding-top: var(--space-5);
  padding-bottom: var(--space-10);
}

/* ── Colophon ─────────────────────────────────── */
.book-colophon {
  margin-top: var(--space-10);
  padding-top: var(--space-6);
  border-top: 1px solid var(--ink-soft);
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  color: var(--text-deck);
  line-height: 1.7;
}
.book-colophon dt { color: var(--ink); font-weight: 700; }
.book-colophon dd { margin-left: 0; margin-bottom: var(--space-2); }
```

- [ ] **Step 3: Append responsive section (3 breakpoints per spec §4 decision 18)**

Continue appending:

```css
/* ── Responsive: 3 breakpoints (spec §4 decision 18) ── */

/* ≤ 960px — sidebar slides off-screen */
@media (max-width: 960px) {
  .book-sidebar {
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 90;
  }
  .book-sidebar.is-open { transform: translateX(0); }
  .book-part {
    margin-left: var(--space-4);
    margin-right: var(--space-4);
  }
}

/* ≤ 700px — sidenotes collapse to inline footnotes */
@media (max-width: 700px) {
  .book-prose-grid {
    display: block;
  }
  .book-sidenote-col {
    margin-top: var(--space-3);
  }
  .book-sidenote {
    display: block;
    margin: var(--space-3) 0;
    padding: var(--space-2) var(--space-3);
    border-left: 2px solid var(--brown-soft);
    background: var(--brown-tint);
  }
}

/* ≤ 600px — type scale steps down 6%; chapter top-rules stack vertically */
@media (max-width: 600px) {
  html { font-size: 15.5px; }
  .book-h1 { font-size: 2.0rem; }
  .book-top-rule {
    flex-direction: column;
    gap: var(--space-1);
    text-align: center;
  }
  .book-part-nav { grid-template-columns: 1fr; }
}

/* ── Print stylesheet (preserve from existing) ── */
@media print {
  .book-sidebar, .book-progress, .book-part-nav { display: none; }
  .book-part { margin: 0; max-width: none; }
  .book-prose-grid { display: block; }
  .book-sidenote {
    display: block;
    margin: 0.5em 0;
    border-left: none;
    color: var(--text);
    font-size: 0.9em;
  }
  .book-ornament { color: var(--text); }
  body { font-size: 11pt; line-height: 1.45; }
}
```

- [ ] **Step 4: Verify file is well-formed CSS**

```bash
wc -l theme/static/css/book.css
```

Expected: ~360 lines, file exists.

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/book.css
git commit -m "feat(book-css): add book.css with broadsheet components + responsive"
```

---

## Task 4: Create Pelican `book-part.html` template

**Files:**
- Create: `theme/templates/book-part.html`

Pelican templates extend `base.html`. The book part pages already exist as fully self-contained HTML files in `content/extra/book/*/index.html` and are mapped via `EXTRA_PATH_METADATA` — Pelican does NOT process them through templates. So `book-part.html` is reserved for future use (if you later choose to author parts as Markdown), but for now it serves as a reference scaffold the part HTML files should match.

- [ ] **Step 1: Inspect `theme/templates/base.html` for block names**

```bash
head -40 theme/templates/base.html
```

Note the `{% block title %}`, `{% block content %}`, etc. block names you'll override.

- [ ] **Step 2: Create `theme/templates/book-part.html`**

```html
{% extends "base.html" %}

{% block title %}{{ page.title }} — The Inference Field Guide{% endblock %}

{% block extra_head %}
  <link rel="stylesheet" href="{{ SITEURL }}/theme/css/book-tokens.css">
  <link rel="stylesheet" href="{{ SITEURL }}/theme/css/book.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
{% endblock %}

{% block content %}
  <div class="book-progress"></div>
  <aside class="book-sidebar"></aside>
  <article class="book-part">
    <header class="book-top-rule">
      <span class="rule-anchor">{{ page.book_anchor }}</span>
      <span class="rule-title">The Inference Field Guide · MMXXVI</span>
      <span class="rule-page">{{ page.book_page }}</span>
    </header>
    <h1 class="book-h1">{{ page.title }}</h1>
    {% if page.deck %}<p class="book-deck">{{ page.deck }}</p>{% endif %}
    <div class="book-prose-grid">
      <div class="book-prose">{{ page.content }}</div>
      <aside class="book-sidenote-col"></aside>
    </div>
  </article>
{% endblock %}
```

- [ ] **Step 3: Verify the template parses (Pelican syntax check)**

```bash
.venv/bin/pelican --listen --port 8888 content -o /tmp/pelican-check-output 2>&1 | head -20 || true
# Look for any "TemplateSyntaxError" in output. If none, template is OK.
```

If Pelican isn't installed: `pip install pelican` first, or skip this step and verify in Task 14.

- [ ] **Step 4: Commit**

```bash
git add theme/templates/book-part.html
git commit -m "feat(book): add Pelican book-part.html template (reference scaffold)"
```

---

## Task 5: Write `clean_pandoc_artifacts.py` — RED (failing tests)

**Files:**
- Create: `tests/test_clean_pandoc_artifacts.py`

- [ ] **Step 1: Write the test file**

```python
# ABOUTME: Tests for the Pandoc artifact cleanup script.
# ABOUTME: Verifies title \\n removal, smart-quote conversion, em-dash conversion.

from scripts.clean_pandoc_artifacts import (
    fix_title_newlines,
    smarten_quotes,
    convert_double_dashes,
    clean_html_string,
)


def test_fix_title_newlines_in_title_tag():
    html = "<title>Part 5: Operating The\nDecision</title>"
    assert fix_title_newlines(html) == "<title>Part 5: Operating The Decision</title>"


def test_fix_title_newlines_in_h1():
    html = "<h1>Operating The\nDecision</h1>"
    assert fix_title_newlines(html) == "<h1>Operating The Decision</h1>"


def test_fix_title_newlines_preserves_pre_blocks():
    """\\n inside <pre> is content, not artifact — must be left alone."""
    html = "<pre>line one\nline two</pre>"
    assert fix_title_newlines(html) == html


def test_smarten_quotes_basic():
    html = "<p>He said \"hello\" to me.</p>"
    assert smarten_quotes(html) == "<p>He said “hello” to me.</p>"


def test_smarten_quotes_apostrophe():
    html = "<p>It's working.</p>"
    assert smarten_quotes(html) == "<p>It’s working.</p>"


def test_smarten_quotes_preserves_code():
    """Quotes inside <code> must remain straight."""
    html = '<p>Use <code>"hello"</code> in JSON.</p>'
    out = smarten_quotes(html)
    assert '<code>"hello"</code>' in out


def test_smarten_quotes_preserves_pre():
    html = '<pre>x = "y"</pre>'
    assert smarten_quotes(html) == html


def test_convert_double_dashes_between_words():
    html = "<p>This -- is an em-dash.</p>"
    assert convert_double_dashes(html) == "<p>This—is an em-dash.</p>"


def test_convert_double_dashes_preserves_html_comments():
    html = "<!-- a comment -->"
    assert convert_double_dashes(html) == html


def test_convert_double_dashes_preserves_pre():
    html = "<pre>flag = --verbose</pre>"
    assert convert_double_dashes(html) == html


def test_clean_html_string_applies_all(canonical_part_html_with_newline_title):
    out = clean_html_string(canonical_part_html_with_newline_title)
    assert "\nDecision" not in out
    assert "Operating The Decision" in out
```

- [ ] **Step 2: Run tests; verify they FAIL for the right reason**

```bash
.venv/bin/pytest tests/test_clean_pandoc_artifacts.py -v
```

Expected: 11 errors, all `ImportError: cannot import name … from scripts.clean_pandoc_artifacts`.

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/test_clean_pandoc_artifacts.py
git commit -m "test(scripts): add failing tests for clean_pandoc_artifacts"
```

---

## Task 6: Write `clean_pandoc_artifacts.py` — GREEN (implementation)

**Files:**
- Create: `scripts/clean_pandoc_artifacts.py`

- [ ] **Step 1: Write minimal implementation**

```python
# ABOUTME: One-pass cleanup of Pandoc-emitted artifacts in book HTML.
# ABOUTME: Title \\n removal, smart-quote conversion, em-dash conversion.

from __future__ import annotations

import re
import sys
from pathlib import Path

# Match <pre>...</pre> and <code>...</code> blocks to preserve their content
PRE_OR_CODE_RE = re.compile(
    r"(<(?:pre|code)\b[^>]*>.*?</(?:pre|code)>)",
    re.DOTALL | re.IGNORECASE,
)
HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)


def _split_preserved(html: str) -> list[tuple[str, bool]]:
    """Split HTML into segments tagged (text, is_preserved).

    Preserved segments are <pre>/<code> blocks and HTML comments;
    they should not be touched by any cleanup.
    """
    parts: list[tuple[str, bool]] = []
    cursor = 0
    # Combine pre/code + comment matches by walking both
    all_matches = sorted(
        list(PRE_OR_CODE_RE.finditer(html)) + list(HTML_COMMENT_RE.finditer(html)),
        key=lambda m: m.start(),
    )
    for m in all_matches:
        if m.start() > cursor:
            parts.append((html[cursor:m.start()], False))
        parts.append((html[m.start():m.end()], True))
        cursor = m.end()
    if cursor < len(html):
        parts.append((html[cursor:], False))
    return parts


def _apply_to_unpreserved(html: str, transform) -> str:
    return "".join(seg if preserved else transform(seg) for seg, preserved in _split_preserved(html))


def fix_title_newlines(html: str) -> str:
    """Collapse \\n inside <title> and <h1>..<h6> tags to a single space."""
    def collapse(m: re.Match) -> str:
        tag_open, content, tag_close = m.group(1), m.group(2), m.group(3)
        return f"{tag_open}{re.sub(r'\\s*\\n\\s*', ' ', content)}{tag_close}"

    pattern = re.compile(
        r"(<(?:title|h[1-6])[^>]*>)(.*?)(</(?:title|h[1-6])>)",
        re.DOTALL | re.IGNORECASE,
    )
    return _apply_to_unpreserved(html, lambda seg: pattern.sub(collapse, seg))


def smarten_quotes(text: str) -> str:
    """Convert straight quotes to typographic quotes outside of <pre>/<code>."""
    def transform(seg: str) -> str:
        # Apostrophe: between letters or after letter
        seg = re.sub(r"(?<=\\w)'(?=\\w)", "’", seg)
        seg = re.sub(r"(?<=\\w)'", "’", seg)
        # Double quotes: open before non-space, close after non-space
        seg = re.sub(r'"([^"\\s])', "“\\1", seg)
        seg = re.sub(r'([^"\\s])"', "\\1”", seg)
        return seg
    return _apply_to_unpreserved(text, transform)


def convert_double_dashes(text: str) -> str:
    """Convert `--` between word characters to em-dash."""
    def transform(seg: str) -> str:
        return re.sub(r"(?<=\\w)\\s*--\\s*(?=\\w)", "—", seg)
    return _apply_to_unpreserved(text, transform)


def clean_html_string(html: str) -> str:
    """Apply all Pandoc-artifact cleanups in order."""
    html = fix_title_newlines(html)
    html = smarten_quotes(html)
    html = convert_double_dashes(html)
    return html


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: clean_pandoc_artifacts.py <root-dir-or-file>")
        return 2
    root = Path(argv[1])
    targets: list[Path]
    if root.is_file():
        targets = [root]
    else:
        targets = sorted(root.rglob("index.html"))
    changed = 0
    for path in targets:
        original = path.read_text(encoding="utf-8")
        cleaned = clean_html_string(original)
        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            print(f"cleaned: {path}")
            changed += 1
    print(f"{changed} file(s) changed")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
```

- [ ] **Step 2: Run tests; verify they PASS**

```bash
.venv/bin/pytest tests/test_clean_pandoc_artifacts.py -v
```

Expected: 11 passed.

- [ ] **Step 3: Commit**

```bash
git add scripts/clean_pandoc_artifacts.py
git commit -m "feat(scripts): implement clean_pandoc_artifacts.py + tests passing"
```

---

## Task 7: Run `clean_pandoc_artifacts.py` against the book

**Files:**
- Modify (in place): `content/extra/book/{opener,part-0..5,appendix}/index.html`

- [ ] **Step 1: Confirm pre-state has at least one artifact (Part 5 \\n bug)**

```bash
grep -lE 'Operating The\\n' content/extra/book/part-5/index.html content/extra/book/appendix/index.html content/extra/book/index.html
```

Expected: at least one file listed.

- [ ] **Step 2: Run cleanup**

```bash
.venv/bin/python scripts/clean_pandoc_artifacts.py content/extra/book/
```

Expected output: at least 2 files reported changed (part-5 + index + maybe appendix).

- [ ] **Step 3: Verify post-state (acceptance A5 + A6 from spec §16)**

```bash
grep -rE '<title>[^<]*\\n' content/extra/book/
grep -rE '<h1[^>]*>[^<]*\\n' content/extra/book/
```

Both must return 0.

- [ ] **Step 4: Smart-quote spot check**

```bash
grep -o '"[a-z]' content/extra/book/opener/index.html | head -5
```

Should return 0 lines (no straight double-quote followed immediately by a letter in body text). If results appear, manually review — they may be inside intentional content that the conservative regex missed.

- [ ] **Step 5: Commit**

```bash
git add content/extra/book/
git commit -m "fix(book): clean Pandoc artifacts (smart quotes, em-dashes, title \\n)"
```

---

## Task 8: Write `migrate_book_markup.py` — RED (failing tests)

**Files:**
- Create: `tests/test_migrate_book_markup.py`

This script does the structural HTML migration. It uses `beautifulsoup4` for safe HTML manipulation.

- [ ] **Step 1: Write the test file**

```python
# ABOUTME: Tests for the book HTML structural migration script.
# ABOUTME: Strip <style>, restructure to prose-grid, hyperlink cross-refs, add components.

from bs4 import BeautifulSoup

from scripts.migrate_book_markup import (
    strip_inline_style,
    add_book_part_class_to_article,
    promote_first_paragraph_to_dropcap,
    convert_where_this_breaks_h3,
    convert_decision_rule_h3,
    hyperlink_cross_references,
    migrate_html_string,
)


def _soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def test_strip_inline_style_removes_all_style_tags():
    html = '<head><style>body{color:red}</style><style>p{margin:0}</style></head>'
    out = strip_inline_style(html)
    soup = _soup(out)
    assert soup.find_all("style") == []


def test_strip_inline_style_preserves_link_tags():
    html = '<head><link rel="stylesheet" href="/book.css"><style>x{}</style></head>'
    out = strip_inline_style(html)
    soup = _soup(out)
    assert soup.find("link") is not None


def test_add_book_part_class_to_article():
    html = "<article><h1>Title</h1><p>Body</p></article>"
    out = add_book_part_class_to_article(html)
    soup = _soup(out)
    article = soup.find("article")
    assert "book-part" in article.get("class", [])


def test_promote_first_paragraph_letter_first():
    html = "<article><h1>Title</h1><p>Suppose you run a service.</p><p>Then.</p></article>"
    out = promote_first_paragraph_to_dropcap(html)
    soup = _soup(out)
    paragraphs = soup.find_all("p")
    assert "has-dropcap" in paragraphs[0].get("class", [])
    assert "has-dropcap" not in paragraphs[1].get("class", [])


def test_promote_first_paragraph_skips_when_starts_with_quote():
    html = '<article><h1>Title</h1><p>“Quoted thing,” he said.</p></article>'
    out = promote_first_paragraph_to_dropcap(html)
    soup = _soup(out)
    p = soup.find("p")
    assert "has-dropcap" not in p.get("class", [])


def test_promote_first_paragraph_skips_when_starts_with_digit():
    html = "<article><h1>Title</h1><p>500,000 requests per month.</p></article>"
    out = promote_first_paragraph_to_dropcap(html)
    soup = _soup(out)
    p = soup.find("p")
    assert "has-dropcap" not in p.get("class", [])


def test_convert_where_this_breaks_h3():
    html = """<article>
        <h3>Where This Breaks</h3>
        <p>At very low quality-gate pass rates.</p>
        <h3>Next Section</h3>
        <p>More text.</p>
    </article>"""
    out = convert_where_this_breaks_h3(html)
    soup = _soup(out)
    breaks = soup.find_all("div", class_="book-break")
    assert len(breaks) == 1
    label = breaks[0].find(class_="book-break-label")
    assert label is not None and label.string == "Where this breaks"
    assert "very low" in breaks[0].get_text()
    # And no leftover h3 with "Where This Breaks"
    h3s = soup.find_all("h3")
    assert not any("Where This Breaks" in h.get_text() for h in h3s)


def test_convert_decision_rule_h3():
    html = """<article>
        <h3>Decision Rule</h3>
        <p>Pick serverless when monthly tokens stay below 42M/d.</p>
    </article>"""
    out = convert_decision_rule_h3(html)
    soup = _soup(out)
    rules = soup.find_all("div", class_="book-decision-rule")
    assert len(rules) == 1
    label = rules[0].find(class_="book-decision-rule-label")
    assert label.string == "Decision rule"


def test_hyperlink_cross_references_part_chapter():
    """Part+Chapter refs link to the part page; chapter-level anchors are
    deferred (no chapter id attributes exist in current book HTML yet).
    Link text preserves the original "Part 2, Chapter 3" phrasing."""
    html = "<p>See Part 2, Chapter 3 for the derivation.</p>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    links = soup.find_all("a")
    assert len(links) == 1
    assert links[0].get("href") == "/book/part-2/"
    assert links[0].get_text() == "Part 2, Chapter 3"


def test_hyperlink_cross_references_part_alone():
    html = "<p>Returning to Part 1 for review.</p>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    link = soup.find("a")
    assert link is not None
    assert link.get("href") == "/book/part-1/"


def test_hyperlink_cross_references_appendix():
    """Appendix refs link to the appendix page; section-level anchors deferred."""
    html = "<p>Profile saas_chat is documented in Appendix B.</p>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    link = soup.find("a")
    assert link is not None
    assert link.get("href") == "/book/appendix/"
    assert link.get_text() == "Appendix B"


def test_hyperlink_does_not_double_link():
    """If already an <a href> with the same text, leave alone."""
    html = '<p>See <a href="/book/part-2/">Part 2</a> for details.</p>'
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    links = soup.find_all("a")
    assert len(links) == 1  # not 2


def test_migrate_html_string_applies_all(canonical_part_html):
    out = migrate_html_string(canonical_part_html)
    soup = _soup(out)
    # All transformations applied
    assert soup.find("style") is None
    assert soup.find("article", class_="book-part") is not None
    assert soup.find("div", class_="book-break") is not None
    assert soup.find("div", class_="book-decision-rule") is not None
    assert soup.find("a", href="/book/part-2/") is not None
```

- [ ] **Step 2: Run tests; verify they FAIL**

```bash
.venv/bin/pytest tests/test_migrate_book_markup.py -v
```

Expected: 12 errors, all `ImportError`.

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/test_migrate_book_markup.py
git commit -m "test(scripts): add failing tests for migrate_book_markup"
```

---

## Task 9: Write `migrate_book_markup.py` — GREEN (implementation)

**Files:**
- Create: `scripts/migrate_book_markup.py`

- [ ] **Step 1: Write the implementation**

```python
# ABOUTME: Structural migration of book HTML to the new component vocabulary.
# ABOUTME: Strip <style>, add book-part class, drop caps, callouts, cross-ref hyperlinks.

from __future__ import annotations

import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString


def _parse(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def strip_inline_style(html: str) -> str:
    soup = _parse(html)
    for style in soup.find_all("style"):
        style.decompose()
    return str(soup)


def add_book_part_class_to_article(html: str) -> str:
    soup = _parse(html)
    for article in soup.find_all("article"):
        classes = article.get("class", [])
        if "book-part" not in classes:
            classes.append("book-part")
            article["class"] = classes
    return str(soup)


def promote_first_paragraph_to_dropcap(html: str) -> str:
    soup = _parse(html)
    for article in soup.find_all("article"):
        first_p = article.find("p")
        if first_p is None:
            continue
        text = first_p.get_text().lstrip()
        if not text:
            continue
        if not text[0].isalpha():
            continue  # skip if first char isn't a letter
        classes = first_p.get("class", [])
        if "has-dropcap" not in classes:
            classes.append("has-dropcap")
            first_p["class"] = classes
    return str(soup)


def _wrap_h3_section_as(html: str, h3_label_match: str, wrapper_class: str, label_class: str, label_text: str) -> str:
    """Convert <h3>LABEL</h3><p>body</p>... into <div class="..."><span>label</span><p>body</p></div>.

    Sibling <p> tags following the h3 are absorbed until the next heading.
    """
    soup = _parse(html)
    targets = []
    for h3 in soup.find_all("h3"):
        if h3.get_text().strip().lower() == h3_label_match.lower():
            targets.append(h3)
    for h3 in targets:
        wrapper = soup.new_tag("div")
        wrapper["class"] = [wrapper_class]
        label = soup.new_tag("span")
        label["class"] = [label_class]
        label.string = label_text
        wrapper.append(label)
        # Collect siblings until next heading
        sib = h3.find_next_sibling()
        to_move = []
        while sib is not None and sib.name not in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            to_move.append(sib)
            sib = sib.find_next_sibling()
        for el in to_move:
            wrapper.append(el.extract())
        h3.replace_with(wrapper)
    return str(soup)


def convert_where_this_breaks_h3(html: str) -> str:
    return _wrap_h3_section_as(
        html,
        h3_label_match="Where This Breaks",
        wrapper_class="book-break",
        label_class="book-break-label",
        label_text="Where this breaks",
    )


def convert_decision_rule_h3(html: str) -> str:
    return _wrap_h3_section_as(
        html,
        h3_label_match="Decision Rule",
        wrapper_class="book-decision-rule",
        label_class="book-decision-rule-label",
        label_text="Decision rule",
    )


_CROSS_REF_RE = re.compile(
    r"\b(Part\s+(\d+)(?:,\s*(?:Chapter|Section)\s*(\d+))?|"
    r"Appendix\s+([A-Z])(?:,\s*(?:Section)\s*(\d+))?)\b",
)


def _href_for(match: re.Match) -> str:
    # Chapter-level anchors are deferred until Phase 4 (would require
    # inserting id="chapter-N" on h2 elements during migration).
    # For now, all part+chapter refs land on the part page.
    if match.group(2):  # "Part N" (with optional Chapter M — ignored for URL)
        part = match.group(2)
        return f"/book/part-{part}/"
    # "Appendix X" — link to appendix page; section-level anchors deferred.
    return "/book/appendix/"


def hyperlink_cross_references(html: str) -> str:
    soup = _parse(html)
    for text_node in list(soup.find_all(string=True)):
        # Skip text inside existing <a>, <code>, <pre>, <style>, <script>
        ancestor_tags = {p.name for p in text_node.parents if p.name}
        if ancestor_tags & {"a", "code", "pre", "style", "script"}:
            continue
        raw = str(text_node)
        if not _CROSS_REF_RE.search(raw):
            continue
        # Build a sequence of NavigableString + Tag pieces
        pieces: list = []
        cursor = 0
        for m in _CROSS_REF_RE.finditer(raw):
            if m.start() > cursor:
                pieces.append(NavigableString(raw[cursor:m.start()]))
            link = soup.new_tag("a", href=_href_for(m))
            link.string = m.group(0)
            pieces.append(link)
            cursor = m.end()
        if cursor < len(raw):
            pieces.append(NavigableString(raw[cursor:]))
        text_node.replace_with(*pieces)
    return str(soup)


def migrate_html_string(html: str) -> str:
    """Apply all structural migrations in order."""
    html = strip_inline_style(html)
    html = add_book_part_class_to_article(html)
    html = promote_first_paragraph_to_dropcap(html)
    html = convert_where_this_breaks_h3(html)
    html = convert_decision_rule_h3(html)
    html = hyperlink_cross_references(html)
    return html


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: migrate_book_markup.py <root-dir-or-file>")
        return 2
    root = Path(argv[1])
    if root.is_file():
        targets = [root]
    else:
        targets = sorted(root.rglob("index.html"))
    changed = 0
    for path in targets:
        # Skip the landing index — it gets hand-authored
        if path.parent == root and path.name == "index.html":
            print(f"skipping landing page (hand-authored): {path}")
            continue
        original = path.read_text(encoding="utf-8")
        migrated = migrate_html_string(original)
        if migrated != original:
            path.write_text(migrated, encoding="utf-8")
            print(f"migrated: {path}")
            changed += 1
    print(f"{changed} file(s) changed")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
```

- [ ] **Step 2: Run tests; verify they PASS**

```bash
.venv/bin/pytest tests/test_migrate_book_markup.py -v
```

Expected: 12 passed.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate_book_markup.py
git commit -m "feat(scripts): implement migrate_book_markup.py + tests passing"
```

---

## Task 10: Apply migration to one canonical page (opener) and review

**Files:**
- Modify: `content/extra/book/opener/index.html`

- [ ] **Step 1: Back up opener for review diff**

```bash
cp content/extra/book/opener/index.html /tmp/opener-before.html
```

- [ ] **Step 2: Run migration on just the opener**

```bash
.venv/bin/python scripts/migrate_book_markup.py content/extra/book/opener/index.html
```

Expected: `migrated: content/extra/book/opener/index.html`.

- [ ] **Step 3: Review the diff manually**

```bash
diff /tmp/opener-before.html content/extra/book/opener/index.html | head -100
```

Expected changes:
- `<style>` block removed
- `<article>` gains `class="book-part"`
- First `<p>` gains `class="has-dropcap"` (if it starts with a letter)
- Any "Where This Breaks" h3 wrapped as `<div class="book-break">`
- Any "Decision Rule" h3 wrapped as `<div class="book-decision-rule">`
- "Part N, Chapter M" references become `<a>` tags

- [ ] **Step 4: Verify acceptance criteria on this one file**

```bash
# A2: no inline <style>
grep -c '<style' content/extra/book/opener/index.html
# must print 0

# A3: no Inter
grep -c "Inter" content/extra/book/opener/index.html
# must print 0
```

- [ ] **Step 5: Add `<link>` references to the new CSS files**

The migration script strips `<style>` but does NOT add `<link rel="stylesheet">` to the head — that's an HTML structure concern handled here. For the opener, manually add inside `<head>`:

```html
<link rel="stylesheet" href="/theme/css/book-tokens.css">
<link rel="stylesheet" href="/theme/css/book.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
```

(In Task 12 we'll automate this insertion into the migration script.)

- [ ] **Step 6: Verify opener loads in browser**

Start a local server and visit `http://localhost:8000/book/opener/`:

```bash
.venv/bin/python -m http.server 8000 --directory output &
.venv/bin/pelican content -o output
# open browser to http://localhost:8000/book/opener/
```

Visual smoke check: page renders with new palette (moss + oxblood), Newsreader body type, broadsheet-style typography. No console errors.

- [ ] **Step 7: Commit**

```bash
git add content/extra/book/opener/index.html
git commit -m "refactor(book): migrate opener to new component vocabulary"
```

---

## Task 11: Extend migration script to insert `<link>` tags

**Files:**
- Modify: `scripts/migrate_book_markup.py`
- Modify: `tests/test_migrate_book_markup.py`

- [ ] **Step 1: Add failing test for link insertion**

Append to `tests/test_migrate_book_markup.py`:

```python
def test_insert_stylesheet_links(canonical_part_html):
    from scripts.migrate_book_markup import insert_stylesheet_links
    out = insert_stylesheet_links(canonical_part_html)
    soup = _soup(out)
    hrefs = [link.get("href") for link in soup.find_all("link")]
    assert "/theme/css/book-tokens.css" in hrefs
    assert "/theme/css/book.css" in hrefs
    # Google Fonts link present
    assert any("fonts.googleapis.com" in (h or "") for h in hrefs)


def test_insert_stylesheet_links_idempotent(canonical_part_html):
    from scripts.migrate_book_markup import insert_stylesheet_links
    once = insert_stylesheet_links(canonical_part_html)
    twice = insert_stylesheet_links(once)
    soup_once = _soup(once)
    soup_twice = _soup(twice)
    assert len(soup_once.find_all("link", href="/theme/css/book.css")) == 1
    assert len(soup_twice.find_all("link", href="/theme/css/book.css")) == 1
```

- [ ] **Step 2: Verify these tests fail**

```bash
.venv/bin/pytest tests/test_migrate_book_markup.py::test_insert_stylesheet_links -v
```

Expected: `ImportError`.

- [ ] **Step 3: Implement `insert_stylesheet_links` in `scripts/migrate_book_markup.py`**

Add this function before `migrate_html_string`:

```python
STYLESHEET_LINKS = [
    ("link", {"rel": "stylesheet", "href": "/theme/css/book-tokens.css"}),
    ("link", {"rel": "stylesheet", "href": "/theme/css/book.css"}),
    ("link", {"rel": "preconnect", "href": "https://fonts.googleapis.com"}),
    ("link", {"rel": "preconnect", "href": "https://fonts.gstatic.com", "crossorigin": ""}),
    ("link", {
        "rel": "stylesheet",
        "href": (
            "https://fonts.googleapis.com/css2?"
            "family=Instrument+Serif:ital@0;1"
            "&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500"
            "&family=JetBrains+Mono:wght@400;500;600;700"
            "&display=swap"
        ),
    }),
]


def insert_stylesheet_links(html: str) -> str:
    soup = _parse(html)
    head = soup.find("head")
    if head is None:
        return html
    existing_hrefs = {link.get("href") for link in head.find_all("link") if link.get("href")}
    for tag_name, attrs in STYLESHEET_LINKS:
        href = attrs.get("href")
        if href in existing_hrefs:
            continue
        new_tag = soup.new_tag(tag_name, **attrs)
        head.append(new_tag)
        existing_hrefs.add(href)
    return str(soup)
```

- [ ] **Step 4: Wire it into `migrate_html_string`**

Modify the function:

```python
def migrate_html_string(html: str) -> str:
    """Apply all structural migrations in order."""
    html = strip_inline_style(html)
    html = insert_stylesheet_links(html)
    html = add_book_part_class_to_article(html)
    html = promote_first_paragraph_to_dropcap(html)
    html = convert_where_this_breaks_h3(html)
    html = convert_decision_rule_h3(html)
    html = hyperlink_cross_references(html)
    return html
```

- [ ] **Step 5: Run all tests**

```bash
.venv/bin/pytest tests/ -v
```

Expected: all green (25+ tests passing).

- [ ] **Step 6: Re-run migration on opener to add the links**

```bash
.venv/bin/python scripts/migrate_book_markup.py content/extra/book/opener/index.html
```

Expected: `migrated:` line (the script is idempotent, only adds links if missing).

- [ ] **Step 7: Commit**

```bash
git add scripts/migrate_book_markup.py tests/test_migrate_book_markup.py content/extra/book/opener/index.html
git commit -m "feat(scripts): auto-insert stylesheet links during migration"
```

---

## Task 12: Run migration on the 8 part pages (opener already done)

**Files:**
- Modify: `content/extra/book/{part-0..5,appendix}/index.html`

- [ ] **Step 1: Run migration over the remaining seven directories**

```bash
for d in part-0 part-1 part-2 part-3 part-4 part-5 appendix; do
  .venv/bin/python scripts/migrate_book_markup.py "content/extra/book/$d/index.html"
done
```

Expected: 7 `migrated:` lines.

- [ ] **Step 2: Verify acceptance A2 (no inline `<style>`) for all 8 part pages**

```bash
grep -l '<style' content/extra/book/{opener,part-0,part-1,part-2,part-3,part-4,part-5,appendix}/index.html
```

Expected: 0 results.

- [ ] **Step 3: Verify acceptance A3 (no Inter in book content)**

```bash
grep -rE "font-family.*Inter|'Inter'|\"Inter\"" theme/static/css/ content/extra/book/
```

Expected: 0 results.

- [ ] **Step 4: Verify acceptance A7 (all 8 pages link the same two stylesheets)**

```bash
for f in content/extra/book/{opener,part-{0..5},appendix}/index.html; do
  c=$(grep -c 'book.css\|book-tokens.css' "$f")
  echo "$f: $c"
done
```

Expected: every file prints `2`.

- [ ] **Step 5: Smoke-render and visually check 2-3 random pages**

```bash
.venv/bin/pelican content -o output
.venv/bin/python -m http.server 8000 --directory output &
# Browse: /book/part-1/, /book/part-3/, /book/appendix/
# Each should render with moss + oxblood palette, Newsreader body, broadsheet header
```

- [ ] **Step 6: Commit**

```bash
git add content/extra/book/
git commit -m "refactor(book): migrate all 8 part pages to new component vocabulary"
```

---

## Task 13: Hand-author the broadsheet landing page

**Files:**
- Modify: `content/extra/book/index.html`

The landing page diverges structurally from the part pages — it's a TOC, not a chapter. Hand-author rather than run the migration script.

- [ ] **Step 1: Replace `content/extra/book/index.html` with a broadsheet TOC**

Write the file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="author" content="Sohail Mohammad">
  <title>The Inference Field Guide — Sohail Mohammad</title>
  <meta name="description" content="Production inference economics. Loaded cost per accepted result, not price per million tokens.">

  <link rel="stylesheet" href="/theme/css/book-tokens.css">
  <link rel="stylesheet" href="/theme/css/book.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">

  <style>
    /* Landing-only refinements; everything else inherits from book.css */
    .book-landing {
      max-width: 720px;
      margin: 0 auto;
      padding: var(--space-6) var(--space-4) var(--space-10);
    }
    .book-landing-h1 {
      font-family: var(--font-display);
      font-style: italic;
      font-weight: 400;
      font-size: 3rem;
      letter-spacing: -0.005em;
      line-height: 1.05;
      margin: var(--space-5) 0 var(--space-2);
      color: var(--text);
    }
    .book-landing-deck {
      font-family: var(--font-body);
      font-style: italic;
      font-size: 1.15rem;
      color: var(--text-deck);
      max-width: 56ch;
      margin-bottom: var(--space-6);
    }
    .book-landing-meta {
      font-family: var(--font-mono);
      font-size: var(--fs-mono-meta);
      color: var(--ink);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: var(--space-5);
    }
    .toc-row {
      display: grid;
      grid-template-columns: 80px 1fr auto;
      gap: var(--space-3);
      border-top: 1px solid var(--ink);
      padding: var(--space-3) 0;
      align-items: baseline;
    }
    .toc-row:last-child { border-bottom: 1px solid var(--ink); }
    .toc-num {
      font-family: var(--font-mono);
      font-size: var(--fs-mono-label);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--brown);
      font-weight: 700;
    }
    .toc-title {
      font-family: var(--font-body);
      font-size: 1.05rem;
      color: var(--text);
      text-decoration: none;
    }
    .toc-title:hover { color: var(--ink); }
    .toc-title-display {
      font-family: var(--font-display);
      font-style: italic;
      font-size: 1.25rem;
    }
    .toc-pages {
      font-family: var(--font-mono);
      font-size: var(--fs-mono-meta);
      color: var(--text-mute);
    }
    .book-back-link {
      font-family: var(--font-mono);
      font-size: var(--fs-mono-meta);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-deck);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="book-landing">
    <header class="book-top-rule">
      <span class="rule-anchor"><a href="/" class="book-back-link">← sohailmo.ai</a></span>
      <span class="rule-title">The Inference Field Guide · MMXXVI</span>
      <span class="rule-page">edition 1</span>
    </header>

    <div class="book-landing-meta">Sohail Mohammad</div>
    <h1 class="book-landing-h1">Production Inference Economics</h1>
    <p class="book-landing-deck">How to measure, model, and operate production inference decisions. Loaded cost per accepted result, not price per million tokens.</p>

    <div class="book-toc">
      <a class="toc-row" href="/book/opener/" style="text-decoration: none;">
        <span class="toc-num">Opener</span>
        <span class="toc-title toc-title-display">The denominator problem</span>
        <span class="toc-pages">pp. 1–8</span>
      </a>
      <a class="toc-row" href="/book/part-0/" style="text-decoration: none;">
        <span class="toc-num">Part 0</span>
        <span class="toc-title">Setup &amp; conventions</span>
        <span class="toc-pages">pp. 9–18</span>
      </a>
      <a class="toc-row" href="/book/part-1/" style="text-decoration: none;">
        <span class="toc-num">Part 1</span>
        <span class="toc-title">The field problem</span>
        <span class="toc-pages">pp. 19–46</span>
      </a>
      <a class="toc-row" href="/book/part-2/" style="text-decoration: none;">
        <span class="toc-num">Part 2</span>
        <span class="toc-title">The loaded cost</span>
        <span class="toc-pages">pp. 47–88</span>
      </a>
      <a class="toc-row" href="/book/part-3/" style="text-decoration: none;">
        <span class="toc-num">Part 3</span>
        <span class="toc-title">Capacity &amp; the cache</span>
        <span class="toc-pages">pp. 89–124</span>
      </a>
      <a class="toc-row" href="/book/part-4/" style="text-decoration: none;">
        <span class="toc-num">Part 4</span>
        <span class="toc-title">Goodput &amp; reconciliation</span>
        <span class="toc-pages">pp. 125–162</span>
      </a>
      <a class="toc-row" href="/book/part-5/" style="text-decoration: none;">
        <span class="toc-num">Part 5</span>
        <span class="toc-title">Operating the decision</span>
        <span class="toc-pages">pp. 163–198</span>
      </a>
      <a class="toc-row" href="/book/appendix/" style="text-decoration: none;">
        <span class="toc-num">Appendix</span>
        <span class="toc-title">Profiles, derivations, colophon</span>
        <span class="toc-pages">pp. 199–224</span>
      </a>
    </div>

    <div class="book-ornament">❦ &nbsp; ❦ &nbsp; ❦</div>
  </div>
</body>
</html>
```

Note: the part titles + page ranges are placeholders that should be cross-checked against the actual `<title>` of each part page. The implementer should `grep -h '<title>' content/extra/book/*/index.html` to confirm titles match.

- [ ] **Step 2: Verify the landing renders**

```bash
.venv/bin/pelican content -o output
# Browse: http://localhost:8000/book/
```

Visual check: broadsheet TOC with 9 rows, top rule, italic title, monospace part numbers, no card grid.

- [ ] **Step 3: Verify acceptance A2 + A3 on landing**

```bash
grep -c '<style' content/extra/book/index.html
# 1 (the landing-only refinements block — acceptable per the design; A2 applies to part pages)
grep -c "Inter" content/extra/book/index.html
# 0
```

The A2 acceptance criterion in spec §8.3 refers to the 8 part pages. The landing's small inline `<style>` is a deliberate exception for landing-only adjustments.

- [ ] **Step 4: Commit**

```bash
git add content/extra/book/index.html
git commit -m "feat(book): replace landing with broadsheet TOC (Instrument Serif title)"
```

---

## Task 14: Add colophon section to appendix

**Files:**
- Modify: `content/extra/book/appendix/index.html`

- [ ] **Step 1: Append colophon section before the closing `</article>` tag**

Insert this `<section>` near the end of the appendix's `<article class="book-part">`:

```html
<section class="book-colophon" id="colophon">
  <h2>Colophon</h2>
  <p>The Inference Field Guide was set in three typefaces from Google Fonts: <em>Instrument Serif</em> (italic display, chapter titles), <em>Newsreader</em> (body), and <em>JetBrains Mono</em> (numerics, ruled labels, code).</p>

  <dl>
    <dt>Paper</dt>
    <dd><code>#faf5e9</code> — parchment, warm cream</dd>

    <dt>Primary ink (moss)</dt>
    <dd><code>#3A4F2A</code> — headlines, rules, mad-libs chips, primary data, ornaments</dd>

    <dt>Secondary ink (oxblood)</dt>
    <dd><code>#5C2A1E</code> — sidenotes, "Where this breaks" callouts, evidence tags</dd>

    <dt>Display face</dt>
    <dd>Instrument Serif (italic) — chapter titles, landing</dd>

    <dt>Body face</dt>
    <dd>Newsreader (opsz 6–72) — running prose</dd>

    <dt>Mono face</dt>
    <dd>JetBrains Mono — data rows, variable chips, top-rule captions</dd>

    <dt>Built with</dt>
    <dd>Pelican (Python static site generator). Source: <a href="https://github.com/Sohailm25/Sohailm25.github.io">github.com/Sohailm25/Sohailm25.github.io</a>.</dd>

    <dt>Companion calculator</dt>
    <dd><a href="/book/calculator/">sohailmo.ai/book/calculator/</a> — Marimo notebook hosting the LCPR formulas, sensitivity sweeps, and break-even analysis used throughout this book.</dd>

    <dt>Last revised</dt>
    <dd id="colophon-date">2026-05-18</dd>
  </dl>
</section>
```

- [ ] **Step 2: Verify the appendix renders the colophon**

```bash
.venv/bin/pelican content -o output
# Browse: http://localhost:8000/book/appendix/#colophon
```

- [ ] **Step 3: Commit**

```bash
git add content/extra/book/appendix/index.html
git commit -m "feat(book): add colophon section to appendix"
```

---

## Task 15: Run all spec §16 Phase 1 acceptance commands

This is the gating verification. All of A1–A11 must pass before P1 is "done."

- [ ] **Step 1: A2 — no inline `<style>` in part pages**

```bash
grep -l '<style' content/extra/book/{opener,part-{0..5},appendix}/index.html
```

Expected: 0 results.

- [ ] **Step 2: A3 — no Inter in book CSS or HTML**

```bash
grep -rE "font-family:.*Inter" theme/static/css/ content/extra/book/
```

Expected: 0 results.

- [ ] **Step 3: A4 — every cross-reference is hyperlinked**

```bash
grep -rnE '(^|[^>])(see |See )?(Part [0-9]|Chapter [0-9]|Appendix [A-Z])([^<]|$)' content/extra/book/ \
  | grep -v 'href' \
  | grep -v '^Binary'
```

Expected: 0 results (or a few false positives that on manual inspection are inside `<title>`/`<h1>` and don't need hyperlinking — annotate any exceptions).

- [ ] **Step 4: A5 — no `\n` literal in titles or h1**

```bash
grep -rE '<title>[^<]*\\n' content/extra/book/
grep -rE '<h1[^>]*>[^<]*\\n' content/extra/book/
```

Both: 0 results.

- [ ] **Step 5: A6 — no bare `--` in body prose**

```bash
.venv/bin/python -c "
from pathlib import Path
import re
PAT = re.compile(r'(?<=\\\\w)\\\\s*--\\\\s*(?=\\\\w)')
for f in Path('content/extra/book/').rglob('index.html'):
    text = f.read_text()
    # strip pre/code
    text = re.sub(r'<(pre|code).*?</\\\\1>', '', text, flags=re.S|re.I)
    if PAT.search(text):
        print(f'BARE -- in {f}')
"
```

Expected: 0 prints.

- [ ] **Step 6: A7 — all 8 pages link the same two stylesheets**

```bash
for f in content/extra/book/{opener,part-{0..5},appendix}/index.html; do
  c=$(grep -c 'book.css\|book-tokens.css' "$f")
  echo "$f: $c"
done
```

Expected: 8 lines, each printing `2`.

- [ ] **Step 7: A8 — Lighthouse**

```bash
.venv/bin/pelican content -o output
.venv/bin/python -m http.server 8000 --directory output &
SERVER_PID=$!
sleep 2
npx --yes lighthouse http://localhost:8000/book/part-1/ \
  --only-categories=performance,accessibility,best-practices \
  --output=json --quiet --chrome-flags="--headless" \
  --output-path=/tmp/lh-part-1.json
kill $SERVER_PID
jq '.categories | to_entries[] | "\(.key): \(.value.score)"' /tmp/lh-part-1.json
```

Expected: `performance: ≥0.90`, `accessibility: ≥0.95`, `best-practices: ≥0.95`.

If any score is below threshold, examine the Lighthouse report (`lighthouse --view`) and address before declaring P1 done.

- [ ] **Step 8: A9 — Mobile responsive at ≤700px**

```bash
# Headless screenshot at 375x812
.venv/bin/python -m http.server 8000 --directory output &
SERVER_PID=$!
sleep 2
npx --yes puppeteer-cli screenshot http://localhost:8000/book/part-1/ \
  --width=375 --height=812 --full-page=true --output=/tmp/part-1-mobile.png
kill $SERVER_PID
open /tmp/part-1-mobile.png  # manual visual check: sidenotes collapsed under paragraphs
```

Expected: sidenotes render inline under their originating paragraphs, not in a right column. (If puppeteer-cli isn't available, use Chrome DevTools device toolbar manually.)

- [ ] **Step 9: A10 — print stylesheet works**

```bash
.venv/bin/python -m http.server 8000 --directory output &
SERVER_PID=$!
sleep 2
# Use Chrome headless to generate a print-mode PDF
npx --yes puppeteer-cli pdf http://localhost:8000/book/part-1/ \
  --output=/tmp/part-1-print.pdf
kill $SERVER_PID
open /tmp/part-1-print.pdf
# Manual visual check: sidebar/progress bar/part-nav hidden; sidenotes
# inline; ornaments visible; broadsheet top-rule prints; body type sized
# appropriately for paper (~11pt).
```

Expected: PDF renders cleanly without the sidebar, progress bar, or prev/next nav. Sidenotes appear inline. (If `puppeteer-cli` isn't available, use Chrome's File → Print → Save as PDF manually.)

- [ ] **Step 10: A11 — colophon section present**

```bash
grep -c 'book-colophon' content/extra/book/appendix/index.html
```

Expected: `1` or more.

- [ ] **Step 11: Commit any final touch-ups + a marker commit**

```bash
git commit --allow-empty -m "milestone(book): Phase 1 visual rework — all acceptance criteria pass"
```

---

## Task 16: Update the design spec to reflect Phase 1 completion

**Files:**
- Modify: `history/2026-05-18-book-calculator-uiux-design.md`

- [ ] **Step 1: Add a "Phase 1 status" note at the top of §8**

Open `history/2026-05-18-book-calculator-uiux-design.md`, find the line `## 8. Phase 1 — Book Visual Rework (ships first)`. Replace with:

```markdown
## 8. Phase 1 — Book Visual Rework (✅ SHIPPED <YYYY-MM-DD>)
```

Replace `<YYYY-MM-DD>` with the commit date.

- [ ] **Step 2: Commit**

```bash
git add history/2026-05-18-book-calculator-uiux-design.md
git commit -m "docs(spec): mark Phase 1 as shipped"
```

---

## Definition of Done (Phase 1)

Phase 1 is shipped when **all** of these are true:

- [ ] All eight part pages render from one shared stylesheet — no inline `<style>` blocks remain.
- [ ] No Inter font-family declaration anywhere in book content or CSS.
- [ ] All inline cross-references in part-page prose are `<a>` tags.
- [ ] No `\n` artifact in any `<title>` or `<h1>`.
- [ ] No bare `--` between word characters in body prose.
- [ ] All 8 part pages link the same two stylesheets (`book-tokens.css` + `book.css`).
- [ ] Lighthouse desktop scores: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 on a representative part page.
- [ ] Mobile ≤ 700px: sidenotes collapse to inline footnotes — verified by visual screenshot.
- [ ] Colophon section present on appendix page.
- [ ] All `pytest tests/` tests pass (25+ tests).
- [ ] Landing page is the new broadsheet TOC, not the old card grid.
- [ ] No regressions to existing print stylesheet (verified by browser print preview).

Phase 2 begins when the above is complete and the commit `milestone(book): Phase 1 visual rework — all acceptance criteria pass` is on the main branch.
