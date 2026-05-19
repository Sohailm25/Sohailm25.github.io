# Site Design Rollout — Implementation Plan

> **STATUS 2026-05-19:** Direction pivoted to **parallel v2 deployment** instead of cutover. The cutover plan below is preserved as a future option; the shipped work lives on branch `wip/site-design-rollout-v2-parallel`. See bottom of doc for the v2-parallel architecture.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the book's parchment-and-moss design language across `sohailmo.ai` while preserving the home page hero, About page structure, and overall portfolio function.

**Architecture:** Add `site.css` as a sibling of `book.css`, both consuming `book-tokens.css`. Restyle `base.html` in place (header, nav, social icons, progress bar). Migrate templates one PR at a time (home → writings → article → longform → series → pages). Old `style.css` retires after the last template migrates.

**Tech Stack:** Pelican static site generator, Jinja2 templates, CSS3, Google Fonts (Instrument Serif, Newsreader, JetBrains Mono).

---

## Decisions (locked, from 2026-05-19 brainstorming)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Site frame | Editorial portfolio | Keep hero, photo, bio, section-driven home. Change visual register, not function. |
| 2 | Tokens scope | Sitewide | `book-tokens.css` palette + type + spacing become the new site baseline. |
| 3 | Components scope | Per content type | Broadsheet top-rule everywhere, but drop cap + sidenotes only on long-form essays. Short Thoughts get clean typography without ornament. |
| 4 | Home hero name | "Sohail Mohammad" in Instrument Serif italic | More editorial than lowercase "sohail"; matches publication register. |
| 5 | Section headers | Broadsheet top-rule (3px moss top, 1px moss bottom, mono uppercase label) | Replaces terminal `> section` prefix. |
| 6 | Post listings | Ruled list (mono date column, serif title, mono uppercase meta) | Replaces blog-card grid sitewide. |
| 7 | Buttons | Thin-bordered mono uppercase, like book's part-nav | Drop four-corner-bracket "corner-btn". |
| 8 | Code highlighting | Switch highlight.js to a light theme (`atom-one-light`) | `material-darker` reads as charcoal-on-parchment seam. |
| 9 | About page | Apply tokens; content + structure unchanged | Don't reintroduce two-aesthetic split. |
| 10 | Integration | New `site.css` + restyle `base.html` in place; retire `style.css` after migration | Honest option C from brief. |
| 11 | Drop cap | Opt-in via Markdown class on first paragraph (`<p class="has-dropcap">`) — not automatic | Long-form essays only. |
| 12 | Forge series | Tokens applied; keeps "dispatch" character (banner, signup form) | Newsletter ≠ broadsheet. |

---

## Out of Scope

- `content/extra/book/` (already shipped).
- Essay prose. Visual layer only.
- Dark mode.
- Search, comments, social-share, newsletter modals.
- New content. No essays added or removed.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `theme/static/css/book-tokens.css` | unchanged | Palette, fonts, spacing, type scale (single source of truth). |
| `theme/static/css/book.css` | unchanged | Book-specific components (drop cap, sidenotes, top-rule, mad-libs, evidence). |
| `theme/static/css/site.css` | **new** in PR1 | Site-wide components: nav, hero, ruled list, section top-rule, social icons, buttons. |
| `theme/static/css/style.css` | retired in PR8 | Old design. Kept as fallback during migration. |
| `theme/templates/base.html` | PR1 | Restyle header, nav, social, progress bar. Replace stylesheet links. |
| `theme/templates/index.html` | PR2 | Hero + 3 ruled-list sections. |
| `theme/templates/archives.html` | PR3 | Category filter + ruled list. Drop card grid. |
| `theme/templates/article.html` | PR4 | Short-form essay shell. |
| `theme/templates/longform_article.html` | PR5 | Long-form with sticky TOC sidebar, optional drop cap. |
| `theme/templates/theforge.html` | PR6 | Dispatch character preserved; tokens applied. |
| `theme/templates/inference-economics.html` | PR6 | Series landing. |
| `theme/templates/page.html` | PR7 | About, Research. |
| `theme/templates/videos.html` | PR7 | If used. |

---

## Phasing (8 PRs)

| PR | Surface | Reason to ship independently |
|---|---|---|
| 1 | Foundation: `site.css` skeleton + `base.html` chrome + light code theme | Lands unified identity across every page (nav, header, body bg, fonts). |
| 2 | Home (`index.html`) | The headline visual win. |
| 3 | Writings archive (`archives.html`) | Replaces card grid with ruled list. |
| 4 | Short-form essay (`article.html`) | The bulk of essays. |
| 5 | Long-form essay (`longform_article.html`) | Sticky TOC + optional drop cap. |
| 6 | Series pages (`theforge.html`, `inference-economics.html`) | Different ornament for newsletter vs. series landing. |
| 7 | Generic pages (`page.html`, `videos.html`) | About, Research, Videos. |
| 8 | Cleanup: delete `style.css`, prune fallback CSS | After all templates migrated. |

Branch: `wip/site-design-rollout`. Commit per task. Merge with `--no-ff` per master's pattern.

---

## Pre-flight

- [ ] **Step 1: Create working branch from master**

```bash
git checkout master && git pull
git checkout -b wip/site-design-rollout
```

- [ ] **Step 2: Confirm Pelican build is green on master before changes**

```bash
pelican content -s pelicanconf.py
```
Expected: `Done: Processed N articles, M pages…` with no errors.

- [ ] **Step 3: Capture baseline screenshots** of home, writings, one essay, the Forge, About. Save to `history/mockups/baseline-2026-05-19/`. Used for visual diffing later.

---

## PR1 — Foundation: site.css + base.html chrome + light code theme

**Files:**
- Create: `theme/static/css/site.css`
- Modify: `theme/templates/base.html`
- Modify: `theme/static/css/style.css` (remove `!important` from `html`, `body`, `h1-h6` only)

### Task 1.1 — Create `site.css` skeleton

- [ ] **Step 1: Write the failing verification**

```bash
# Verification: site.css must exist and import book-tokens.
grep -q "@import.*book-tokens.css" theme/static/css/site.css 2>/dev/null && echo PASS || echo FAIL
```
Expected before implementation: `FAIL` (file doesn't exist).

- [ ] **Step 2: Create `theme/static/css/site.css` with this content**

```css
/* ABOUTME: Site-wide components — nav, hero, ruled list, section top-rule, social icons, buttons.
   ABOUTME: Consumes book-tokens.css. Sibling of book.css. */

@import url('book-tokens.css');

/* ── Reset ─────────────────────────────────────── */
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

/* ── Links ─────────────────────────────────────── */
a {
  color: var(--text);
  text-decoration: underline;
  text-decoration-color: var(--ink-soft);
  text-underline-offset: 0.18em;
  transition: color 0.15s, text-decoration-color 0.15s;
}
a:hover { color: var(--brown); text-decoration-color: var(--brown); }

/* ── Reading progress bar ─────────────────────── */
#reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: var(--ink);
  z-index: 100;
  transition: width 50ms linear;
}

/* ── Header / nav ─────────────────────────────── */
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

.site-nav {
  flex: 1;
  display: flex;
  justify-content: center;
}
.site-nav ul {
  list-style: none;
  display: flex;
  gap: var(--space-5);
}
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

.site-social { display: flex; gap: var(--space-3); flex-shrink: 0; }
.site-social a { display: inline-flex; }
.site-social svg { width: 16px; height: 16px; fill: var(--text-deck); transition: fill 0.15s; }
.site-social a:hover svg { fill: var(--brown); }

/* ── Main container ───────────────────────────── */
.site-main {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-10);
}

/* ── Section top-rule (replaces `> section >` headers) ── */
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

/* ── Ruled list (post listings sitewide) ──────── */
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
.ruled-row a:hover .ruled-title { color: var(--brown); text-decoration: underline; text-decoration-color: var(--brown); text-underline-offset: 0.18em; }
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

/* ── Buttons (replaces .corner-btn) ───────────── */
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
}
.site-btn:hover { background: var(--ink); color: var(--paper); }
.site-btn--soft { border-color: var(--ink-soft); color: var(--text-deck); }
.site-btn--soft:hover { background: var(--paper-tint); color: var(--ink); border-color: var(--ink); }

/* ── Mobile ───────────────────────────────────── */
@media (max-width: 700px) {
  .site-header-inner { flex-wrap: wrap; gap: var(--space-3); padding: var(--space-3); }
  .site-nav ul { gap: var(--space-3); flex-wrap: wrap; justify-content: center; }
  .site-main { padding: var(--space-5) var(--space-4); }
  .ruled-row { grid-template-columns: 1fr; gap: var(--space-1); }
  .ruled-date { font-size: var(--fs-mono-meta); }
}
```

- [ ] **Step 3: Run verification, expect PASS**

```bash
grep -q "@import.*book-tokens.css" theme/static/css/site.css && echo PASS || echo FAIL
```
Expected: `PASS`.

- [ ] **Step 4: Commit**

```bash
git add theme/static/css/site.css
git commit -m "feat(css): add site.css with foundation tokens, header, ruled list, buttons"
```

### Task 1.2 — Replace stylesheet links + reading-progress class in `base.html`

- [ ] **Step 1: Write the failing verification**

```bash
# base.html must reference site.css and book-tokens, and not reference style.css.
grep -q "site.css" theme/templates/base.html && \
  grep -q "book-tokens.css" theme/templates/base.html && \
  ! grep -q '"theme/css/style.css"' theme/templates/base.html && echo PASS || echo FAIL
```
Expected before implementation: `FAIL`.

- [ ] **Step 2: Modify `theme/templates/base.html`** — replace the `<head>` and `<header>` sections:

Replace the `<head>` block (lines 3-12) with:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% block title %}{{ SITENAME }}{% endblock %}</title>
  <meta name="description" content="{{ SITEDESCRIPTION|default('') }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap">
  <link rel="stylesheet" href="{{ SITEURL }}/theme/css/book-tokens.css">
  <link rel="stylesheet" href="{{ SITEURL }}/theme/css/site.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css" media="print" onload="this.media='all'">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" defer></script>
  <script>document.addEventListener('DOMContentLoaded', function(){hljs.highlightAll();});</script>
</head>
```

Replace the `<header>...</header>` block (lines 15-57) with:

```html
<header class="site-header">
  <div class="site-header-inner">
    <a href="{{ SITEURL }}/" class="site-logo">{{ SITENAME }}</a>
    <nav class="site-nav" aria-label="Main navigation">
      <ul>
        <li><a href="{{ SITEURL }}/"{% block nav_home %}{% endblock %}>Home</a></li>
        <li><a href="{{ SITEURL }}/writings/"{% block nav_writings %}{% endblock %}>Writings</a></li>
        <li><a href="{{ SITEURL }}/pages/inference-economics/"{% block nav_inference_economics %}{% endblock %}>Inference Economics</a></li>
        <li><a href="{{ SITEURL }}/pages/research/"{% block nav_research %}{% endblock %}>Research</a></li>
        <li><a href="{{ SITEURL }}/pages/about/"{% block nav_about %}{% endblock %}>About</a></li>
      </ul>
    </nav>
    <div class="site-social">
      {% for name, url in SOCIAL %}
      {% if name == 'email' %}<a href="{{ url }}" title="Email" aria-label="Email"><svg viewBox="0 0 24 24"><path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z"/></svg></a>
      {% elif name == 'github' %}<a href="{{ url }}" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub"><svg viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.44 24 17.12 24 12.02 24 5.74 18.27.5 12 .5z"/></svg></a>
      {% elif name == 'twitter' %}<a href="{{ url }}" target="_blank" rel="noopener" title="X (Twitter)" aria-label="X (Twitter)"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
      {% elif name == 'linkedin' %}<a href="{{ url }}" target="_blank" rel="noopener" title="LinkedIn" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
      {% endif %}
      {% endfor %}
    </div>
  </div>
</header>
<main class="site-main" id="main-content">
  {% block content %}{% endblock %}
</main>
```

Also delete the now-orphaned `<div class="container"><div class="main-container"><main id="main-content">…</main></div></div>` block. Keep the closing `<script>` tags for `sections.js`, `lightbox.js`, and the reading-progress code.

- [ ] **Step 3: Run verification, expect PASS**

```bash
grep -q "site.css" theme/templates/base.html && \
  grep -q "book-tokens.css" theme/templates/base.html && \
  ! grep -q '"theme/css/style.css"' theme/templates/base.html && echo PASS || echo FAIL
```
Expected: `PASS`.

- [ ] **Step 4: Build + visual smoke test**

```bash
pelican content -s pelicanconf.py
python3 -m http.server 8000 --directory output &
SERVER_PID=$!
sleep 1
open http://localhost:8000/
# Verify: parchment background, moss-italic logo top-left, mono uppercase nav, no charcoal anywhere in the chrome.
# Code blocks on essay pages should render on light background (atom-one-light).
kill $SERVER_PID
```

- [ ] **Step 5: Commit**

```bash
git add theme/templates/base.html
git commit -m "refactor(base): replace nav chrome with site.css markup; switch code theme to atom-one-light"
```

### Task 1.3 — Remove `!important` rules from `style.css` for shared elements

- [ ] **Step 1: Identify lines** — these `!important` declarations on `html`, `body`, and `h1-h6` fight the new typography. Lines 27-29 and 35-39 of `style.css`.

- [ ] **Step 2: Verification (must fail before fix)**

```bash
# style.css must no longer apply !important to html or body backgrounds.
! grep -E '^\s*background-color:.*!important' theme/static/css/style.css | grep -v 'note:' && echo PASS || echo FAIL
```
Expected: `FAIL` (current file has them).

- [ ] **Step 3: Edit `theme/static/css/style.css`** — remove `!important` from these rules only (leave the rest of the file intact):

```css
/* lines ~26-29 */
html {
  background-color: var(--bg-color);  /* removed !important */
  min-height: 100%;                    /* removed !important */
}

/* lines ~31-40 */
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-primary);
  background-color: var(--bg-color);   /* removed !important */
  color: var(--text-color);
  line-height: 1.7;
  font-size: 17px;
  min-height: 100vh;                   /* removed !important */
}
```

Leave the rest of `style.css` untouched. Old templates that still extend it will keep working; the `!important` removal just lets `site.css` win on shared elements.

- [ ] **Step 4: Run verification, expect PASS**

- [ ] **Step 5: Build + visual smoke**

```bash
pelican content -s pelicanconf.py
python3 -m http.server 8000 --directory output &
SERVER_PID=$!
sleep 1
open http://localhost:8000/   # should still render — old style.css is still loaded on non-migrated templates? No — base.html no longer links it.
kill $SERVER_PID
```

**Note:** Since PR1 also removed `style.css` from `base.html`, pages now load `book-tokens.css + site.css` only. `style.css` will only be re-introduced per-template via `{% block extra_head %}` if a template still needs it during the transition. For PR1, every page falls back cleanly to the new minimal styling (no card grids, no charcoal — pages without their own template-specific CSS will look "naked but correct").

- [ ] **Step 6: Commit**

```bash
git add theme/static/css/style.css
git commit -m "fix(css): drop !important on html/body to let site.css win"
```

### Task 1.4 — Open PR1

```bash
git push -u origin wip/site-design-rollout
gh pr create --base master --title "PR1: foundation — site.css, base.html chrome, light code theme" \
  --body "Lands the parchment + moss + Newsreader/Instrument Serif identity across all pages via base.html. Per-template restyles in subsequent PRs."
```

**Acceptance:** Every page now renders with parchment bg, Newsreader body type, mono uppercase nav, moss links. Old templates render "naked but consistent" while waiting for their PR.

---

## PR2 — Home page (`index.html`)

**Files:**
- Modify: `theme/templates/index.html`
- Modify: `theme/static/css/site.css` (add `.hero` block)

### Task 2.1 — Add hero CSS to `site.css`

- [ ] **Step 1: Append to `theme/static/css/site.css`**

```css
/* ── Hero ─────────────────────────────────────── */
.hero {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-8) 0 var(--space-6);
  border-bottom: 1px solid var(--ink-soft);
  margin-bottom: var(--space-3);
}
.hero-image img {
  width: 180px;
  height: 180px;
  object-fit: cover;
  border: 1px solid var(--ink-soft);
  display: block;
}
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
.hero-bio {
  font-family: var(--font-body);
  font-style: italic;
  font-variation-settings: "opsz" 24;
  font-size: 1.2rem;
  color: var(--text-deck);
  max-width: 48ch;
  margin-bottom: var(--space-5);
  line-height: 1.45;
}
.hero-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

@media (max-width: 700px) {
  .hero { flex-direction: column-reverse; align-items: flex-start; gap: var(--space-5); padding: var(--space-5) 0 var(--space-4); }
  .hero-image img { width: 120px; height: 120px; }
  .hero-name { font-size: 2.2rem; }
  .hero-bio { font-size: 1.05rem; }
}
```

- [ ] **Step 2: Commit**

```bash
git add theme/static/css/site.css
git commit -m "feat(css): add hero block to site.css"
```

### Task 2.2 — Rewrite `index.html` to editorial portfolio markup

- [ ] **Step 1: Verification**

```bash
# index.html must use new hero markup, no .blog-card, no .corner-btn.
grep -q 'class="hero"' theme/templates/index.html && \
  grep -q 'hero-name' theme/templates/index.html && \
  ! grep -q 'class="corner' theme/templates/index.html && \
  ! grep -q 'class="blog-card"' theme/templates/index.html && echo PASS || echo FAIL
```
Expected: `FAIL`.

- [ ] **Step 2: Replace entire content of `theme/templates/index.html`** with:

```html
{% extends "base.html" %}

{% block nav_home %} class="active" aria-current="page"{% endblock %}

{% block content %}
<section class="hero">
  <div class="hero-content">
    <p class="hero-kicker">hi, i'm</p>
    <h1 class="hero-name">Sohail Mohammad</h1>
    <p class="hero-bio">Tech, AI infrastructure, and adjacent thinking. Notes from a working engineer.</p>
    <div class="hero-actions">
      <a href="mailto:sohailmo.ai@gmail.com" class="site-btn">Contact</a>
      <a href="https://sohailmo.substack.com/subscribe" class="site-btn site-btn--soft" target="_blank" rel="noopener">Subscribe ↗</a>
    </div>
  </div>
  <div class="hero-image">
    <img src="{{ SITEURL }}/theme/images/hero-avatar.jpg" alt="">
  </div>
</section>

{% set featured_articles = articles|selectattr('featured', 'defined')|selectattr('featured')|list %}
{% if featured_articles %}
<div class="section-rule">
  <span>Featured</span>
</div>
<ul class="ruled-list">
  {% for article in featured_articles %}
  <li class="ruled-row">
    <a href="{{ SITEURL }}/{{ article.url }}">
      <span class="ruled-date">{{ article.date.strftime('%Y-%m-%d') }}</span>
      <div class="ruled-body">
        <div class="ruled-title">{{ article.title }}</div>
        <div class="ruled-excerpt">{{ article.summary|striptags|truncate(180) }}</div>
        <div class="ruled-meta">{{ article.category }}</div>
      </div>
    </a>
  </li>
  {% endfor %}
</ul>
{% endif %}

{% set research = articles|selectattr('category', 'equalto', 'Research')|rejectattr('show_on_home', 'equalto', false)|rejectattr('show_on_home', 'equalto', 'false')|list %}
{% if research %}
<div class="section-rule">
  <span>Latest Research</span>
  <a href="{{ SITEURL }}/pages/research/">see all →</a>
</div>
<ul class="ruled-list">
  {% for article in research[:3] %}
  <li class="ruled-row">
    <a href="{{ SITEURL }}/{{ article.url }}">
      <span class="ruled-date">{{ article.date.strftime('%Y-%m-%d') }}</span>
      <div class="ruled-body">
        <div class="ruled-title">{{ article.title }}</div>
        <div class="ruled-excerpt">{{ article.summary|striptags|truncate(180) }}</div>
      </div>
    </a>
  </li>
  {% endfor %}
</ul>
{% endif %}

{% set writings = articles|selectattr('category', 'ne', 'Poems')|selectattr('category', 'ne', 'The Forge')|selectattr('category', 'ne', 'Research')|rejectattr('show_on_home', 'equalto', false)|rejectattr('show_on_home', 'equalto', 'false')|list %}
<div class="section-rule">
  <span>Latest Writings</span>
  <a href="{{ SITEURL }}/writings/">see all →</a>
</div>
<ul class="ruled-list">
  {% for article in writings[:3] %}
  <li class="ruled-row">
    <a href="{{ SITEURL }}/{{ article.url }}">
      <span class="ruled-date">{{ article.date.strftime('%Y-%m-%d') }}</span>
      <div class="ruled-body">
        <div class="ruled-title">{{ article.title }}</div>
        <div class="ruled-excerpt">{{ article.summary|striptags|truncate(180) }}</div>
        <div class="ruled-meta">{{ article.category }}</div>
      </div>
    </a>
  </li>
  {% endfor %}
</ul>
{% endblock %}
```

- [ ] **Step 3: Run verification, expect PASS**

- [ ] **Step 4: Build + visual confirm**

```bash
pelican content -s pelicanconf.py
python3 -m http.server 8000 --directory output &
SERVER_PID=$!
sleep 1
open http://localhost:8000/
# Compare against history/mockups/2026-05-19-home-editorial.html — the rendered page should match.
kill $SERVER_PID
```

- [ ] **Step 5: Commit + PR**

```bash
git add theme/templates/index.html
git commit -m "refactor(home): editorial portfolio — hero + ruled lists, drop card grid"
git push
gh pr create --base master --title "PR2: home page editorial portfolio rework"
```

---

## PR3 — Writings archive (`archives.html`)

### Task 3.1 — Restyle category filter tabs as moss/oxblood mono chips

- [ ] **Step 1: Append to `site.css`**

```css
/* ── Category chips (filter tabs) ─────────────── */
.category-chips {
  display: flex;
  gap: var(--space-2);
  margin: var(--space-5) 0;
  flex-wrap: wrap;
  justify-content: center;
}
.category-chip {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-deck);
  background: transparent;
  border: 1px solid var(--ink-soft);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.category-chip:hover { color: var(--ink); border-color: var(--ink); }
.category-chip.active { color: var(--paper); background: var(--ink); border-color: var(--ink); }

/* ── Subscribe banner ─────────────────────────── */
.subscribe-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  margin: var(--space-5) 0;
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  background: var(--paper-tint);
}
.subscribe-banner-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.4rem;
  color: var(--ink);
}
.subscribe-banner-sub {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-deck);
  margin-top: var(--space-1);
}
@media (max-width: 700px) {
  .subscribe-banner { flex-direction: column; align-items: flex-start; gap: var(--space-3); }
}
```

- [ ] **Step 2: Replace `theme/templates/archives.html`** with:

```html
{% extends "base.html" %}

{% block title %}Writings - {{ SITENAME }}{% endblock %}
{% block nav_writings %} class="active" aria-current="page"{% endblock %}

{% block content %}
{% set writings = dates
  |selectattr('category', 'ne', 'The Forge')
  |rejectattr('slug', 'equalto', 'research/failures/b6-negative-result')
  |list %}

<div class="subscribe-banner">
  <div>
    <div class="subscribe-banner-title">Get new writings in your inbox</div>
    <div class="subscribe-banner-sub">Long-form essays on tech, AI, and adjacent thinking. Managed on Substack.</div>
  </div>
  <a href="https://sohailmo.substack.com/subscribe" class="site-btn" target="_blank" rel="noopener">Subscribe ↗</a>
</div>

<div class="section-rule"><span>All Writings</span></div>

<div class="category-chips">
  <button class="category-chip active" data-category="all" onclick="filterCategory('all')">All</button>
  <button class="category-chip" data-category="Case Studies" onclick="filterCategory('Case Studies')">Case Studies</button>
  <button class="category-chip" data-category="Notes &amp; Projects" onclick="filterCategory('Notes &amp; Projects')">Notes &amp; Projects</button>
  <button class="category-chip" data-category="Thoughts" onclick="filterCategory('Thoughts')">Thoughts</button>
  <button class="category-chip" data-category="Poems" onclick="filterCategory('Poems')">Poems</button>
</div>

<ul class="ruled-list" id="writings-list">
  {% for article in writings %}
  {% set tag_names = article.tags|map(attribute='name')|map('lower')|list if article.tags else [] %}
  {% if 'research' not in tag_names %}
  <li class="ruled-row" data-category="{{ article.category }}">
    <a href="{{ SITEURL }}/{{ article.url }}">
      <span class="ruled-date">{{ article.date.strftime('%Y-%m-%d') }}</span>
      <div class="ruled-body">
        <div class="ruled-title">{{ article.title }}</div>
        <div class="ruled-excerpt">{{ article.summary|striptags|truncate(180) }}</div>
        <div class="ruled-meta">{{ article.category }}</div>
      </div>
    </a>
  </li>
  {% endif %}
  {% endfor %}
</ul>

<script>
function filterCategory(category) {
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-category="${category}"]`).classList.add('active');
  document.querySelectorAll('#writings-list .ruled-row').forEach(row => {
    row.style.display = (category === 'all' || row.dataset.category === category) ? '' : 'none';
  });
}
</script>
{% endblock %}
```

- [ ] **Step 3: Build + visual confirm + commit**

```bash
pelican content -s pelicanconf.py
# visual check at /writings/
git add theme/templates/archives.html theme/static/css/site.css
git commit -m "refactor(writings): ruled list + mono chip filters, drop card grid"
```

---

## PR4 — Short-form essay (`article.html`)

### Task 4.1 — Add prose styles to `site.css`

- [ ] **Append to `site.css`**:

```css
/* ── Article (short-form) ─────────────────────── */
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
.article-date {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  color: var(--text-deck);
  font-variant-numeric: tabular-nums;
}
.article-prose {
  max-width: 65ch;
  font-family: var(--font-body);
  font-size: var(--fs-body);
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
  background: rgba(58,79,42,0.04);
  padding: var(--space-3) var(--space-4);
  margin: var(--space-4) 0;
  font-style: italic;
  color: var(--text-deck);
}
.article-prose code {
  font-family: var(--font-mono);
  font-size: 0.87em;
  background: var(--paper-tint);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}
.article-prose pre {
  background: var(--paper-tint);
  border: 1px solid var(--ink-soft);
  border-radius: 6px;
  padding: var(--space-4) var(--space-5);
  overflow-x: auto;
  margin-bottom: var(--space-5);
  line-height: 1.55;
  font-size: 0.88rem;
}
.article-prose pre code { background: none; padding: 0; }
.article-prose img { max-width: 100%; height: auto; margin: var(--space-4) 0; display: block; border: 1px solid var(--ink-soft); cursor: zoom-in; }
.article-prose ul, .article-prose ol { margin-left: var(--space-5); margin-bottom: var(--space-4); }
.article-prose li { margin-bottom: var(--space-2); }
.article-prose hr { border: none; height: 1px; background: var(--ink-soft); max-width: 40%; margin: var(--space-6) auto; }
.article-prose table { display: block; overflow-x: auto; max-width: 100%; border-collapse: collapse; margin: var(--space-4) 0; font-size: 0.92rem; }
.article-prose th, .article-prose td { padding: var(--space-2) var(--space-3); text-align: left; border-bottom: 1px solid var(--ink-soft); }
.article-prose th { font-family: var(--font-mono); font-size: var(--fs-mono-label); text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink); background: var(--paper-tint); }

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
```

### Task 4.2 — Replace `article.html`

- [ ] Replace contents:

```html
{% extends "base.html" %}

{% block title %}{{ article.title }} - {{ SITENAME }}{% endblock %}
{% block body_class %} class="post-page"{% endblock %}

{% block content %}
<a href="{{ SITEURL }}/" class="article-back">← Back</a>
<header class="article-header">
  {% if article.category %}<div class="article-kicker">{{ article.category }}</div>{% endif %}
  <h1 class="article-title">{{ article.title }}</h1>
  <div class="article-date">{{ article.date.strftime('%Y-%m-%d') }}</div>
</header>
<article class="article-prose">
  {{ article.content }}
</article>
{% endblock %}
```

- [ ] Build + visual confirm at one or two essay URLs (e.g. `/managing-agents-complexity/`).
- [ ] Commit.

---

## PR5 — Long-form essay (`longform_article.html`)

### Task 5.1 — Add long-form styles to `site.css`

- [ ] Append:

```css
/* ── Long-form layout (sticky TOC + wider container) ─ */
.longform-page .site-main { max-width: 1200px; }
.longform-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-6);
  align-items: start;
}
.longform-layout > * { min-width: 0; }
.longform-toc {
  position: sticky;
  top: 72px;
  padding-top: var(--space-3);
  border-right: 1px solid var(--ink-soft);
  padding-right: var(--space-5);
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}
.longform-toc .toc-header {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-meta);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--ink-soft);
}
.longform-toc ul { list-style: none; padding: 0; margin: 0; }
.longform-toc ul ul { padding-left: var(--space-3); margin-top: var(--space-1); }
.longform-toc li { margin-bottom: var(--space-1); }
.longform-toc a {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-data);
  color: var(--text-deck);
  text-decoration: none;
  display: block;
  padding: 2px 0;
  line-height: 1.35;
}
.longform-toc a:hover { color: var(--ink); }
.longform-toc a.active { color: var(--ink); font-weight: 700; }

.longform-content { max-width: 65ch; }
.longform-content p.has-dropcap::first-letter {
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

@media (max-width: 960px) {
  .longform-layout { grid-template-columns: 1fr; }
  .longform-toc { position: static; max-height: none; border-right: none; border-bottom: 1px solid var(--ink-soft); padding-bottom: var(--space-3); margin-bottom: var(--space-4); padding-right: 0; }
}
```

### Task 5.2 — Replace `longform_article.html`

- [ ] Replace contents:

```html
{% extends "base.html" %}

{% block title %}{{ article.title }} - {{ SITENAME }}{% endblock %}
{% block body_class %} class="post-page longform-page"{% endblock %}

{% block content %}
<a href="{{ SITEURL }}/" class="article-back">← Back</a>
<header class="article-header">
  {% if article.category %}<div class="article-kicker">{{ article.category }}</div>{% endif %}
  <h1 class="article-title">{{ article.title }}</h1>
  <div class="article-date">{{ article.date.strftime('%Y-%m-%d') }}</div>
</header>

<div class="longform-layout">
  <aside class="longform-toc">
    <div class="toc-header">Contents</div>
    {% if article.toc %}{{ article.toc }}{% endif %}
  </aside>
  <article class="article-prose longform-content">
    {{ article.content }}
  </article>
</div>

<script>
(function() {
  var tocLinks = document.querySelectorAll('.longform-toc a');
  if (!tocLinks.length) return;
  var headings = [];
  tocLinks.forEach(function(link) {
    var id = link.getAttribute('href');
    if (id && id.startsWith('#')) {
      var el = document.getElementById(id.slice(1));
      if (el) headings.push({el: el, link: link});
    }
  });
  function onScroll() {
    var scrollPos = window.scrollY + 100;
    var active = null;
    for (var i = headings.length - 1; i >= 0; i--) {
      if (headings[i].el.offsetTop <= scrollPos) { active = headings[i]; break; }
    }
    tocLinks.forEach(function(l) { l.classList.remove('active'); });
    if (active) active.link.classList.add('active');
  }
  window.addEventListener('scroll', onScroll, {passive: true});
  onScroll();
})();
</script>
{% endblock %}
```

- [ ] Test on `/goodput/`, `/denominator-problem/`, `/inference-field-guide/`. Visual confirm TOC sticks on desktop, collapses above on mobile.
- [ ] Commit.

---

## PR6 — Series pages (`theforge.html`, `inference-economics.html`)

### Task 6.1 — Forge: keep dispatch character, restyle wrapper

- [ ] Replace `theme/templates/theforge.html`:

```html
{% extends "base.html" %}
{% block title %}The Forge - {{ SITENAME }}{% endblock %}
{% block nav_writings %} class="active" aria-current="page"{% endblock %}

{% block content %}
{% set forge_articles = articles|selectattr('category', 'equalto', 'The Forge')|list %}

<div class="section-rule">
  <span>The Forge</span>
  <span>{{ forge_articles|length }} issue{{ 's' if forge_articles|length != 1 }}</span>
</div>
<p style="font-family: var(--font-body); font-style: italic; color: var(--text-deck); margin: var(--space-3) 0 var(--space-5); max-width: 60ch;">
  Weekly dispatch — my thoughts plus the latest AI/ML news that I actually care about. Curated, not exhaustive.
</p>

<ul class="ruled-list">
  {% for article in forge_articles|sort(attribute='date', reverse=True) %}
  <li class="ruled-row">
    <a href="{{ SITEURL }}/{{ article.url }}">
      <span class="ruled-date">{{ article.date.strftime('%Y-%m-%d') }}</span>
      <div class="ruled-body">
        <div class="ruled-title">{{ article.title }}</div>
        <div class="ruled-excerpt">{{ article.summary|striptags|truncate(200) }}</div>
      </div>
    </a>
  </li>
  {% endfor %}
</ul>

<div class="subscribe-banner" style="margin-top: var(--space-8);">
  <div>
    <div class="subscribe-banner-title">Get The Forge in your inbox</div>
    <div class="subscribe-banner-sub">New issues delivered weekly.</div>
  </div>
  <form action="https://buttondown.email/api/emails/embed-subscribe/sohailmo" method="post" target="popupwindow" onsubmit="window.open('https://buttondown.email/sohailmo', 'popupwindow', 'scrollbars=yes,width=800,height=600');return true;" style="display: flex; gap: var(--space-2);">
    <input type="email" name="email" placeholder="you@example.com" required aria-label="Email address"
      style="font-family: var(--font-mono); font-size: var(--fs-mono-data); padding: var(--space-2) var(--space-3); border: 1px solid var(--ink-soft); background: var(--paper); color: var(--text);">
    <input type="hidden" name="tag" value="the-forge">
    <button type="submit" class="site-btn">Subscribe</button>
  </form>
</div>
{% endblock %}
```

### Task 6.2 — Inference Economics: simple series landing

- [ ] Replace `theme/templates/inference-economics.html`:

```html
{% extends "base.html" %}
{% block title %}{{ page.title }} - {{ SITENAME }}{% endblock %}
{% block body_class %} class="post-page"{% endblock %}
{% block nav_inference_economics %} class="active" aria-current="page"{% endblock %}

{% block content %}
<a href="{{ SITEURL }}/" class="article-back">← Back</a>
<header class="article-header">
  <h1 class="article-title">{{ page.title }}</h1>
</header>
<article class="article-prose">
  {{ page.content }}
</article>
{% endblock %}
```

- [ ] Commit + PR.

---

## PR7 — Generic pages (`page.html`, `videos.html`)

### Task 7.1 — `page.html` (About, Research)

- [ ] Replace `theme/templates/page.html`:

```html
{% extends "base.html" %}
{% block title %}{{ page.title }} - {{ SITENAME }}{% endblock %}
{% block body_class %} class="post-page"{% endblock %}
{% block nav_about %}{% if page.slug == 'about' %} class="active" aria-current="page"{% endif %}{% endblock %}
{% block nav_research %}{% if page.slug == 'research' %} class="active" aria-current="page"{% endif %}{% endblock %}

{% block content %}
<a href="{{ SITEURL }}/" class="article-back">← Back</a>
<header class="article-header">
  <h1 class="article-title">{{ page.title }}</h1>
</header>
<article class="article-prose">
  {{ page.content }}
</article>
{% endblock %}
```

### Task 7.2 — `videos.html`

- [ ] Replace `theme/templates/videos.html`:

```html
{% extends "base.html" %}
{% block title %}{{ page.title }} - {{ SITENAME }}{% endblock %}
{% block body_class %} class="post-page"{% endblock %}

{% block content %}
<a href="{{ SITEURL }}/" class="article-back">← Back</a>
<header class="article-header">
  <h1 class="article-title">{{ page.title }}</h1>
</header>
<article class="article-prose">
  {{ page.content }}
</article>
{% endblock %}
```

- [ ] Visual check `/pages/about/` and `/pages/research/`.
- [ ] Commit + PR.

---

## PR8 — Cleanup

### Task 8.1 — Retire `style.css`

- [ ] **Step 1: Verify no template references `style.css`**

```bash
grep -rn 'style.css' theme/templates/ && echo "FAIL — still referenced" || echo PASS
```
Expected: `PASS`.

- [ ] **Step 2: Delete `style.css` and its backup**

```bash
git rm theme/static/css/style.css theme/static/css/style.css.backup
```

- [ ] **Step 3: Build + smoke test every surface**

```bash
pelican content -s pelicanconf.py
python3 -m http.server 8000 --directory output &
SERVER_PID=$!
sleep 1
for path in / /writings/ /managing-agents-complexity/ /goodput/ /theforge/ /pages/about/ /pages/research/ /book/ /book/opener/; do
  curl -sf "http://localhost:8000$path" -o /dev/null && echo "OK $path" || echo "FAIL $path"
done
kill $SERVER_PID
```
Expected: all `OK`.

- [ ] **Step 4: Commit + PR**

```bash
git add -u
git commit -m "chore(css): retire style.css; site.css + book-tokens.css + book.css are the design system"
```

---

## Acceptance criteria (refines brief §7 sketch)

| # | Criterion | Verification |
|---|---|---|
| A1 | Home renders parchment bg + Instrument Serif italic name + Newsreader bio + ruled-list sections | Visual + `curl /  \| grep -i 'instrument serif'` |
| A2 | Writings archive renders as ruled list (no `.blog-card`) | `! grep -q 'class="blog-card"' output/writings/index.html` |
| A3 | No `font-family: 'Inter'` references in `theme/static/css/` except as fallback | `! grep -E "font-family:\s*['\"]Inter['\"]" theme/static/css/*.css` |
| A4 | No purple/indigo accents | `! grep -iE '#[a-f0-9]*([4-9])[0-9a-f]*([4-9])' theme/static/css/*.css \| grep -iE 'purple\|indigo'` (manual review) |
| A5 | iPhone-SE width (375px) — no horizontal page scroll | Browser devtools + book.css `overflow-x: clip` already applied via site.css |
| A6 | All existing essay URLs resolve | `curl -f` check in PR8 task 8.1 step 3 |
| A7 | Lighthouse desktop on `/` and one essay — Perf ≥90, A11y ≥95, BP ≥95 | Manual Lighthouse run before merge |
| A8 | About page renders new tokens but keeps content unchanged | `diff <(git show master:content/pages/about.md) content/pages/about.md` returns empty |
| A9 | Code blocks render light (atom-one-light), not material-darker | `grep -q "atom-one-light" theme/templates/base.html` |
| A10 | `style.css` retired in final PR | `! test -f theme/static/css/style.css` |

---

## Risks

| Risk | Mitigation |
|---|---|
| The `min-width: 0` rule on grid children might break some legacy templates we haven't audited | Each PR's visual smoke step catches it; rollback per-template if needed. |
| Google Fonts CDN latency on hero name | Preconnect already in `<head>`; font-display: swap default. Accept for v1. |
| `highlight.js` atom-one-light may not theme every language well | Audit code-heavy essays (`rag-infrastructure-pgvector`, `ray-production-lessons`) in PR1 smoke. If issue, swap to `github` theme. |
| `pelican` build picks up partial CSS mid-PR | Per-PR `pelican content` build + visual confirm guards this. |
| Existing `Template: longform_article` essays break when `longform_article.html` is rewritten in PR5 before `article.html` is done | Order PRs 4 → 5; never invert. |
| The `min-width: 0` we already added in site.css could collide with legacy `.page-layout > *` rule still in `book.css` | book.css scopes its rule to `.page-layout > *`, site.css uses different selectors — no collision. Verified by reading book.css. |

---

## Self-review checklist (run before execution)

- [ ] Each task references exact file paths. ✓
- [ ] Each task has a verification command. ✓
- [ ] No `TBD`, `TODO`, or "fill in" placeholders. ✓
- [ ] Class names used in later tasks (`.ruled-row`, `.section-rule`, `.site-btn`) all defined in earlier tasks. ✓
- [ ] Brief acceptance criteria (§7) all mapped to tasks above. ✓

---

## Mockup

Before executing, open `history/mockups/2026-05-19-home-editorial.html` in a browser to validate the visual direction. The mockup is a self-contained HTML file using the same tokens, fonts, and components as PR1+PR2 will produce.

```bash
open history/mockups/2026-05-19-home-editorial.html
```

---

# v2 Parallel Deployment — Shipped 2026-05-19

The plan above (cutover) was superseded by a v2-parallel architecture so the new design can be A/B tested with feedback before committing to replace the live site.

## Architecture

- **Old site:** untouched. `base.html`, `style.css`, `index.html`, `article.html`, etc. — no modifications.
- **New v2 site:** lives at `/v2home/`, `/v2writings/`, `/v2theforge/`, `/v2/<slug>/`, `/v2/pages/<slug>/`. Same article + page data, different templates.
- **Nav inside v2:** stays in v2 universe (Home → `/v2home/`, Writings → `/v2writings/`, etc.). Old site nav unchanged.
- **No preview banner.** v2 pages look like production.

## Files added on branch `wip/site-design-rollout-v2-parallel`

| File | Purpose |
|---|---|
| `theme/static/css/site.css` | Site-wide v2 styles (hero, ruled list, section top-rule, nav, prose). Consumes `book-tokens.css`. |
| `theme/templates/base-v2.html` | v2 shell: cream paper, mono nav, Newsreader body, atom-one-light code highlighter. |
| `theme/templates/v2_index.html` | Home: hero (full name Instrument Serif italic) + 3 ruled-list sections. |
| `theme/templates/v2_archives.html` | Writings: ruled list + category chips. |
| `theme/templates/v2_article.html` | Short-form essay shell. |
| `theme/templates/v2_longform_article.html` | Long-form with sticky TOC sidebar. |
| `theme/templates/v2_page.html` | About / Research / Videos. |
| `theme/templates/v2_inference_economics.html` | Inference Economics landing. |
| `theme/templates/v2_theforge.html` | Forge dispatch series. |
| `plugins/v2_router.py` | Pelican plugin: writes `/v2/<slug>/` and `/v2/pages/<slug>/` for every article and page using v2 templates. |
| `pelicanconf.py` | Adds `v2_*` to `DIRECT_TEMPLATES`, declares `V2_*_SAVE_AS` + `V2_*_URL`, registers the plugin. |

## Build verification

```bash
pelican content -s pelicanconf.py
# Done: Processed 46 articles, 0 drafts, 0 hidden articles, 4 pages, 0 hidden pages
# Generated:
#   output/v2home/index.html
#   output/v2writings/index.html
#   output/v2theforge/index.html
#   output/v2/<slug>/index.html × 40 essays
#   output/v2/pages/{about,research,inference-economics,videos}/index.html
```

## Deployment

The site builds from `master` via `.github/workflows/pelican.yml`. To deploy v2:

```bash
# Option A — merge to master (v2 ships alongside live site, both production-accessible)
git checkout master
git merge --no-ff wip/site-design-rollout-v2-parallel
git push origin master

# Option B — keep on branch for local-only review, deploy later
# Nothing to do; just share local URLs via tunneling (e.g. `cloudflared tunnel` or `ngrok http 8765`).
```

After Option A, the v2 URLs become reachable at:
- `https://sohailmo.ai/v2home/`
- `https://sohailmo.ai/v2writings/`
- `https://sohailmo.ai/v2theforge/`
- `https://sohailmo.ai/v2/<any-essay-slug>/`
- `https://sohailmo.ai/v2/pages/about/` (and `/research/`, `/inference-economics/`, `/videos/`)

## After A/B testing

Once feedback is in and v2 is approved:
1. Optionally swap: make v2 the canonical site by changing the cutover plan above to point existing routes at v2 markup.
2. Or keep both for a while; v2 has no maintenance cost beyond keeping templates in sync if old templates change (which they shouldn't, since old site is feature-frozen).
3. Eventually retire `style.css` and old templates per the PR8 task in the cutover plan.

## Known limitations

- v2 article URLs at `/v2/<slug>/` work for all 40 essays via the plugin; the live site's per-essay URLs at `/<slug>/` are unchanged.
- The Forge currently has no dedicated `/theforge/` URL on the live site (only category-based filtering inside `/writings/`); v2 introduces `/v2theforge/` as a new surface.
- `RELATIVE_URLS = True` in `pelicanconf.py` means internal v2 links resolve relative to the current page. When deployed under a non-root URL, verify links still work — likely fine but smoke-test once.

