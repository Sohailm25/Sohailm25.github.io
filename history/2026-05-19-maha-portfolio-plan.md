# Maha's Portfolio Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `sohailmo.ai/maha/` — a broadsheet-aesthetic portfolio site for Maha Mohammad (Lead Medical Assistant + builder of mahaclinic) — that frames her clinician-builder profile for interviewer / LOR-writer / post-interview / personal-reference audiences, and sync the mahaclinic PWA to the same bordeaux palette.

**Architecture:** Pelican static site hosted on GitHub Pages at `sohailmo.ai/maha/` via the existing `EXTRA_PATH_METADATA` walker pattern (`pelicanconf.py:38-43`). One new palette-override CSS (`maha-tokens.css`) `@import`s the parent `book-tokens.css` and overrides moss→bordeaux + oxblood→sepia. One new component CSS (`maha.css`) inherits `site.css` patterns where possible and adds Maha-specific components. Page content is raw HTML in `content/extra/maha/<page>/index.html`, served as root-level paths. Tests use pytest + subprocess Pelican-build, mirroring `tests/test_mahaclinic_build.py`.

**Tech Stack:** Pelican (static site generator) · Python 3.11 · pytest + Playwright (test infra) · `uv` for package mgmt · GitHub Actions for deploy · Vanilla HTML/CSS for content (no JS frameworks)

**Spec:** `history/2026-05-19-maha-portfolio-design.md` (this plan's source of truth)
**Research:** `research/2026-05-19-med-school-admissions-may-2026.md`
**Branch:** `wip/maha-portfolio` (already created, spec already committed at 6655697)

---

## File Structure

### Files to CREATE

| Path | Purpose | Approx. size |
|---|---|---|
| `theme/static/css/maha-tokens.css` | Palette override (bordeaux + sepia) inheriting parent tokens | ~25 lines |
| `theme/static/css/maha.css` | Maha-specific components + `@import`s of maha-tokens + site CSS | ~250 lines |
| `content/extra/maha/index.html` | Home page (hero + on-the-record + featured + now + experience + competencies preview + selected work + writings placeholder + about + colophon) | ~250 lines |
| `content/extra/maha/about/index.html` | Long-form bio essay (~600-1000 words content placeholder) | ~100 lines |
| `content/extra/maha/mahaclinic/index.html` | Case study deep-dive (problem · decisions · guardrails · screenshots · who · what's next · live link) | ~200 lines |
| `content/extra/maha/competencies/index.html` | AAMC 15-17 competency mapping table | ~180 lines |
| `content/extra/maha/cv.pdf` | Downloadable CV (placeholder PDF until Maha provides) | binary |
| `content/extra/maha/images/mahaclinic-screenshot.png` | Hero screenshot (placeholder until Maha provides) | binary |
| `tests/test_maha_portfolio.py` | Pytest integration tests for the Maha pages | ~300 lines |
| `content/extra/maha/now/index.html` | **(v2)** Updates log archive | ~100 lines |
| `content/extra/maha/stories/index.html` | **(v2)** Patient story library index | ~80 lines |
| `content/extra/maha/stories/<slug>/index.html` × 4-6 | **(v2)** Individual de-identified vignettes | ~60 lines each |
| `content/extra/maha/for-interviewers/index.html` | **(v2)** Conversation prompts, noindex | ~80 lines |
| `content/extra/maha/for-letter-writers-<8charrand>/index.html` | **(v2)** Private recommender resource, noindex, random URL suffix | ~120 lines |

### Files to MODIFY

| Path | Change | Lines |
|---|---|---|
| `pelicanconf.py` | Add `"content/extra/maha"` to walker list | line 38 |
| `content/extra/mahaclinic/styles.css` | Change `@import` from `book-tokens.css` to `maha-tokens.css` | line 3 |
| `content/extra/mahaclinic/index.html` | Change `<meta name="theme-color">` to `#6B1F2B` | line 10 |
| `content/extra/mahaclinic/about/index.html` | Change `<meta name="theme-color">` to `#6B1F2B` | line 10 |
| `content/extra/mahaclinic/drug.html` | Change `<meta name="theme-color">` to `#6B1F2B` (if present) | line ~10 |

### Files to LEAVE ALONE

- `theme/static/css/book-tokens.css` — parent tokens, do not edit
- `theme/static/css/book.css` — book component CSS, do not edit
- `theme/static/css/site.css` — site-wide v2 components, reused by Maha CSS verbatim, do not edit
- Any other `theme/templates/*.html` — Maha bypasses Pelican templates entirely
- Any other content in `content/extra/book/`, `content/extra/research/`, `content/articles/` — out of scope

---

## Pre-Flight Checks

Before Task 1, confirm:

- [ ] You're on branch `wip/maha-portfolio` (`git branch --show-current`)
- [ ] Working tree is clean except for `thoughts/`, `.DS_Store` (`git status`)
- [ ] `uv` and Pelican are runnable: `uv run pelican --version` returns a version number
- [ ] Spec exists at `history/2026-05-19-maha-portfolio-design.md`

If any check fails, resolve before starting Task 1.

---

## v1 Tasks

### Task 1: Add maha test scaffold + register walker

**Files:**
- Create: `tests/test_maha_portfolio.py`
- Modify: `pelicanconf.py:38`

- [ ] **Step 1: Write the failing test scaffold**

```python
# tests/test_maha_portfolio.py
"""ABOUTME: Verifies the /maha/ portfolio pages build and meet acceptance criteria.
ABOUTME: Companion to test_mahaclinic_build.py; uses the session-scoped pelican_build fixture."""

import pathlib
import re
import pytest

REPO = pathlib.Path(__file__).parent.parent
OUTPUT = REPO / "output"
SOURCE = REPO / "content" / "extra" / "maha"
THEME_CSS = REPO / "theme" / "static" / "css"


# ── Build wiring ────────────────────────────────────────────────────

def test_pelican_builds_maha_index():
    target = OUTPUT / "maha" / "index.html"
    assert target.exists(), f"Expected {target} to exist after Pelican build"
    assert target.read_text().startswith("<!DOCTYPE html>"), \
        "index.html should be a real HTML doc"
```

- [ ] **Step 2: Verify the test fails (Pelican doesn't know about extra/maha yet)**

Run:
```bash
cd /Users/sohailmo/Documents/Sohailm25.github.io
uv run pytest tests/test_maha_portfolio.py -v
```
Expected: FAIL — `output/maha/index.html` does not exist (because walker hasn't been updated and content doesn't exist).

- [ ] **Step 3: Update Pelican walker to include `content/extra/maha`**

Edit `pelicanconf.py` line 38 — change:

```python
for static_dir in ["content/extra/research", "content/extra/book", "content/extra/mahaclinic"]:
```

to:

```python
for static_dir in ["content/extra/research", "content/extra/book", "content/extra/mahaclinic", "content/extra/maha"]:
```

- [ ] **Step 4: Confirm test still fails (walker now knows the dir but no content yet)**

```bash
mkdir -p content/extra/maha
uv run pytest tests/test_maha_portfolio.py::test_pelican_builds_maha_index -v
```
Expected: FAIL — still no `index.html` to serve. Good; we'll create it in Task 11.

- [ ] **Step 5: Commit**

```bash
git add tests/test_maha_portfolio.py pelicanconf.py
git commit -m "test(maha): scaffold portfolio test file + register Pelican walker

Adds tests/test_maha_portfolio.py with the build-wiring test. Updates
pelicanconf.py to include content/extra/maha in the static walker so
files dropped there get routed to /maha/<path>.

Test fails as expected — implementation follows."
```

---

### Task 2: Create maha-tokens.css (palette override)

**Files:**
- Create: `theme/static/css/maha-tokens.css`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

Add to `tests/test_maha_portfolio.py`:

```python
# ── Tokens ──────────────────────────────────────────────────────────

def test_maha_tokens_file_exists():
    assert (THEME_CSS / "maha-tokens.css").exists(), \
        "theme/static/css/maha-tokens.css must exist"

def test_maha_tokens_imports_book_tokens():
    src = (THEME_CSS / "maha-tokens.css").read_text()
    assert "@import url('book-tokens.css')" in src, \
        "maha-tokens.css must @import book-tokens.css to inherit typography + spacing"

def test_maha_tokens_overrides_primary_to_bordeaux():
    src = (THEME_CSS / "maha-tokens.css").read_text()
    assert "#6B1F2B" in src, "primary ink must be bordeaux #6B1F2B"

def test_maha_tokens_overrides_secondary_to_sepia():
    src = (THEME_CSS / "maha-tokens.css").read_text()
    assert "#5C3A1E" in src, "secondary ink must be sepia #5C3A1E"

def test_maha_tokens_no_moss_color():
    src = (THEME_CSS / "maha-tokens.css").read_text()
    assert "#3A4F2A" not in src.upper() and "#3a4f2a" not in src.lower(), \
        "maha-tokens.css must not contain the parent moss color"
```

- [ ] **Step 2: Run to confirm failures**

```bash
uv run pytest tests/test_maha_portfolio.py -v -k tokens
```
Expected: All four token tests FAIL with `FileNotFoundError` or similar.

- [ ] **Step 3: Write `theme/static/css/maha-tokens.css`**

```css
/* ABOUTME: Palette overrides for Maha's portfolio. Inherits typography +
   ABOUTME: spacing from book-tokens.css. Single source of truth — see spec §6.1. */

@import url('book-tokens.css');

:root {
  /* Primary ink — Bordeaux (replaces moss) */
  --ink:             #6B1F2B;
  --ink-soft:        #c69d9d;     /* dusty rose for soft borders */
  --ink-on-paper:    #4A131C;     /* deeper bordeaux for body emphasis */

  /* Secondary ink — Sepia (replaces oxblood) */
  --brown:           #5C3A1E;
  --brown-soft:      #b3a190;
  --brown-tint:      rgba(92, 58, 30, 0.10);

  /* Everything else inherits: paper, paper-tint, text, type scale, spacing, layout */
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
uv run pytest tests/test_maha_portfolio.py -v -k tokens
```
Expected: All four token tests PASS.

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha-tokens.css tests/test_maha_portfolio.py
git commit -m "feat(maha): add palette tokens — bordeaux + sepia on parchment

New file inherits book-tokens.css (typography + spacing) and overrides
the primary ink (moss → bordeaux #6B1F2B) and secondary ink
(oxblood → sepia #5C3A1E). Everything else inherits unchanged.

Tests confirm: file exists, imports parent, has both new hex values,
and does not contain the moss color."
```

---

### Task 3: Create maha.css base (imports + reset)

**Files:**
- Create: `theme/static/css/maha.css`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_maha_css_exists_and_imports_tokens():
    src = (THEME_CSS / "maha.css").read_text()
    assert "@import url('maha-tokens.css')" in src, \
        "maha.css must @import maha-tokens.css"
```

- [ ] **Step 2: Run to confirm failure**

```bash
uv run pytest tests/test_maha_portfolio.py::test_maha_css_exists_and_imports_tokens -v
```
Expected: FAIL — file does not exist.

- [ ] **Step 3: Create `theme/static/css/maha.css` with the base block**

```css
/* ABOUTME: Component styles for Maha's portfolio. Loads after maha-tokens.css.
   ABOUTME: Reuses site.css patterns; adds Maha-specific components. See spec §6.2-6.5. */

@import url('maha-tokens.css');

/* ── Reset ──────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 16.5px;
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  scrollbar-gutter: stable;
  background: var(--paper);
}
html, body { overflow-x: clip; }

body {
  font-family: var(--font-body);
  color: var(--text);
  background: var(--paper);
  line-height: var(--lh-body);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

/* ── Links (mirrors site.css) ───────────────────────────── */
a {
  color: var(--text);
  text-decoration: underline;
  text-decoration-color: var(--ink-soft);
  text-underline-offset: 0.18em;
  transition: color 0.15s, text-decoration-color 0.15s;
}
a:hover { color: var(--brown); text-decoration-color: var(--brown); }

/* ── Site header / nav / main / footer (mirrors site.css verbatim) ─ */
.site-header {
  border-bottom: 1px solid var(--ink-soft);
  background: var(--paper);
  position: sticky;
  top: 0;
  z-index: 50;
}
.site-header-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-5);
}
.site-logo {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 1.15rem;
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
}
.site-logo:hover { color: var(--brown); }

.site-nav { flex: 1; display: flex; justify-content: center; }
.site-nav ul { list-style: none; display: flex; gap: var(--space-5); }
.site-nav a {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-deck);
  text-decoration: none;
}
.site-nav a:hover { color: var(--ink); }
.site-nav a.active, .site-nav a[aria-current="page"] {
  color: var(--ink);
  text-decoration: underline;
  text-decoration-color: var(--ink);
  text-underline-offset: 0.3em;
}

.site-main {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-10);
}

/* ── Section top-rule (mirrors site.css) ────────────────── */
.section-rule {
  border-top: 3px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  padding: var(--space-2) 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink);
  font-weight: 700;
  margin-top: var(--space-8);
  margin-bottom: var(--space-5);
}
.section-rule a { color: var(--ink); text-decoration: none; }
.section-rule a:hover { color: var(--brown); }

/* ── Buttons (mirrors site.css) ─────────────────────────── */
.site-btn {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink);
  border: 1px solid var(--ink);
  background: transparent;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  cursor: pointer;
}
.site-btn:hover { background: var(--ink); color: var(--paper); }
.site-btn--soft { border-color: var(--ink-soft); color: var(--text-deck); }
.site-btn--soft:hover { background: var(--paper-tint); color: var(--ink); border-color: var(--ink); }

/* ── Ruled list (mirrors site.css) ──────────────────────── */
.ruled-list { list-style: none; padding: 0; margin: 0; }
.ruled-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--ink-soft);
  align-items: baseline;
}
.ruled-row:first-of-type { border-top: 1px solid var(--ink-soft); }
.ruled-row a { color: inherit; text-decoration: none; display: contents; }
.ruled-row a:hover .ruled-title {
  color: var(--brown);
  text-decoration: underline;
  text-decoration-color: var(--brown);
  text-underline-offset: 0.18em;
}
.ruled-date {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  color: var(--text-deck);
  font-variant-numeric: tabular-nums slashed-zero;
  white-space: nowrap;
}
.ruled-body { min-width: 0; }
.ruled-title {
  font-family: var(--font-body);
  font-size: 1.15rem;
  color: var(--text);
  line-height: 1.35;
  margin-bottom: var(--space-1);
  transition: color 0.15s;
}
.ruled-excerpt {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-deck);
  line-height: 1.55;
  margin-bottom: var(--space-2);
}
.ruled-meta {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-mute);
}

/* ── Colophon (mirrors site.css) ────────────────────────── */
.site-colophon {
  margin-top: var(--space-10);
  padding-top: var(--space-5);
  border-top: 1px solid var(--ink-soft);
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-mute);
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* ── Article prose (used by /maha/about/, /maha/mahaclinic/, etc.) ─ */
.article-prose {
  max-width: 65ch;
  font-family: var(--font-body);
  font-size: 1.0625rem;
  font-variation-settings: "opsz" 16;
  line-height: var(--lh-body);
}
.article-prose p { margin-bottom: var(--space-4); }
.article-prose h2 {
  font-family: var(--font-body);
  font-weight: 700;
  color: var(--ink);
  font-size: 1.4rem;
  margin-top: var(--space-6);
  margin-bottom: var(--space-2);
  letter-spacing: -0.01em;
}
.article-prose h3 {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink);
  margin-top: var(--space-5);
  margin-bottom: var(--space-2);
}
.article-prose blockquote {
  border-left: 3px solid var(--ink);
  background: rgba(107, 31, 43, 0.05);
  padding: var(--space-3) var(--space-4);
  margin: var(--space-4) 0;
  font-style: italic;
  color: var(--text-deck);
}
.article-prose img {
  max-width: 100%;
  height: auto;
  margin: var(--space-4) 0;
  display: block;
  border: 1px solid var(--ink-soft);
}
.article-prose ul, .article-prose ol { margin-left: var(--space-5); margin-bottom: var(--space-4); }
.article-prose li { margin-bottom: var(--space-2); }

.article-prose p.has-dropcap::first-letter {
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

.article-back {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-deck);
  text-decoration: none;
  margin-bottom: var(--space-5);
}
.article-back:hover { color: var(--ink); }

.article-header {
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--ink);
}
.article-kicker {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-label);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink);
  margin-bottom: var(--space-2);
}
.article-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 2.4rem;
  line-height: 1.1;
  color: var(--text);
  margin-bottom: var(--space-3);
  letter-spacing: -0.01em;
}
```

(Why duplicate `site.css` rather than `@import` it? Because `site.css` itself depends on `book-tokens.css` (its moss/oxblood). Importing it would pull in the parent palette and override our bordeaux. Cleaner to duplicate the few component rules we reuse, all token-driven so they pick up Maha's palette.)

- [ ] **Step 4: Run to confirm pass**

```bash
uv run pytest tests/test_maha_portfolio.py::test_maha_css_exists_and_imports_tokens -v
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha.css tests/test_maha_portfolio.py
git commit -m "feat(maha): maha.css base — imports tokens, mirrors site.css patterns

Reuses site.css component classes (hero, section-rule, ruled-list, btn,
article-prose, colophon, etc.) by duplicating the rule bodies under the
maha-tokens.css import. Cannot @import site.css directly because that
pulls in moss palette; duplication is the cleanest way to keep palette
clean while inheriting layout patterns."
```

---

### Task 4: Add hero variant + tagline-deck CSS

**Files:**
- Modify: `theme/static/css/maha.css` (append)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_maha_css_has_hero_no_portrait():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".hero--no-portrait" in src, "must define .hero--no-portrait modifier"
    assert ".hero-deck" in src, "must define .hero-deck (tagline) class"
```

- [ ] **Step 2: Run, confirm fail**

```bash
uv run pytest tests/test_maha_portfolio.py::test_maha_css_has_hero_no_portrait -v
```
Expected: FAIL.

- [ ] **Step 3: Append hero rules to `theme/static/css/maha.css`**

```css

/* ── Hero (no-portrait variant) ─────────────────────────── */
.hero {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-8) 0 var(--space-6);
  border-bottom: 1px solid var(--ink-soft);
  margin-bottom: var(--space-3);
}
.hero.hero--no-portrait .hero-content { max-width: 70ch; }
.hero-content { flex: 1; min-width: 0; }
.hero-kicker {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--text-deck);
  margin-bottom: var(--space-2);
}
.hero-name {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 3rem;
  line-height: 1.05;
  color: var(--ink);
  letter-spacing: -0.01em;
  margin-bottom: var(--space-3);
}
.hero-deck {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 1.6rem;
  line-height: 1.25;
  color: var(--ink-on-paper);
  margin-bottom: var(--space-4);
  max-width: 38ch;
}
.hero-bio {
  font-family: var(--font-body);
  font-style: italic;
  font-variation-settings: "opsz" 24;
  font-size: 1.1rem;
  color: var(--text-deck);
  max-width: 60ch;
  margin-bottom: var(--space-5);
  line-height: 1.5;
}
.hero-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
```

- [ ] **Step 4: Run, confirm pass**

```bash
uv run pytest tests/test_maha_portfolio.py::test_maha_css_has_hero_no_portrait -v
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha.css tests/test_maha_portfolio.py
git commit -m "feat(maha): hero CSS — no-portrait variant + tagline deck

Adds .hero--no-portrait modifier (no image, wider 70ch content column),
.hero-deck (Instrument Serif italic tagline between name and bio), and
the standard .hero-name + .hero-bio + .hero-actions per spec §5.3."
```

---

### Task 5: Add On-the-Record component CSS

**Files:**
- Modify: `theme/static/css/maha.css` (append)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_maha_css_has_record_strip():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".maha-record-strip" in src, "must define .maha-record-strip"
    assert ".record-rows" in src, "must define .record-rows"
    assert "tabular-nums" in src, "On-the-Record values must use tabular-nums"
```

- [ ] **Step 2: Run, confirm fail**

```bash
uv run pytest tests/test_maha_portfolio.py::test_maha_css_has_record_strip -v
```

- [ ] **Step 3: Append to `theme/static/css/maha.css`**

```css

/* ── On the Record (broadsheet data-row block) ──────────── */
.maha-record-strip {
  margin: var(--space-6) 0 var(--space-5);
}
.maha-record-strip .record-header {
  border-top: 3px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  padding: var(--space-2) 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink);
  font-weight: 700;
  margin-bottom: var(--space-3);
}
.maha-record-strip .record-rows {
  display: flex;
  flex-direction: column;
}
.maha-record-strip .record-rows > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--ink-soft);
  gap: var(--space-4);
}
.maha-record-strip dt {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-deck);
}
.maha-record-strip dd {
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--ink);
  font-weight: 700;
  font-variant-numeric: tabular-nums slashed-zero;
  text-align: right;
}
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha.css tests/test_maha_portfolio.py
git commit -m "feat(maha): On-the-Record data-row strip CSS

Broadsheet-style metrics block — top + bottom rule header, dt-dd flex
rows with tabular-nums values, no card-grid affordance per design
system non-goals (§3)."
```

---

### Task 6: Add Featured / Case Study panel CSS

**Files:**
- Modify: `theme/static/css/maha.css` (append)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_maha_css_has_case_study_panel():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".maha-case-study-panel" in src
    assert ".case-grid" in src
    assert ".case-prose" in src
    assert ".case-image" in src
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Append to `theme/static/css/maha.css`**

```css

/* ── Featured / Case Study panel ────────────────────────── */
.maha-case-study-panel { margin: var(--space-5) 0; }
.maha-case-study-panel .case-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-6);
  align-items: start;
}
.maha-case-study-panel .case-grid > * { min-width: 0; }

.case-eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-label);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--brown);
  margin-bottom: var(--space-2);
}
.case-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 1.8rem;
  line-height: 1.1;
  color: var(--ink);
  letter-spacing: -0.01em;
  margin-bottom: var(--space-3);
}
.case-body {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--text);
  margin-bottom: var(--space-3);
  max-width: 50ch;
}
.case-body strong { color: var(--ink-on-paper); font-weight: 600; }
.case-body--quiet { color: var(--text-deck); font-size: 0.95rem; }
.case-actions { display: flex; gap: var(--space-3); margin-top: var(--space-4); flex-wrap: wrap; }

.case-image {
  margin: 0;
  border: 1px solid var(--ink-soft);
  background: var(--paper-tint);
}
.case-image img {
  display: block;
  width: 100%;
  height: auto;
}
.case-image figcaption {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-deck);
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--ink-soft);
}
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha.css tests/test_maha_portfolio.py
git commit -m "feat(maha): Featured / Case Study panel CSS

Two-column desktop grid (1fr + 320px image). Eyebrow + italic display
title + Newsreader body + figure-with-caption. Stacks on mobile in
Task 10."
```

---

### Task 7: Add Now list CSS

**Files:**
- Modify: `theme/static/css/maha.css` (append)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_maha_css_has_now_list():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".now-list" in src
    assert ".now-tag" in src
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Append to `theme/static/css/maha.css`**

```css

/* ── Now list ───────────────────────────────────────────── */
.now-list { list-style: none; padding: 0; margin: 0; }
.now-list li {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--ink-soft);
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
}
.now-list li:last-child { border-bottom: none; }
.now-tag {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--brown);
  border: 1px solid var(--brown-soft);
  padding: 2px 6px;
  flex-shrink: 0;
  min-width: 70px;
  text-align: center;
}
.now-list em { font-style: italic; color: var(--ink-on-paper); }
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha.css tests/test_maha_portfolio.py
git commit -m "feat(maha): Now list CSS — monospace tag chip + ruled rows"
```

---

### Task 8: Add Experience row CSS

**Files:**
- Modify: `theme/static/css/maha.css` (append)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_maha_css_has_experience_row():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".maha-experience-row" in src
    assert ".exp-date" in src
    assert ".exp-annot" in src
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Append to `theme/static/css/maha.css`**

```css

/* ── Experience timeline ────────────────────────────────── */
.maha-experience-list { list-style: none; padding: 0; margin: 0; }
.maha-experience-row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--ink-soft);
  align-items: baseline;
}
.maha-experience-row:first-child { border-top: 1px solid var(--ink-soft); }
.exp-date {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  color: var(--text-deck);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.exp-body { min-width: 0; }
.exp-title {
  font-family: var(--font-body);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
  margin-bottom: var(--space-1);
}
.exp-org {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-style: italic;
  color: var(--ink);
  margin-bottom: var(--space-1);
}
.exp-detail {
  font-family: var(--font-body);
  font-size: 0.92rem;
  color: var(--text-deck);
  line-height: 1.5;
}
.exp-annot {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  color: var(--brown);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha.css tests/test_maha_portfolio.py
git commit -m "feat(maha): Experience row CSS — 3-col grid with margin annotation

Grid: date | body | annot. Date and annot are JBMono monospace,
tabular-nums. Body uses Newsreader. Annot sits right-aligned in
sepia (--brown) to differentiate from primary ink."
```

---

### Task 9: Add Competency preview + section-specific CSS

**Files:**
- Modify: `theme/static/css/maha.css` (append)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_maha_css_has_competency_preview():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".competency-preview" in src
    assert ".comp-label" in src
    assert ".comp-body" in src

def test_maha_css_has_misc_components():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".writings-placeholder" in src
    assert ".about-short" in src
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Append to `theme/static/css/maha.css`**

```css

/* ── Competency preview grid ────────────────────────────── */
.competency-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5) var(--space-6);
  margin: var(--space-4) 0;
}
.competency-preview article {
  border-top: 1px solid var(--ink);
  padding-top: var(--space-3);
}
.comp-label {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink);
  font-weight: 700;
  margin-bottom: var(--space-2);
}
.comp-body {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text);
}

/* ── Writings placeholder ───────────────────────────────── */
.writings-placeholder {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 1.05rem;
  color: var(--text-deck);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--ink-soft);
  border-bottom: 1px solid var(--ink-soft);
}

/* ── About short (home page block) ──────────────────────── */
.about-short {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--text);
  max-width: 65ch;
  margin-bottom: var(--space-4);
}
.about-short + .about-short { margin-top: var(--space-3); }

/* ── Competencies full table (used on /maha/competencies/) ─ */
.competency-table {
  list-style: none;
  padding: 0;
  margin: var(--space-5) 0;
}
.competency-table > li {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--space-5);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--ink-soft);
  align-items: baseline;
}
.competency-table > li:first-child { border-top: 2px solid var(--ink); }
.competency-table .ct-name {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink);
  font-weight: 700;
}
.competency-table .ct-bullet {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text);
}

/* ── Now archive log (used on /maha/now/) ───────────────── */
.maha-now-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--ink-soft);
  align-items: baseline;
}
.maha-now-row:first-child { border-top: 1px solid var(--ink-soft); }
.maha-now-row .now-date {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  color: var(--text-deck);
  font-variant-numeric: tabular-nums;
}
.maha-now-row .now-body {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text);
  line-height: 1.55;
}

/* ── Story vignette (used on /maha/stories/<slug>/) ─────── */
.story-vignette {
  max-width: 50ch;
  margin: var(--space-5) auto;
}
.story-vignette h3 {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-label);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--brown);
  margin-top: var(--space-4);
  margin-bottom: var(--space-1);
}
.story-vignette p {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--text);
  margin-bottom: var(--space-3);
}
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha.css tests/test_maha_portfolio.py
git commit -m "feat(maha): competency, writings, about, now, story-vignette CSS

Components for the home preview strip, the full competencies table at
/maha/competencies/, the Now log at /maha/now/, and the per-vignette
layout at /maha/stories/<slug>/."
```

---

### Task 10: Add mobile breakpoints to maha.css

**Files:**
- Modify: `theme/static/css/maha.css` (append)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_maha_css_has_mobile_breakpoints():
    src = (THEME_CSS / "maha.css").read_text()
    assert "@media (max-width: 960px)" in src
    assert "@media (max-width: 700px)" in src
    assert "@media (max-width: 600px)" in src
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Append to `theme/static/css/maha.css`**

```css

/* ── Mobile breakpoints ─────────────────────────────────── */

@media (max-width: 960px) {
  .maha-case-study-panel .case-grid {
    grid-template-columns: 1fr 280px;
    gap: var(--space-5);
  }
  .competency-preview { gap: var(--space-4); }
}

@media (max-width: 700px) {
  .site-header-inner {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
  }
  .site-logo { flex: 0 0 auto; }
  .site-nav { flex: 1 1 100%; order: 3; }
  .site-nav ul {
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2) var(--space-4);
  }
  .site-nav li { white-space: nowrap; }
  .site-nav a { white-space: nowrap; font-size: 0.78rem; }
  .site-main { padding: var(--space-5) var(--space-4); }

  .hero {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-5);
    padding: var(--space-5) 0 var(--space-4);
  }
  .hero-name { font-size: 2.2rem; }
  .hero-deck { font-size: 1.3rem; }
  .hero-bio { font-size: 1rem; }

  .maha-case-study-panel .case-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  .case-image { order: -1; }
  .case-title { font-size: 1.5rem; }

  .competency-preview { grid-template-columns: 1fr; gap: var(--space-4); }

  .maha-experience-row {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }
  .exp-date { font-size: var(--fs-mono-meta); }
  .exp-annot { text-align: left; margin-top: var(--space-1); }

  .competency-table > li {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }

  .maha-now-row { grid-template-columns: 1fr; gap: var(--space-1); }

  .site-colophon { flex-direction: column; gap: var(--space-2); }
}

@media (max-width: 600px) {
  .maha-record-strip dt { font-size: 0.7rem; }
  .maha-record-strip dd { font-size: 0.95rem; }
  .case-actions { flex-direction: column; align-items: stretch; }
  .case-actions .site-btn { text-align: center; }
  .hero-deck { font-size: 1.15rem; }
  .hero-actions { flex-direction: column; align-items: stretch; }
  .hero-actions .site-btn { text-align: center; }
}
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add theme/static/css/maha.css tests/test_maha_portfolio.py
git commit -m "feat(maha): mobile breakpoints — 960 / 700 / 600

Mirrors parent breakpoint scheme. 700px: hero stacks, case-grid stacks
(image above prose), competency-preview becomes 1-col, experience-row
collapses margin-annot below body, table stacks. 600px: type scale
steps down, buttons stretch."
```

---

### Task 11: Create home page HTML

**Files:**
- Create: `content/extra/maha/index.html`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing tests**

```python
# ── Home page content checks ────────────────────────────────────────

def test_home_has_doctype_and_lang():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert home.startswith("<!DOCTYPE html>")
    assert 'lang="en"' in home

def test_home_title_is_clinician_builder():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "<title>Maha Mohammad — clinician + builder</title>" in home

def test_home_loads_both_stylesheets():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "maha-tokens.css" in home
    assert "maha.css" in home

def test_home_hero_kicker():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "CLINICIAN · BUILDER · DALLAS, TX" in home

def test_home_hero_tagline():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "Five years at the bedside" in home
    assert "One tool my physicians actually use" in home

def test_home_hero_has_no_portrait_class():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "hero--no-portrait" in home
    # And no <img> inside the .hero section
    hero_block = re.search(r'<section class="hero[^"]*">(.+?)</section>', home, re.S)
    assert hero_block, "must have a .hero section"
    assert "<img" not in hero_block.group(1), "v1 hero must not contain an <img>"

def test_home_sections_in_order():
    home = (OUTPUT / "maha" / "index.html").read_text()
    sections = [
        "CLINICIAN · BUILDER",     # hero kicker
        "ON THE RECORD",
        "FEATURED · 2026",
        "NOW · Q2 2026",
        "EXPERIENCE",
        "AAMC PREMED COMPETENCIES",
        "SELECTED WORK",
        "WRITINGS",
        "ABOUT",
    ]
    last_pos = -1
    for s in sections:
        pos = home.find(s)
        assert pos > -1, f"section marker {s!r} not found"
        assert pos > last_pos, f"section {s!r} out of order"
        last_pos = pos

def test_home_no_moss_color():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "#3A4F2A" not in home.upper() and "#3a4f2a" not in home.lower()

def test_home_no_inter_font():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "Inter" not in home  # font-family

def test_home_theme_color_bordeaux():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert 'name="theme-color" content="#6B1F2B"' in home

def test_home_mahaclinic_link_present():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert 'href="/mahaclinic/"' in home

def test_home_cv_link_present():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert 'href="/maha/cv.pdf"' in home
```

- [ ] **Step 2: Run, confirm all fail (file doesn't exist yet)**

```bash
uv run pytest tests/test_maha_portfolio.py -v
```
Expected: 12+ new tests FAIL.

- [ ] **Step 3: Create `content/extra/maha/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#6B1F2B">
  <meta name="description" content="Maha Mohammad — Lead Medical Assistant. I build search-first clinical references from inside the practice.">
  <title>Maha Mohammad — clinician + builder</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">

  <link rel="stylesheet" href="/theme/css/maha-tokens.css">
  <link rel="stylesheet" href="/theme/css/maha.css">
</head>
<body class="maha-site">

  <header class="site-header">
    <div class="site-header-inner">
      <a href="/maha/" class="site-logo">Maha Mohammad</a>
      <nav class="site-nav" aria-label="Primary">
        <ul>
          <li><a href="/maha/about/">About</a></li>
          <li><a href="/maha/mahaclinic/">Mahaclinic</a></li>
          <li><a href="/maha/competencies/">Competencies</a></li>
          <li><a href="/maha/now/">Now</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="site-main">

    <!-- 1. HERO -->
    <section class="hero hero--no-portrait">
      <div class="hero-content">
        <p class="hero-kicker">CLINICIAN · BUILDER · DALLAS, TX</p>
        <h1 class="hero-name">Maha Mohammad</h1>
        <p class="hero-deck">Five years at the bedside.<br>One tool my physicians actually use.</p>
        <p class="hero-bio">Lead Medical Assistant at Innovative &amp; Platinum Dermatology. Pediatric ER scribe before that. I build search-first clinical references from inside the practice.</p>
        <div class="hero-actions">
          <a href="mailto:hello@maha.example" class="site-btn">Contact</a>
          <a href="/maha/cv.pdf" class="site-btn site-btn--soft">CV ↓</a>
          <a href="/mahaclinic/" class="site-btn site-btn--soft">Mahaclinic ↗</a>
        </div>
      </div>
    </section>

    <!-- 2. ON THE RECORD -->
    <section class="maha-record-strip">
      <header class="record-header">
        <span>ON THE RECORD</span>
        <span>2019 → 2026</span>
      </header>
      <dl class="record-rows">
        <div><dt>Years post-graduate clinical</dt><dd>7</dd></div>
        <div><dt>Patient encounters, est.</dt><dd>12,000+</dd></div>
        <div><dt>Hours scribe (peds + ER)</dt><dd>4,200+</dd></div>
        <div><dt>Hours Lead MA (dermatology)</dt><dd>6,000+</dd></div>
        <div><dt>Biologic dosing flows shipped</dt><dd>24</dd></div>
        <div><dt>Clinicians using mahaclinic</dt><dd>—</dd></div>
        <div><dt>Practice sites using the tool</dt><dd>3</dd></div>
      </dl>
    </section>

    <!-- 3. FEATURED · MAHACLINIC -->
    <section class="maha-case-study-panel">
      <header class="section-rule"><span>FEATURED · 2026</span></header>
      <div class="case-grid">
        <div class="case-prose">
          <p class="case-eyebrow">A PATIENT-SAFETY REFERENCE</p>
          <h2 class="case-title">Mahaclinic — biologic dosing for dermatology MAs.</h2>
          <p class="case-body">
            Twenty-four biologic dosing flows. Search-first. Offline-capable. iPad-friendly.
            Replaces the print binder we used to flip through during patient visits.
            <strong>No PHI stored. No diagnoses. FDA-label lookup only.</strong>
          </p>
          <p class="case-body case-body--quiet">
            Used by clinicians across 3 practice locations since 2026.
          </p>
          <div class="case-actions">
            <a href="/mahaclinic/" class="site-btn">Open the tool ↗</a>
            <a href="/maha/mahaclinic/" class="site-btn site-btn--soft">Case study →</a>
          </div>
        </div>
        <figure class="case-image">
          <img src="/maha/images/mahaclinic-screenshot.png" alt="Mahaclinic search interface screenshot">
          <figcaption>Search · drug · condition</figcaption>
        </figure>
      </div>
    </section>

    <!-- 4. NOW -->
    <section>
      <header class="section-rule"><span>NOW · Q2 2026</span><a href="/maha/now/">archive →</a></header>
      <ul class="now-list">
        <li><span class="now-tag">studying</span> MCAT — target sitting date Aug 2026.</li>
        <li><span class="now-tag">shipping</span> Two more dosing flows: bimzelx HS pediatric and tremfya HS.</li>
        <li><span class="now-tag">reading</span> Atul Gawande, <em>Being Mortal</em>. Eric Topol, <em>Deep Medicine</em>.</li>
        <li><span class="now-tag">applying</span> 2027–28 MD/DO cycle. Texas-focused.</li>
      </ul>
    </section>

    <!-- 5. EXPERIENCE -->
    <section>
      <header class="section-rule"><span>EXPERIENCE</span></header>
      <ul class="maha-experience-list">
        <li class="maha-experience-row">
          <span class="exp-date">2023 –</span>
          <div class="exp-body">
            <div class="exp-title">Lead Medical Assistant</div>
            <div class="exp-org">Innovative &amp; Platinum Dermatology · Plano, TX</div>
            <div class="exp-detail">Biologic injections, biopsy assist, prior-auth, MA team lead.</div>
          </div>
          <span class="exp-annot">3 yrs · ~240 pt/wk</span>
        </li>
        <li class="maha-experience-row">
          <span class="exp-date">2021–23</span>
          <div class="exp-body">
            <div class="exp-title">Emergency Department Scribe</div>
            <div class="exp-org">Children's Medical Center · Dallas, TX</div>
            <div class="exp-detail">Pediatric ER, 12-hour shifts, MD-paired documentation.</div>
          </div>
          <span class="exp-annot">12-hr shifts · ~2,000 hr</span>
        </li>
        <li class="maha-experience-row">
          <span class="exp-date">2019–21</span>
          <div class="exp-body">
            <div class="exp-title">Pediatric Scribe</div>
            <div class="exp-org">Children's Medical Center · Plano, TX</div>
            <div class="exp-detail">General pediatrics; chronic-care continuity.</div>
          </div>
          <span class="exp-annot">2 yrs · ~2,200 hr</span>
        </li>
        <li class="maha-experience-row">
          <span class="exp-date">2015–19</span>
          <div class="exp-body">
            <div class="exp-title">B.S. Neuroscience</div>
            <div class="exp-org">The University of Texas at Dallas</div>
            <div class="exp-detail">President, Islamic Relief UTD. VP of Membership, Gamma Sigma Sigma. Active across campus.</div>
          </div>
          <span class="exp-annot">UTD · Dallas, TX</span>
        </li>
      </ul>
    </section>

    <!-- 6. COMPETENCIES (preview) -->
    <section>
      <header class="section-rule"><span>AAMC PREMED COMPETENCIES</span><a href="/maha/competencies/">full mapping →</a></header>
      <div class="competency-preview">
        <article>
          <p class="comp-label">Empathy &amp; Compassion</p>
          <p class="comp-body">Pediatric ER + chronic skin-disease patients with disfigurement and depression overlap.</p>
        </article>
        <article>
          <p class="comp-label">Critical Thinking</p>
          <p class="comp-body">Translating FDA labels + registry guidelines into a usable clinician-facing PWA.</p>
        </article>
        <article>
          <p class="comp-label">Service Orientation</p>
          <p class="comp-body">Five years direct patient care across pediatric ER, ER, and chronic-disease dermatology populations.</p>
        </article>
        <article>
          <p class="comp-label">Commitment to Learning</p>
          <p class="comp-body">Self-taught agentic AI tooling; advanced from scribe → Lead MA → builder.</p>
        </article>
      </div>
    </section>

    <!-- 7. SELECTED WORK -->
    <section>
      <header class="section-rule"><span>SELECTED WORK</span></header>
      <ul class="ruled-list">
        <li class="ruled-row"><a href="/maha/mahaclinic/">
          <span class="ruled-date">2026</span>
          <div class="ruled-body">
            <div class="ruled-title">Mahaclinic — search-first biologic dosing reference</div>
            <div class="ruled-excerpt">A PWA used by clinicians at 3 practice sites. No PHI stored.</div>
            <div class="ruled-meta">PWA · CLINICAL REFERENCE</div>
          </div>
        </a></li>
      </ul>
    </section>

    <!-- 8. WRITINGS (v1 placeholder) -->
    <section>
      <header class="section-rule"><span>WRITINGS</span></header>
      <p class="writings-placeholder">
        Notes from the practice — coming soon. Next: "The chart no one had time to make."
      </p>
    </section>

    <!-- 9. ABOUT (short, link to full) -->
    <section>
      <header class="section-rule"><span>ABOUT</span><a href="/maha/about/">full bio →</a></header>
      <p class="about-short">
        I'm a Lead Medical Assistant at Innovative &amp; Platinum Dermatology in the Dallas–Fort Worth area, where I help run the team supporting chronic-disease patients on biologic therapy. Before this, I spent two years as a pediatric scribe in Children's Medical Center, Plano, then two more in Children's Medical Center, Dallas's emergency department.
      </p>
      <p class="about-short">
        I built mahaclinic because the print binder we relied on for biologic dosing was the slowest thing in the room. The arc is intentional: pediatric ER taught me throughput, dermatology taught me longitudinal care, and building inside the practice taught me what a good clinical tool actually looks like.
      </p>
    </section>

    <footer class="site-colophon">
      <span>Maha Mohammad · 2026</span>
      <span>Built on Pelican · Bordeaux + Sepia on Parchment</span>
      <span>Last updated <time datetime="2026-05-19">2026-05-19</time></span>
    </footer>

  </main>
</body>
</html>
```

- [ ] **Step 4: Run, confirm all home-page tests pass**

```bash
uv run pytest tests/test_maha_portfolio.py -v
```
Expected: All home-page content tests PASS. Pelican build test passes too.

- [ ] **Step 5: Commit**

```bash
git add content/extra/maha/index.html tests/test_maha_portfolio.py
git commit -m "feat(maha): home page — hero · record · featured · now · experience · competencies preview

Renders at /maha/. All 9 sections in spec order. Hero is no-portrait
variant with the approved tagline. On-the-Record has 7 metric rows
(2 still placeholder until Maha provides). Featured carries the
patient-safety framing per spec decision 13. Now carries the quiet
med-school signal as one bullet."
```

---

### Task 12: Create about page

**Files:**
- Create: `content/extra/maha/about/index.html`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing tests**

```python
def test_about_builds():
    assert (OUTPUT / "maha" / "about" / "index.html").exists()

def test_about_has_drop_cap_class():
    about = (OUTPUT / "maha" / "about" / "index.html").read_text()
    assert "has-dropcap" in about

def test_about_links_back_home():
    about = (OUTPUT / "maha" / "about" / "index.html").read_text()
    assert 'href="/maha/"' in about
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Create `content/extra/maha/about/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#6B1F2B">
  <title>About — Maha Mohammad</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="/theme/css/maha-tokens.css">
  <link rel="stylesheet" href="/theme/css/maha.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a href="/maha/" class="site-logo">Maha Mohammad</a>
      <nav class="site-nav" aria-label="Primary">
        <ul>
          <li><a href="/maha/about/" aria-current="page">About</a></li>
          <li><a href="/maha/mahaclinic/">Mahaclinic</a></li>
          <li><a href="/maha/competencies/">Competencies</a></li>
          <li><a href="/maha/now/">Now</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="site-main">
    <a href="/maha/" class="article-back">← back</a>

    <header class="article-header">
      <p class="article-kicker">ABOUT</p>
      <h1 class="article-title">A short bio.</h1>
      <p class="article-date">Last updated 2026-05-19</p>
    </header>

    <article class="article-prose">
      <p class="has-dropcap">The first patient I remember by name was a six-year-old in the pediatric ER on a Saturday night, here for the second time that week with the same fever that kept resolving and recurring. I was a scribe. The attending walked me through the history while she examined him. I learned more clinical reasoning in that one shift than I had in the previous semester of organic chemistry — and I knew then that medicine was going to be the work.</p>

      <p>I'm a Lead Medical Assistant at Innovative &amp; Platinum Dermatology in the Dallas–Fort Worth area. I run the team supporting chronic-disease patients on biologic therapy — psoriasis, atopic dermatitis, hidradenitis suppurativa, urticaria — through the long arcs of dose adjustments, prior authorizations, infection surveillance, and the inevitable insurance fights that come with $80,000-a-year medications.</p>

      <p>Before this, I spent two years as a pediatric scribe in Children's Medical Center, Plano, and another two years in Children's Medical Center, Dallas's emergency department, working twelve-hour shifts that taught me throughput, triage, and the very particular skill of holding a still face while a parent is breaking down in front of you.</p>

      <p>Between those two halves of my training, I finished a B.S. in Neuroscience at the University of Texas at Dallas in 2019. On campus I was President of Islamic Relief UTD and VP of Membership for Gamma Sigma Sigma. I was the kind of student who treated extracurriculars as a second curriculum.</p>

      <div class="book-ornament" style="text-align:center; color:var(--ink); opacity:0.7; margin: 2rem 0; letter-spacing: 0.7em;">❦ &nbsp; ❦ &nbsp; ❦</div>

      <p>The arc to medicine is intentional. Pediatric ER taught me how decisions get made in seconds. Dermatology taught me how the same disease looks across the years it takes to manage it. And the gap years — these five years — taught me that healthcare runs on small frictions: the print binder that takes too long to flip through, the prior-auth form that gets denied for the wrong reason, the dosing calculation that gets done in your head when it should be in a tool.</p>

      <p>I built mahaclinic because the print binder for biologic dosing was the slowest thing in our exam rooms. The tool started as a personal cheat sheet and grew, over a few weekends, into something the rest of the practice uses. It's used at three locations now. It does one job — search a drug, find the dose, find the contraindications — and it is religiously focused on doing only that job. It does not store PHI. It does not diagnose. It does not recommend anything beyond what the FDA label already says. That restraint is the point.</p>

      <p>I'm now preparing for the MCAT and applying to medical school in the 2027–28 cycle. I'm Texas-focused but open to programs whose missions align with chronic-care, primary-care, and community health. I want to be the physician who keeps building the small tools the workflow actually needs.</p>

      <p>If you're an interviewer or a recommender and you've landed here from one of my essays, the <a href="/maha/competencies/">competencies mapping</a> and the <a href="/maha/mahaclinic/">mahaclinic case study</a> may be useful starting points. The site is a working surface, not a finished one — it grows as I do.</p>
    </article>

    <footer class="site-colophon">
      <span>Maha Mohammad · 2026</span>
      <span><a href="/maha/">home</a></span>
    </footer>
  </main>
</body>
</html>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add content/extra/maha/about/index.html tests/test_maha_portfolio.py
git commit -m "feat(maha): about page — long-form bio essay with drop cap

Newsreader long-form, drop cap on opener, dingbat divider, links to
competencies + mahaclinic case study at the close. Content is a v1
draft — Maha edits as needed."
```

---

### Task 13: Create mahaclinic case study page

**Files:**
- Create: `content/extra/maha/mahaclinic/index.html`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing tests**

```python
def test_case_study_builds():
    assert (OUTPUT / "maha" / "mahaclinic" / "index.html").exists()

def test_case_study_has_patient_safety_framing():
    cs = (OUTPUT / "maha" / "mahaclinic" / "index.html").read_text()
    assert "No PHI stored" in cs or "no PHI stored" in cs
    assert "FDA-label" in cs or "FDA label" in cs
    assert "No diagnoses" in cs or "no diagnoses" in cs

def test_case_study_links_live_tool():
    cs = (OUTPUT / "maha" / "mahaclinic" / "index.html").read_text()
    assert 'href="/mahaclinic/"' in cs
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Create `content/extra/maha/mahaclinic/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#6B1F2B">
  <title>Mahaclinic — case study · Maha Mohammad</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="/theme/css/maha-tokens.css">
  <link rel="stylesheet" href="/theme/css/maha.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a href="/maha/" class="site-logo">Maha Mohammad</a>
      <nav class="site-nav" aria-label="Primary">
        <ul>
          <li><a href="/maha/about/">About</a></li>
          <li><a href="/maha/mahaclinic/" aria-current="page">Mahaclinic</a></li>
          <li><a href="/maha/competencies/">Competencies</a></li>
          <li><a href="/maha/now/">Now</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="site-main">
    <a href="/maha/" class="article-back">← back</a>

    <header class="article-header">
      <p class="article-kicker">CASE STUDY · 2026</p>
      <h1 class="article-title">Mahaclinic — biologic dosing, search-first.</h1>
      <p class="article-date">Live at <a href="/mahaclinic/">sohailmo.ai/mahaclinic</a></p>
    </header>

    <article class="article-prose">

      <h2>The problem</h2>
      <p>Our practice manages a few hundred patients on biologic therapy for chronic skin disease — psoriasis, atopic dermatitis, hidradenitis suppurativa, chronic urticaria. Twenty-four FDA-approved biologics across those indications, each with its own loading schedule, maintenance interval, weight-based dose, age cutoff, and contraindication list. The reference for all of this lived in a print binder on the counter outside the exam rooms.</p>

      <p>Flipping through the binder mid-visit took 20–40 seconds — long enough for a parent to start asking another question, long enough to lose continuity, long enough to make the decision feel hurried. The information was always correct. The retrieval was always slow.</p>

      <h2>What I built</h2>
      <p>Mahaclinic is a search-first dosing reference. You type the drug name or the condition; the right flow appears. The flow shows: indication, age range, weight-based or fixed dose, loading schedule, maintenance interval, contraindications, monitoring, and the exact FDA-label citation. It is offline-capable and iPad-friendly. The whole thing is a PWA — install it once, use it forever, no app store.</p>

      <h2>What it intentionally does not do</h2>
      <p><strong>No PHI is stored. No diagnoses are made. No recommendations are issued beyond what the FDA label already says.</strong> Mahaclinic is a reference tool, not a decision-support tool. It surfaces information faster. It does not make the decision; the clinician does.</p>

      <p>That restraint is a design decision, not a limitation. A reference tool with no PHI has no auditable patient record, no consent burden, no IRB question, no MDR liability tail. It can be used by any clinician in any room without becoming part of the medical record. It does one job, narrowly defined, and refuses to drift into adjacent jobs.</p>

      <h2>The decisions</h2>

      <h3>Search-first, not navigation-first</h3>
      <p>The print binder was navigation-first: indication tabs, then drug, then dose. Most of the lookups were drug-first ("what's the maintenance dose for taltz again?") or symptom-first ("what biologics are approved for HS?"). Inverting the structure to put search at the top of every page cut the median lookup to under five seconds.</p>

      <h3>PWA, not native app</h3>
      <p>An iOS app would have required App Store review, a developer account, and updates per device. A PWA installs from Safari with two taps, updates instantly, and works offline once cached. For a tool consumed by a fixed set of clinicians, a PWA is the correct delivery surface.</p>

      <h3>One source of truth for content</h3>
      <p>Every dose flow was hand-extracted from the team-authored print flowcharts that the practice had already produced and reviewed. The tool does not paraphrase, summarize, or generate. It reproduces what the team already wrote, in a searchable surface.</p>

      <h2>Who uses it</h2>
      <p>Clinicians across three practice locations since 2026. The tool surfaces a "report an issue" link on every drug page; corrections route back to the team that authored the original flowcharts.</p>

      <h2>What's next</h2>
      <ul>
        <li>Two additional flows in development: bimzelx HS pediatric and tremfya HS.</li>
        <li>A "what changed since last visit" view for prior-auth turn-around.</li>
        <li>A no-PHI calculation panel for weight-based loading doses (still FDA-label-derived only).</li>
      </ul>

      <h2>Open the tool</h2>
      <p><a href="/mahaclinic/">sohailmo.ai/mahaclinic →</a></p>
    </article>

    <footer class="site-colophon">
      <span>Maha Mohammad · 2026</span>
      <span><a href="/maha/">home</a></span>
    </footer>
  </main>
</body>
</html>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add content/extra/maha/mahaclinic/index.html tests/test_maha_portfolio.py
git commit -m "feat(maha): mahaclinic case study — patient-safety framing throughout

Sections: problem · what I built · what it intentionally does NOT do
· decisions · who uses it · what's next · live link. Carries the
explicit guardrails copy required by spec acceptance M5."
```

---

### Task 14: Create competencies mapping page

**Files:**
- Create: `content/extra/maha/competencies/index.html`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing tests**

```python
def test_competencies_builds():
    assert (OUTPUT / "maha" / "competencies" / "index.html").exists()

def test_competencies_has_at_least_15_rows():
    comp = (OUTPUT / "maha" / "competencies" / "index.html").read_text()
    n_rows = comp.count('<li class="ct-row">')
    assert n_rows >= 15, f"expected ≥ 15 competency rows, found {n_rows}"

def test_competencies_cites_aamc():
    comp = (OUTPUT / "maha" / "competencies" / "index.html").read_text()
    assert "AAMC" in comp
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Create `content/extra/maha/competencies/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#6B1F2B">
  <title>Competencies mapping — Maha Mohammad</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="/theme/css/maha-tokens.css">
  <link rel="stylesheet" href="/theme/css/maha.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a href="/maha/" class="site-logo">Maha Mohammad</a>
      <nav class="site-nav" aria-label="Primary">
        <ul>
          <li><a href="/maha/about/">About</a></li>
          <li><a href="/maha/mahaclinic/">Mahaclinic</a></li>
          <li><a href="/maha/competencies/" aria-current="page">Competencies</a></li>
          <li><a href="/maha/now/">Now</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="site-main">
    <a href="/maha/" class="article-back">← back</a>

    <header class="article-header">
      <p class="article-kicker">AAMC PREMED COMPETENCIES</p>
      <h1 class="article-title">How my five years map to the AAMC framework.</h1>
      <p class="article-date">Current as of the 2026 AAMC framework</p>
    </header>

    <article class="article-prose">
      <p>The AAMC's <a href="https://students-residents.aamc.org/real-stories-demonstrating-premed-competencies/premed-competencies-entering-medical-students">Premed Competencies for Entering Medical Students</a> were refreshed in late 2023 and renamed again in 2026 (Cultural Humility → Self-Awareness; Cultural Awareness → Understanding Others). What follows is a literal mapping of my five years of pediatric scribe + ER scribe + Lead MA + neuroscience + building experience to each competency in the framework. The bullets are concrete because the work is concrete.</p>
    </article>

    <ul class="competency-table">

      <li class="ct-row">
        <span class="ct-name">Service Orientation</span>
        <span class="ct-bullet">Five years of direct patient care: two years pediatric scribe (Children's Plano), two years pediatric ER scribe (Children's Dallas, 12-hour shifts), three years Lead MA in chronic-disease dermatology.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Understanding Others</span>
        <span class="ct-bullet">Multilingual, multicultural patient populations in the DFW metro. Biologic-access disparities by insurance status surfaced as a recurring pattern in derm prior-auth work.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Self-Awareness</span>
        <span class="ct-bullet">Built mahaclinic in response to a specific frustration — a print binder slowing patient visits — rather than to "build something." The restraint about what the tool does NOT do is itself the practice.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Teamwork &amp; Collaboration</span>
        <span class="ct-bullet">Lead MA = literal team leadership; pediatric ER scribe = MD/RN team dynamics under acuity pressure. Mahaclinic deployment required coordinating with three practice sites' MAs to roll out without disrupting workflow.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Oral Communication</span>
        <span class="ct-bullet">Patient education conversations, especially biologic-injection counseling and infection-risk monitoring. ER patient handoffs across shift change.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Ethical Responsibility to Self and Others</span>
        <span class="ct-bullet">HIPAA/PHI handling in PWA design — explicit decision to store no PHI, see "what it does not do" in the case study. Patient-confidentiality reasoning in scribe roles.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Reliability &amp; Dependability</span>
        <span class="ct-bullet">12-hour pediatric ER shifts; 3-year continuous Lead MA tenure with no gap. The 5-year arc is the proof.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Resilience &amp; Adaptability</span>
        <span class="ct-bullet">Pediatric ER environment over two years. Continued building a clinical-tooling skill while working full-time; learning agentic AI tools through self-study during nights and weekends.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Commitment to Learning and Growth</span>
        <span class="ct-bullet">Self-taught agentic AI tooling (Claude Code, Codex) over the past year. Progression scribe → Lead MA → builder reflects a deliberate skill-expansion arc.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Empathy &amp; Compassion</span>
        <span class="ct-bullet">Pediatric ER + chronic skin-disease patients living with visible disfigurement, body image, and overlapping depression/anxiety. Empathy in derm is mostly quiet — sitting with a patient on their fourth biologic — and that is its own skill.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Critical Thinking</span>
        <span class="ct-bullet">Translating FDA prescribing labels and registry guidelines into a usable clinician-facing PWA. Recognizing which information clinicians actually need at point of care vs. which lives in a footnote.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Quantitative Reasoning</span>
        <span class="ct-bullet">Weight-based and BSA-based biologic dosing, weight-cutoff thresholds for pediatric indications, dose-loading-vs-maintenance arithmetic — encoded into mahaclinic flows.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Scientific Inquiry</span>
        <span class="ct-bullet">Neuroscience B.S. (UT Dallas). Reading FDA labels and post-marketing data when researching dose flows for mahaclinic. Reading immunology + dermatology literature to understand mechanism-of-action of biologic classes.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Written Communication</span>
        <span class="ct-bullet">This site, the mahaclinic case study, and the patient stories. ER scribe documentation in real time, MD-paired.</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Human Behavior</span>
        <span class="ct-bullet">Neuroscience training applied to patient adherence patterns in long-term biologic therapy. Behavioral observations in pediatric ER (parent–child dynamics under acute stress).</span>
      </li>

      <li class="ct-row">
        <span class="ct-name">Living Systems</span>
        <span class="ct-bullet">Neuroscience B.S. plus the immunology load required to manage biologic patients (IL-23 / IL-17 / TNF-α / JAK-STAT pathways operationalized through dose decisions every clinic day).</span>
      </li>

    </ul>

    <article class="article-prose">
      <p style="font-style: italic; color: var(--text-deck); font-size: 0.95rem; margin-top: 2rem;">Mapping current as of the 2026 AAMC competency framework. Updates as AAMC revises the framework. Sources: <a href="https://students-residents.aamc.org/real-stories-demonstrating-premed-competencies/premed-competencies-entering-medical-students">AAMC Premed Competencies</a>, <a href="https://students-residents.aamc.org/media/15361/download">Refreshing the Premed Competencies (2023)</a>.</p>
    </article>

    <footer class="site-colophon">
      <span>Maha Mohammad · 2026</span>
      <span><a href="/maha/">home</a></span>
    </footer>
  </main>
</body>
</html>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add content/extra/maha/competencies/index.html tests/test_maha_portfolio.py
git commit -m "feat(maha): competencies page — 16-row AAMC mapping with concrete bullets

Full table maps Maha's pediatric scribe + ER scribe + Lead MA + UTD +
mahaclinic experience to each of the AAMC Premed Competencies (2023
refresh + 2026 rename). Bullets are concrete, not generic, per spec
risk mitigation (specificity is the difference between this reading
as 'thoughtful' and 'performative')."
```

---

### Task 15: Drop CV PDF + screenshot placeholders

**Files:**
- Create: `content/extra/maha/cv.pdf`
- Create: `content/extra/maha/images/mahaclinic-screenshot.png`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing tests**

```python
def test_cv_pdf_ships():
    assert (OUTPUT / "maha" / "cv.pdf").exists()

def test_screenshot_ships():
    assert (OUTPUT / "maha" / "images" / "mahaclinic-screenshot.png").exists()
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Create placeholder files**

For the PDF, create a 1-page placeholder. If Maha has a real CV, drop it in at the same path. Otherwise:

```bash
# Quick placeholder PDF using built-in tools (mac):
cat > /tmp/cv_placeholder.html <<'EOF'
<!DOCTYPE html><html><body style="font-family:Georgia,serif; padding:2in;">
<h1 style="font-style:italic;">Maha Mohammad</h1>
<p>CV placeholder. Real CV to be supplied by Maha.</p>
<p>Contact: hello@maha.example</p>
</body></html>
EOF
# Manual: open the HTML in a browser, "Save as PDF" to
# content/extra/maha/cv.pdf
```

Alternatively, drop an existing PDF Maha has and rename:
```bash
cp ~/Documents/maha-cv-current.pdf content/extra/maha/cv.pdf  # adapt path
```

For the screenshot, take a real screenshot of `https://sohailmo.ai/mahaclinic/` (1200px+ wide) and save to `content/extra/maha/images/mahaclinic-screenshot.png`. If no screenshot is ready, create a 1200×800 placeholder PNG with a clinic-y background:

```bash
mkdir -p content/extra/maha/images
# Use ImageMagick if available; otherwise drop a real screenshot manually.
# Placeholder option (requires ImageMagick):
# convert -size 1200x800 xc:'#faf5e9' -fill '#6B1F2B' \
#   -gravity center -pointsize 36 -annotate +0+0 'mahaclinic preview' \
#   content/extra/maha/images/mahaclinic-screenshot.png
```

- [ ] **Step 4: Run, confirm pass**

```bash
uv run pytest tests/test_maha_portfolio.py -v -k "cv_pdf or screenshot"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add content/extra/maha/cv.pdf content/extra/maha/images/mahaclinic-screenshot.png tests/test_maha_portfolio.py
git commit -m "feat(maha): drop placeholder CV.pdf + mahaclinic screenshot

Both files are placeholders. Maha to supply real versions:
- cv.pdf: current CV (any format that renders 1-2 pages clean)
- mahaclinic-screenshot.png: ≥1200px wide screenshot of the live tool's
  search view"
```

---

### Task 16: Sync mahaclinic styles.css @import

**Files:**
- Modify: `content/extra/mahaclinic/styles.css:3`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_mahaclinic_imports_maha_tokens():
    css = (REPO / "content" / "extra" / "mahaclinic" / "styles.css").read_text()
    assert "@import url('../theme/css/maha-tokens.css')" in css, \
        "mahaclinic styles.css must @import maha-tokens.css (not book-tokens.css)"
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Edit `content/extra/mahaclinic/styles.css` line 3**

Change:
```css
@import url('../theme/css/book-tokens.css');
```
to:
```css
@import url('../theme/css/maha-tokens.css');
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add content/extra/mahaclinic/styles.css tests/test_maha_portfolio.py
git commit -m "feat(mahaclinic): sync palette to maha-tokens — bordeaux + sepia

One-line @import change. Mahaclinic now reads as the same brand as
Maha's portfolio at /maha/. Reversible by reverting this one line."
```

---

### Task 17: Sync mahaclinic theme-color metas

**Files:**
- Modify: `content/extra/mahaclinic/index.html:10`
- Modify: `content/extra/mahaclinic/about/index.html:10`
- Modify: `content/extra/mahaclinic/drug.html:10` (if present)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing tests**

```python
def test_mahaclinic_index_theme_color_bordeaux():
    src = (REPO / "content" / "extra" / "mahaclinic" / "index.html").read_text()
    assert '<meta name="theme-color" content="#6B1F2B">' in src

def test_mahaclinic_about_theme_color_bordeaux():
    src = (REPO / "content" / "extra" / "mahaclinic" / "about" / "index.html").read_text()
    assert '<meta name="theme-color" content="#6B1F2B">' in src
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Edit each file's line 10**

For each of the three files (`content/extra/mahaclinic/index.html`, `content/extra/mahaclinic/about/index.html`, `content/extra/mahaclinic/drug.html` if it exists with the meta):

Change:
```html
<meta name="theme-color" content="#3A4F2A">
```
to:
```html
<meta name="theme-color" content="#6B1F2B">
```

If `drug.html` has no theme-color meta, skip that file.

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add content/extra/mahaclinic/*.html
git commit -m "feat(mahaclinic): update PWA theme-color to bordeaux #6B1F2B

Aligns the iOS/Android browser-chrome color with the bordeaux palette
loaded by maha-tokens.css. Completes the mahaclinic palette sync."
```

---

### Task 18: Add acceptance-criteria grep tests

**Files:**
- Modify: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append the remaining acceptance-criteria tests**

```python
# ── Acceptance-criteria grep checks (spec §11 + §16) ──────

def test_no_moss_in_maha_tree():
    """M2: no #3A4F2A anywhere in maha source or maha CSS."""
    targets = [
        REPO / "theme" / "static" / "css" / "maha-tokens.css",
        REPO / "theme" / "static" / "css" / "maha.css",
    ] + list((REPO / "content" / "extra" / "maha").rglob("*.html"))
    for f in targets:
        text = f.read_text(errors='ignore')
        assert "#3A4F2A" not in text.upper() and "#3a4f2a" not in text.lower(), \
            f"moss color #3A4F2A found in {f}"

def test_no_moss_in_mahaclinic_styles():
    """M2: mahaclinic styles must not contain moss after palette sync."""
    css = (REPO / "content" / "extra" / "mahaclinic" / "styles.css").read_text()
    assert "#3A4F2A" not in css.upper(), \
        "mahaclinic styles.css must not reference moss after sync"

def test_no_inter_font_in_maha():
    """M3: no font-family: 'Inter' anywhere in maha CSS or HTML."""
    targets = [
        REPO / "theme" / "static" / "css" / "maha-tokens.css",
        REPO / "theme" / "static" / "css" / "maha.css",
    ] + list((REPO / "content" / "extra" / "maha").rglob("*.html"))
    for f in targets:
        text = f.read_text(errors='ignore')
        assert "Inter" not in text, f"'Inter' font referenced in {f}"

def test_no_public_gpa_or_mcat_score():
    """M11: GPA never mentioned; MCAT only as a verb ('studying MCAT'), never with a score."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    about = (OUTPUT / "maha" / "about" / "index.html").read_text()
    for text, name in [(home, "home"), (about, "about")]:
        assert re.search(r"\bGPA\b", text) is None, f"GPA mentioned in {name}"
        score_pattern = re.compile(r"MCAT.{0,15}(\b\d{3}\b)")
        assert score_pattern.search(text) is None, f"MCAT score appears in {name}"

def test_no_specialty_fixation():
    """M12: 'I want to be a dermatologist' or equivalent must not appear."""
    targets = list((REPO / "content" / "extra" / "maha").rglob("*.html"))
    for f in targets:
        text = f.read_text(errors='ignore').lower()
        # Heuristic: combine 'i want to be' with specialty names.
        bad_phrases = [
            "want to be a dermatologist",
            "i want to specialize in",
            "going into dermatology",
        ]
        for phrase in bad_phrases:
            assert phrase not in text, f"specialty-fixation phrase {phrase!r} in {f}"

def test_home_title_clinician_builder():
    """M13: home title is the clinician+builder framing, not 'pre-med'."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "<title>Maha Mohammad — clinician + builder</title>" in home
    assert "pre-med" not in home.lower()
    assert "premed" not in home.lower()

def test_no_third_party_tracking():
    """M20: no analytics scripts loaded."""
    targets = list((REPO / "content" / "extra" / "maha").rglob("*.html"))
    for f in targets:
        text = f.read_text(errors='ignore').lower()
        for token in ["ga.js", "gtag", "google-analytics", "hotjar", "fbq("]:
            assert token not in text, f"tracking token {token!r} in {f}"
```

- [ ] **Step 2: Run the full test suite**

```bash
uv run pytest tests/test_maha_portfolio.py -v
```
Expected: All tests PASS. If any fail, fix the source content (HTML/CSS) until they do — do not modify the test to match.

- [ ] **Step 3: Commit**

```bash
git add tests/test_maha_portfolio.py
git commit -m "test(maha): add acceptance-criteria grep checks per spec §11

Adds tests for: no moss color in maha tree or mahaclinic styles,
no Inter font, no public GPA/MCAT scores, no specialty fixation
phrases, home title is clinician+builder framing, no third-party
tracking. Each test maps to a spec acceptance criterion (M2, M3,
M11, M12, M13, M20)."
```

---

### Task 19: Local Pelican build + Lighthouse audit

**Files:** none (verification only)

- [ ] **Step 1: Run a fresh local Pelican build**

```bash
cd /Users/sohailmo/Documents/Sohailm25.github.io
uv run pelican content -s pelicanconf.py -o output -d
```
Expected: build succeeds with no errors. Output dir contains `output/maha/index.html`, `output/maha/about/index.html`, `output/maha/mahaclinic/index.html`, `output/maha/competencies/index.html`, `output/maha/cv.pdf`, `output/maha/images/mahaclinic-screenshot.png`, plus everything previously building (book, mahaclinic, etc.).

- [ ] **Step 2: Serve locally**

```bash
cd output && python -m http.server 8000 &
```
Open: `http://localhost:8000/maha/`

- [ ] **Step 3: Visual smoke test (manual checklist)**

In a desktop browser:
- [ ] Hero name renders Instrument Serif italic
- [ ] Kicker is JBMono uppercase, dusty-rose-ish color
- [ ] Tagline (deck) is italic display serif
- [ ] On-the-Record block has 7 data rows with tabular nums
- [ ] Featured panel: two-column with screenshot at right
- [ ] Now list has 4 bullets with monospace tag chips
- [ ] Experience has 4 rows with margin annotations on the right
- [ ] Competency preview is 2x2 grid
- [ ] Colors are bordeaux + sepia (no moss anywhere)

- [ ] **Step 4: Mobile smoke test**

DevTools → responsive mode → 375px:
- [ ] No horizontal scroll
- [ ] Hero stacks correctly
- [ ] On-the-Record rows still readable
- [ ] Featured stacks (image above prose)
- [ ] Competency preview becomes 1 column
- [ ] Experience-row margin-annot moves below body

- [ ] **Step 5: Lighthouse audit**

```bash
npx lighthouse http://localhost:8000/maha/ \
  --only-categories=performance,accessibility,best-practices \
  --output=json --quiet --chrome-flags="--headless" \
  > /tmp/lighthouse-maha-home.json
jq '.categories | to_entries[] | "\(.key): \(.value.score)"' /tmp/lighthouse-maha-home.json
```
Expected: performance ≥ 0.90, accessibility ≥ 0.95, best-practices ≥ 0.95. If any falls short, identify the failed audit and fix.

Repeat for the case study:
```bash
npx lighthouse http://localhost:8000/maha/mahaclinic/ \
  --only-categories=performance,accessibility,best-practices \
  --output=json --quiet --chrome-flags="--headless" \
  > /tmp/lighthouse-maha-case.json
jq '.categories | to_entries[] | "\(.key): \(.value.score)"' /tmp/lighthouse-maha-case.json
```

- [ ] **Step 6: Kill the server**

```bash
# Find and kill the python http.server process
pkill -f "http.server 8000"
```

- [ ] **Step 7: Commit nothing yet — proceed to Task 20**

If anything failed, fix it in a new task before moving on. Do not commit failing audits.

---

### Task 20: Run full test suite + final v1 commit

**Files:** none (final verification)

- [ ] **Step 1: Run the FULL repo test suite to ensure no regressions**

```bash
cd /Users/sohailmo/Documents/Sohailm25.github.io
uv run pytest -v
```
Expected: All tests PASS (existing book, mahaclinic, and migration tests + new maha tests). If any regress, fix before merge.

- [ ] **Step 2: Quick review of all v1 changes**

```bash
git log --oneline master..wip/maha-portfolio
```
Expected: a clean per-task commit list, ~20 commits.

- [ ] **Step 3: Confirm with Sohail before merging to master**

(This is an explicit gate — destructive-commands rule. Ask Sohail:
*"v1 ready to merge. ~20 commits on wip/maha-portfolio. Merge with `--no-ff` to master and push?"*)

- [ ] **Step 4: Merge with --no-ff (after explicit Sohail approval)**

```bash
git checkout master
git merge --no-ff wip/maha-portfolio -m "$(cat <<'EOF'
Merge wip/maha-portfolio: Maha's portfolio site v1

Ships sohailmo.ai/maha/ — broadsheet aesthetic in bordeaux + sepia.
- Home: hero · On-the-Record · Featured (mahaclinic) · Now · Experience
  · Competencies preview · Selected Work · Writings placeholder · About
- Subpages: /about/, /mahaclinic/ (case study), /competencies/
- mahaclinic palette synced to bordeaux

Test infra at tests/test_maha_portfolio.py; full suite passes.

Spec: history/2026-05-19-maha-portfolio-design.md
Research: research/2026-05-19-med-school-admissions-may-2026.md
Plan: history/2026-05-19-maha-portfolio-plan.md
EOF
)"
```

- [ ] **Step 5: Push to origin/master (after explicit Sohail approval)**

```bash
git push origin master
```

- [ ] **Step 6: Verify deploy**

After GitHub Actions completes (~3-5 minutes):
```bash
curl -sI https://sohailmo.ai/maha/ | head -1
# Expected: 200 OK

curl -sI https://sohailmo.ai/mahaclinic/ | head -1
# Expected: 200 OK (still works after palette sync)
```

Visual check:
- Open `https://sohailmo.ai/maha/` in a browser — bordeaux palette confirmed
- Open `https://sohailmo.ai/mahaclinic/` — should also be bordeaux

---

## v2 Tasks (Private pages, stories — after v1 ships)

### Task 21: Create /maha/now/ archive page

**Files:**
- Create: `content/extra/maha/now/index.html`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing test**

```python
def test_now_archive_builds():
    assert (OUTPUT / "maha" / "now" / "index.html").exists()

def test_now_archive_has_at_least_5_entries():
    now = (OUTPUT / "maha" / "now" / "index.html").read_text()
    n_rows = now.count('<li class="maha-now-row">')
    assert n_rows >= 5, f"expected ≥ 5 now-rows, found {n_rows}"
```

- [ ] **Step 2: Confirm fail**

- [ ] **Step 3: Create `content/extra/maha/now/index.html`** with at least 5 seed entries (Maha provides real ones; placeholder uses recent mahaclinic git history as seed material). Structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#6B1F2B">
  <title>Now — Maha Mohammad</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="/theme/css/maha-tokens.css">
  <link rel="stylesheet" href="/theme/css/maha.css">
</head>
<body>
  <header class="site-header"><!-- nav same as other pages --></header>
  <main class="site-main">
    <a href="/maha/" class="article-back">← back</a>
    <header class="article-header">
      <p class="article-kicker">NOW · UPDATES LOG</p>
      <h1 class="article-title">What I've been doing.</h1>
      <p class="article-date">Updated rolling — see most recent at top</p>
    </header>
    <ul class="maha-experience-list"><!-- reuse this class for the log -->
      <li class="maha-now-row">
        <span class="now-date">2026-05-19</span>
        <div class="now-body">Spec'd and started building this portfolio site. Approved IA + tagline + palette.</div>
      </li>
      <li class="maha-now-row">
        <span class="now-date">2026-05-10</span>
        <div class="now-body">Shipped tremfya HS dosing flow to mahaclinic. Tested across all 3 sites.</div>
      </li>
      <li class="maha-now-row">
        <span class="now-date">2026-04-22</span>
        <div class="now-body">Completed CARS practice block #4. Reviewing AAMC sample questions next.</div>
      </li>
      <li class="maha-now-row">
        <span class="now-date">2026-04-15</span>
        <div class="now-body">Presented mahaclinic at clinic in-service. Two more MAs asked to be onboarded.</div>
      </li>
      <li class="maha-now-row">
        <span class="now-date">2026-04-01</span>
        <div class="now-body">Onboarded bimzelx HS pediatric reference into mahaclinic. Reviewed FDA label updates.</div>
      </li>
    </ul>
    <footer class="site-colophon"><span><a href="/maha/">home</a></span></footer>
  </main>
</body>
</html>
```

- [ ] **Step 4: Run, confirm pass**

- [ ] **Step 5: Commit**

```bash
git checkout -b wip/maha-portfolio-v2 master   # branch from current master
git add content/extra/maha/now/index.html tests/test_maha_portfolio.py
git commit -m "feat(maha): v2 — /now/ archive page with 5 seed entries"
```

---

### Task 22: Create patient story library

**Files:**
- Create: `content/extra/maha/stories/index.html`
- Create: `content/extra/maha/stories/<slug>/index.html` × 4-6 (Maha picks slugs)
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing tests**

```python
def test_stories_index_builds():
    assert (OUTPUT / "maha" / "stories" / "index.html").exists()

def test_stories_index_noindex():
    s = (OUTPUT / "maha" / "stories" / "index.html").read_text()
    assert 'name="robots"' in s and "noindex" in s and "nofollow" in s

def test_stories_index_has_at_least_4_entries():
    s = (OUTPUT / "maha" / "stories" / "index.html").read_text()
    assert s.count('class="ruled-row"') >= 4
```

- [ ] **Step 2: Confirm fail**

- [ ] **Step 3: Create the stories index** (mirrors `about/index.html` shape) with `<meta name="robots" content="noindex,nofollow">` in `<head>`, followed by an intro paragraph (de-identification disclaimer) and a `.ruled-list` of 4-6 story rows. Then create each individual vignette page using the `.story-vignette` class defined in Task 9, also with `noindex,nofollow` meta. Vignette structure:

```html
<article class="story-vignette">
  <h3>Setting</h3>
  <p>(1 sentence — clinical setting, de-identified.)</p>
  <h3>What happened</h3>
  <p>(2-3 sentences.)</p>
  <h3>What I did</h3>
  <p>(1-2 sentences.)</p>
  <h3>What I learned</h3>
  <p>(1-2 sentences.)</p>
</article>
```

Content comes from Maha. v2 ships when she provides 4-6 vignettes.

- [ ] **Step 4: Confirm tests pass**

- [ ] **Step 5: Commit**

```bash
git add content/extra/maha/stories/ tests/test_maha_portfolio.py
git commit -m "feat(maha): v2 — patient story library at /stories/, noindex

4-6 de-identified vignettes. Doubles as Casper/PREview rehearsal and
interview prep material. Each page carries robots:noindex,nofollow per
spec decision 28 (public discoverability is via direct link only)."
```

---

### Task 23: Create /for-interviewers/ page

**Files:**
- Create: `content/extra/maha/for-interviewers/index.html`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Append failing tests**

```python
def test_for_interviewers_noindex():
    s = (OUTPUT / "maha" / "for-interviewers" / "index.html").read_text()
    assert 'name="robots"' in s and "noindex" in s
```

- [ ] **Step 2: Confirm fail**

- [ ] **Step 3: Create page** — mirrors `competencies/index.html` shape, robots:noindex,nofollow meta, opens with: *"Topics I'd love to discuss in an interview, if useful."* Followed by a `.competency-table`-style list of 5-10 prompts (topic + 1-sentence elaboration). Closes with link block to live tool · case study · competencies.

- [ ] **Step 4: Confirm pass**

- [ ] **Step 5: Commit**

```bash
git add content/extra/maha/for-interviewers/ tests/test_maha_portfolio.py
git commit -m "feat(maha): v2 — /for-interviewers/ noindex, 5-10 conversation prompts

Linkable from personal-statement footers and interview-prep emails.
Not advertised. Reuses competency-table layout pattern for prompts."
```

---

### Task 24: Create /for-letter-writers-<rand>/ page

**Files:**
- Create: `content/extra/maha/for-letter-writers-<8charrand>/index.html`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Generate the random URL suffix ONCE, store it as a constant**

```bash
# Generate 8-char random suffix (record this value somewhere safe — Maha shares
# it with recommenders via email and it never changes):
python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(8)))"
# Example output: x7k2m9pz
```

Use the generated suffix consistently below. Replace `<RAND>` everywhere with the actual value (e.g., `x7k2m9pz`).

- [ ] **Step 2: Append failing test (using the generated suffix)**

```python
def test_for_letter_writers_noindex():
    # Replace <RAND> with the actual generated suffix
    s = (OUTPUT / "maha" / "for-letter-writers-x7k2m9pz" / "index.html").read_text()
    assert 'name="robots"' in s and "noindex" in s
    # Confirm no public link to this URL exists anywhere on the site
    public_pages = [
        OUTPUT / "maha" / "index.html",
        OUTPUT / "maha" / "about" / "index.html",
        OUTPUT / "maha" / "mahaclinic" / "index.html",
        OUTPUT / "maha" / "competencies" / "index.html",
        OUTPUT / "maha" / "now" / "index.html",
    ]
    for p in public_pages:
        assert "for-letter-writers" not in p.read_text(), \
            f"for-letter-writers URL leaked into public page {p}"
```

- [ ] **Step 3: Confirm fail**

- [ ] **Step 4: Create the page**

`content/extra/maha/for-letter-writers-<RAND>/index.html` — opens with the recommender thank-you paragraph; per-recommender blocks (Maha provides the recommender list); general context block with timeline + mahaclinic + competencies links. `robots:noindex,nofollow` meta. Critically: **do not link to this URL from anywhere else on the site.**

- [ ] **Step 5: Confirm tests pass — including the "no public link" assertion**

- [ ] **Step 6: Commit**

```bash
git add "content/extra/maha/for-letter-writers-<RAND>/" tests/test_maha_portfolio.py
git commit -m "feat(maha): v2 — /for-letter-writers-<RAND>/ private recommender resource

URL has 8-char random suffix as discoverability barrier.
robots:noindex,nofollow. No public link from anywhere on the site;
Maha shares the URL only via email to recommenders. Per spec decision
17, the random suffix is generated once and never changes."
```

---

### Task 25: Update home page Now section + add Stories + For-Interviewers links to nav (or not)

**Files:**
- Modify: `content/extra/maha/index.html`
- Test: `tests/test_maha_portfolio.py`

- [ ] **Step 1: Decide whether to add /stories/ + /for-interviewers/ links anywhere visible**

Default: **no**. They're noindex by design; surfacing them in nav contradicts the "linkable but not advertised" framing. Leave them shareable only via direct URL.

If Maha wants the stories visible: add a "STORIES" section to the home page below Writings, reusing `.ruled-list` to enumerate them. The for-interviewers page stays unlisted.

- [ ] **Step 2: Confirm full test suite still green**

```bash
uv run pytest tests/test_maha_portfolio.py -v
```

- [ ] **Step 3: Merge v2 to master (with Sohail's permission)**

```bash
git checkout master
git merge --no-ff wip/maha-portfolio-v2 -m "Merge wip/maha-portfolio-v2: private pages + stories"
git push origin master
```

---

## v3 Tasks (Writings + Artifacts — rolling)

### Task 26 (template): Adding a writing piece

When Maha writes a piece:

- [ ] **Step 1:** Create `content/extra/maha/writings/<slug>/index.html` using the mahaclinic case study page's article-prose pattern as a base. Drop-cap the opener. Section-rule above title.
- [ ] **Step 2:** Add a test:
  ```python
  def test_writing_<slug>_builds():
      assert (OUTPUT / "maha" / "writings" / "<slug>" / "index.html").exists()
  ```
- [ ] **Step 3:** Update home page `/maha/index.html` Writings section: replace `.writings-placeholder` with a `.ruled-list` when the second piece exists.
- [ ] **Step 4:** Commit, push.

### Task 27 (template): Adding an artifact

When Maha completes an artifact:

- [ ] **Step 1:** Create `content/extra/maha/artifacts/<slug>/index.html`.
- [ ] **Step 2:** Update home page `Selected Work` section to add a new `.ruled-row`.
- [ ] **Step 3:** Add a test.
- [ ] **Step 4:** Commit, push.

---

## Self-Review

**Spec coverage check (skimming spec §4 decisions table):**

| Spec decision | Implemented in plan task(s) |
|---|---|
| 1. URL `/maha/` subdir | Task 1 (Pelican walker) + Task 11 (home) |
| 2. Same repo | All tasks |
| 3. Raw HTML walker | Tasks 11-14 |
| 4-5. Bordeaux + Sepia | Task 2 (tokens) |
| 6. Import + override architecture | Task 2 |
| 7. Mahaclinic palette sync | Tasks 16, 17 |
| 8. Clinician-builder framing | Task 11 hero |
| 9. Tagline | Task 11 + grep test |
| 10. No portrait | Task 4 + Task 11 + grep test |
| 11. Hero kicker text | Task 11 + grep test |
| 12. On-the-Record (no card grid) | Tasks 5, 11 |
| 13. Mahaclinic patient-safety framing | Task 13 + grep test |
| 14. Competencies page (full + preview) | Tasks 9, 11, 14 |
| 15. Stories noindex | Task 22 |
| 16. For-interviewers noindex | Task 23 |
| 17. For-letter-writers private | Task 24 |
| 18. Now archive | Task 21 |
| 19. Now med-school line | Task 11 |
| 20. No public scores | Task 18 (grep) |
| 21. UTD activities in row | Task 11 |
| 22. Writings placeholder v1 | Task 11 |
| 23. CV PDF | Task 15 |
| 24. Mobile breakpoints | Task 10 |
| 25. v1/v2/v3 phasing | Whole plan structure |
| 26. Typography inherited | Tasks 2, 3 |
| 27. Per-page hand-built HTML | Tasks 11-14 |
| 28. Noindex private pages | Tasks 22-24 |
| 29. Content acquisition workflow | Task 15 + spec §9 + open question 1 |

**Acceptance criteria check (spec §11):**

| AC | Plan task |
|---|---|
| M1 home renders | Task 11, 19 |
| M2 no moss | Task 18 grep tests |
| M3 no Inter/cards/testimonials | Task 18 grep |
| M4 5/7 metrics real | Task 11 has placeholders flagged; Sohail+Maha fill before v1 ship |
| M5 mahaclinic guardrails copy | Task 13 + grep test |
| M6 15-17 competency rows | Task 14 + count test |
| M7 noindex on private pages | Tasks 22-24 |
| M8 no mobile horizontal scroll | Task 19 manual |
| M9 Lighthouse ≥ 90/95/95 | Task 19 |
| M10 mahaclinic uses bordeaux | Tasks 16, 17 + tests |
| M11 no public GPA/MCAT | Task 18 grep |
| M12 no specialty fixation | Task 18 grep |
| M13 home title clinician+builder | Task 11 + test 18 |
| M14 tagline exact | Task 11 + test |
| M15 no portrait img | Task 11 + test |
| M16 both stylesheets loaded | Task 11 + test |
| M17 mahaclinic @import | Task 16 + test |
| M18 cv.pdf downloads | Task 15 |
| M19 reuse .ruled-list | Task 3 (mirror), Task 11 (use) |
| M20 no tracking | Task 18 grep |

**Placeholder scan:** all open questions in spec §12 are flagged as content Maha provides (not plan placeholders). The plan's only true placeholders are the CV PDF + the screenshot (Task 15), both explicitly called out.

**Type/name consistency:** CSS class names, file paths, test function names, and HTML structure consistent across all 27 tasks. Grid templates match between Task 8 (`90px 1fr auto`) and Task 11 markup. The `.maha-now-row` class is defined in Task 9 and used in Task 21.

**Scope check:** the plan implements exactly v1 + v2; v3 is template-only (rolling content). Mahaclinic palette sync is the only out-of-spec-edit and is one-line per file. Build-pipeline changes are one-line (Pelican walker). Confined.

---

## Execution Handoff

Plan complete and saved to `history/2026-05-19-maha-portfolio-plan.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — A fresh subagent picks up the plan, executes one task, returns; you (Sohail) review the commit and approve before the next task. Slowest per-task but highest visibility into each change. Best when the content (hero copy, On-the-Record numbers, About essay, Competency bullets) will need iterative review with Maha.

**2. Inline Execution** — I execute v1 tasks in this session using the executing-plans skill, batched with a single mid-batch checkpoint after Task 10 (CSS done) and before Task 11 (first HTML page). Fastest path to v1 deploy. Best if you trust the per-task TDD discipline and want to ship quickly. v2 can stay manual.

Which approach?
