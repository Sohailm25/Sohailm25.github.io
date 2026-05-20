# Maha's Portfolio Site — Design Spec

**Date:** 2026-05-19
**Author:** Sohail Mohammad (with Claude)
**Subject:** Personal portfolio for Maha Mohammad — Lead Medical Assistant, builder of mahaclinic, prospective MD/DO applicant
**Status:** Approved by Sohail; awaiting implementation plan via `writing-plans` skill
**Repo affected:** `Sohailm25.github.io`
**Branch (proposed):** `wip/maha-portfolio`
**Related research:** `research/2026-05-19-med-school-admissions-may-2026.md` (5,252 words, May 2026 admissions landscape, used as load-bearing input)

---

## 1. Context

Maha Mohammad is a 2019 UT Dallas Neuroscience graduate, currently a Lead Medical Assistant at Innovative & Platinum Dermatology (2023–present). She has 5 years of post-graduate clinical experience: 2 years pediatric scribe at Children's Medical Center Plano (2019–21), 2 years ER scribe at Children's Medical Center Dallas (2021–23, 12-hour shifts), and 3 years as Lead MA in dermatology. As UTD undergrad she was President of Islamic Relief UTD and VP of Membership for Gamma Sigma Sigma. She has fluency with agentic AI tools (Claude Code, Codex) and has shipped `sohailmo.ai/mahaclinic/` — a search-first PWA reference for dermatology biologic dosing, used across multiple practice locations. She is preparing for the MCAT and intends to apply MD/DO in the 2027–28 cycle.

The husband-and-wife working hypothesis is that her profile — Lead MA + 5 years clinical + shipped multi-site AI clinical reference + Muslim woman from the UT system — is a sharp niche. Independent research (see linked brief) validates this: an estimated < 200 applicants per cycle match the full profile.

**The portfolio site's job** is to make that niche *visible in 30 seconds to anyone who lands on it* — specifically interviewers prepping the night before, LOR writers, post-interview follow-ups, and Maha herself when writing 30+ secondary essays. ADCOMs are not the primary audience; portfolio sites are *secondary* admissions assets per research finding 8.

The reference design system is the broadsheet vocabulary already shipped at `sohailmo.ai/book/` and rolled out to the rest of Sohail's site (see `history/2026-05-18-book-calculator-uiux-design.md`, `history/2026-05-19-site-design-rollout-plan.md`). Maha's site lives in the same Pelican repo, under `content/extra/maha/`, served at `sohailmo.ai/maha/` — mirroring the `extra/book/` and `extra/mahaclinic/` precedent.

## 2. Goals

1. **Niche visibility in one screen.** Above-the-fold communicates "Lead MA + clinician + builder" with one tagline, one hero, and one density signal ("On the Record" data-row block). A reader knows the throughline in 30 seconds.
2. **Audience-appropriate density.** Scannable for interviewers and LOR writers; deep-link pages for ADCOMs, post-interview follow-ups, and Maha herself.
3. **Patient-safety framing for the AI tool.** Mahaclinic is presented as a clinical reference (FDA-label lookup, no PHI, no diagnoses), not as "AI tool I built." Frames her as a clinician with systems-observation skill, not as a tech-bro applicant.
4. **AAMC competency mapping as the differentiator.** A literal table mapping her 5 years to the 15–17 AAMC Premed Competencies (refreshed 2023, renamed 2026). Per the research brief: *"No applicant does this. ADCOMs notice."*
5. **Quiet med-school signal.** Site never opens with "premed" or "applying to medical school." The signal lives in the "Now" section as one bullet among others. Pride and confidence over advocacy.
6. **Aesthetic continuity with Sohail's broadsheet system.** Reuses Instrument Serif italic / Newsreader / JetBrains Mono. Swaps moss → bordeaux as the primary ink (Maha's color preference), oxblood → sepia as the secondary. Same component vocabulary, same anti-slop register.
7. **Mahaclinic palette aligns with Maha's brand.** Sync `/mahaclinic/` from moss to bordeaux so it reads as the same brand as the portfolio.
8. **Maintenance-cheap.** The site should be addable-to without architectural changes — new writings, new artifacts, new stories drop into existing patterns.

## 3. Non-Goals

- A separate domain. We use `sohailmo.ai/maha/`, not `mahamohammad.com` or `maha.sohailmo.ai`. Reversible later.
- A different design system. Maha's site is a *palette variant* of the parent site, not a different aesthetic. Same fonts, same components, same anti-slop principles.
- Dark mode. Two-color print register only (broadsheet inheritance).
- Search, comments, social-share buttons, newsletter modals, AI-illustration, testimonials, "metrics-grid" stat cards, "card grid" gallery, bento layouts, glassmorphism, purple/indigo accents.
- A portrait photograph in the hero (v1). Hero is text-only with a wider content column. Reversible if Maha wants one later.
- Publicly listing GPA or MCAT scores anywhere on the site.
- Specialty fixation language ("I want to be a dermatologist"). The framing is chronic-disease management, patient education, health-system observation — not derm-as-destination.
- AMCAS/AACOMAS/TMDSAS application content (the site supports the application; it is not the application).
- A blog comment system. Maha owns the publication surface.
- A custom wordmark in v1 (per parent design system Phase 4 precedent).

## 4. Decisions

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | URL placement | `sohailmo.ai/maha/` (subdirectory of Sohail's Pelican site) | Mirrors `extra/book/` + `extra/mahaclinic/` precedent. One build, one deploy. Reversible to subdomain or own-domain later. |
| 2 | Repo | Same repo, `content/extra/maha/` | Walker at `pelicanconf.py:38` already serves `extra/<X>/` paths as root-level URLs. One-line addition. |
| 3 | Build mechanism | Raw HTML via `EXTRA_PATH_METADATA` walker | Same as book/mahaclinic. Bypasses Pelican templates. Allows fine-grained per-page DOM control. |
| 4 | Primary ink | Bordeaux `#6B1F2B` (replaces moss `#3A4F2A`) | Maha's color preference. Stays in the warm/broadsheet emotional register. |
| 5 | Secondary ink | Sepia `#5C3A1E` (small shift from oxblood `#5C2A1E`) | Reads more brown, less red — relieves the red-on-red collision that would happen if oxblood stayed. |
| 6 | Token architecture | `maha-tokens.css` `@import`s `book-tokens.css`, overrides only palette tokens | Typography, spacing, layout inherit unchanged. Palette is independent. DRY. |
| 7 | Mahaclinic palette sync | Update `mahaclinic/styles.css` `@import` to `maha-tokens.css`; update `<meta name="theme-color">` to `#6B1F2B` | Strengthens her brand. One-line change in each file. Reversible. |
| 8 | Framing | Clinician-builder, not premed | Hero opens "Lead MA + builder." Med-school mention lives only in `Now` as one bullet. |
| 9 | Tagline | *"Five years at the bedside. One tool my physicians actually use."* | Per research recommendation #1. Concrete, non-defensive, specific. |
| 10 | Hero portrait | None in v1 | User explicitly skipped portrait option. Research mildly skeptical of "hobby photos in the lead." Reversible. |
| 11 | Hero kicker | `CLINICIAN · BUILDER · DALLAS, TX` | User-approved. JBMono, uppercase, monospace eyebrow. |
| 12 | Density signal | "On the Record" data-row block, NOT a metrics-card grid | Card grids violate parent design system non-goals. Data-row block reuses `.book-data-row` precedent. |
| 13 | Mahaclinic framing | "A patient-safety reference for a dosing-error-prone task" with explicit "no PHI, no diagnoses, FDA-label only" disclosure | Per research finding 5 — differentiator vs. noise hinges on framing. |
| 14 | Competency mapping | Full table at `/maha/competencies/` (15-17 rows) + 4-highlight preview strip on home | Per research recommendation 4 — single highest-value novel content. |
| 15 | Patient story library | 4–6 short de-identified vignettes at `/maha/stories/`, `noindex,nofollow` | Per research recommendation 5 — Casper/PREview rehearsal + interview material. Privacy via meta robots. |
| 16 | For-interviewers page | `/maha/for-interviewers/`, linkable not advertised, `noindex` | Per research recommendation 6 — 5–10 conversation prompts. Confident, not presumptuous. |
| 17 | For-letter-writers page | `/maha/for-letter-writers-<8charrand>/`, `noindex`, no public links | Per research recommendation 7 — private link shared only with recommenders. URL has random suffix as the discoverability barrier. |
| 18 | Updates log | `/maha/now/` archive of small entries; home shows current Q only | Per research recommendation 10 — cheapest way to show AAMC competency #10 ("Commitment to Learning and Growth"). |
| 19 | Med-school cycle line | "Applying 2027–28 MD/DO cycle. Texas-focused." as one `Now` bullet | Quiet signal; not in hero. Reversible if cycle slides. |
| 20 | Public scores | Never on site | Per research recommendation 8 — no GPA or MCAT publicly. |
| 21 | UTD activities placement | Inside the UTD `.maha-experience-row` `.exp-detail` line, not as a separate Activities section | Keeps the timeline clean. Surfaces leadership without redundancy. |
| 22 | Writings v1 | Single placeholder sentence: "Notes from the practice — coming soon. Next: …" | Honest about emptiness. Becomes a ruled-list when she writes her first piece. |
| 23 | CV PDF | `/maha/cv.pdf` static file, linked from hero button | Required for ADCOM/recruiter utility. Maha provides the file. |
| 24 | Mobile breakpoints | Reuse parent: 960 / 700 / 600 | No new media queries. New components piggyback on existing breakpoint logic. |
| 25 | Phasing | v1 (ship-ready: home + mahaclinic case study + competencies + about + CV) → v2 (private pages + stories) → v3 (writings + artifacts, rolling) | Visible win in v1; v2 unlocks the interviewer/LOR-writer audiences; v3 is ongoing. |
| 26 | Typography | Inherited from parent: Instrument Serif (display italic), Newsreader (body), JetBrains Mono (data) | No change. |
| 27 | Page-bypass templates | Raw HTML in `extra/maha/<page>/index.html`, each page hand-built (mirrors mahaclinic pattern) | Allows per-page DOM precision. No Pelican templates needed for v1. |
| 28 | Robots / discoverability | Public pages indexable. Private pages (`stories/`, `for-interviewers/`, `for-letter-writers-*/`) carry `<meta name="robots" content="noindex,nofollow">` | Discoverability for ADCOMs/interviewers via direct link; not via Google. |
| 29 | Content acquisition workflow | Sohail writes structure + scaffolding; Maha provides numbers, vignettes, bio essay, competency bullets | Spec writes the shell; she fills the soul. |

## 5. Architecture

### 5.1 File operations

```
NEW    theme/static/css/maha-tokens.css       (~25 lines — palette override only)
NEW    theme/static/css/maha.css              (~250 lines — Maha-specific components)

NEW    content/extra/maha/index.html          (home page)
NEW    content/extra/maha/about/index.html    (long bio essay)
NEW    content/extra/maha/mahaclinic/index.html (case study deep-dive)
NEW    content/extra/maha/competencies/index.html (AAMC 15-17 table)
NEW    content/extra/maha/now/index.html      (updates log archive)

NEW    content/extra/maha/cv.pdf              (Maha provides)
NEW    content/extra/maha/images/hero-portrait.jpg (deferred — only if portrait added later)
NEW    content/extra/maha/images/mahaclinic-screenshot.png
NEW    content/extra/maha/images/<additional>.png

# v2 additions:
NEW    content/extra/maha/stories/index.html
NEW    content/extra/maha/stories/<slug>/index.html  (×4-6)
NEW    content/extra/maha/for-interviewers/index.html
NEW    content/extra/maha/for-letter-writers-<8charrand>/index.html

# v3 additions (rolling):
NEW    content/extra/maha/writings/<slug>/index.html
NEW    content/extra/maha/artifacts/<slug>/index.html

MODIFY pelicanconf.py                         (add "content/extra/maha" to walker list at line 38)
MODIFY content/extra/mahaclinic/styles.css    (change @import to maha-tokens.css)
MODIFY content/extra/mahaclinic/index.html    (change theme-color meta to #6B1F2B)
MODIFY content/extra/mahaclinic/about/index.html (same theme-color update)
MODIFY content/extra/mahaclinic/drug.html     (same theme-color update — if applicable)
```

### 5.2 Pelican path mechanics

The walker at `pelicanconf.py:38-43` iterates over each directory in its list and re-maps every file from `content/extra/<X>/...` to `<X>/...` in the output. Adding `"content/extra/maha"` to the list (line 38) is sufficient — no other Pelican config changes needed.

Theme CSS files at `theme/static/css/maha-tokens.css` and `theme/static/css/maha.css` ship automatically via Pelican's `theme/static/` pipeline. No `STATIC_PATHS` change needed.

The `EXTRA_PATH_METADATA` map will gain entries like:
```python
{
    "extra/maha/index.html": {"path": "maha/index.html"},
    "extra/maha/about/index.html": {"path": "maha/about/index.html"},
    "extra/maha/mahaclinic/index.html": {"path": "maha/mahaclinic/index.html"},
    "extra/maha/competencies/index.html": {"path": "maha/competencies/index.html"},
    "extra/maha/now/index.html": {"path": "maha/now/index.html"},
    "extra/maha/cv.pdf": {"path": "maha/cv.pdf"},
    "extra/maha/images/<file>": {"path": "maha/images/<file>"},
    ...
}
```
generated automatically by the walker iteration.

### 5.3 Home page DOM scaffold

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#6B1F2B">
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
      <nav class="site-nav">
        <ul>
          <li><a href="/maha/about/">About</a></li>
          <li><a href="/maha/mahaclinic/">Mahaclinic</a></li>
          <li><a href="/maha/competencies/">Competencies</a></li>
          <li><a href="/maha/now/">Now</a></li>
        </ul>
      </nav>
      <div class="site-social"><!-- email + linkedin if desired --></div>
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
          <a href="mailto:..." class="site-btn">Contact</a>
          <a href="/maha/cv.pdf" class="site-btn site-btn--soft">CV ↓</a>
          <a href="/mahaclinic/" class="site-btn site-btn--soft">Mahaclinic ↗</a>
        </div>
      </div>
    </section>

    <!-- 2. ON THE RECORD -->
    <section class="maha-record-strip">
      <header class="record-header">
        <span class="record-eyebrow">ON THE RECORD</span>
        <span class="record-range">2019 → 2026</span>
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
            Twenty-four biologic dosing flows, search-first, offline-capable, iPad-friendly.
            Replaces the print binder we used to flip through during patient visits.
            <strong>No PHI stored. No diagnoses. FDA-label lookup only.</strong>
          </p>
          <p class="case-body case-body--quiet">
            Used by [N] clinicians across 3 practice locations since [date].
          </p>
          <div class="case-actions">
            <a href="/mahaclinic/" class="site-btn">Open the tool ↗</a>
            <a href="/maha/mahaclinic/" class="site-btn site-btn--soft">Case study →</a>
          </div>
        </div>
        <figure class="case-image">
          <img src="/maha/images/mahaclinic-screenshot.png" alt="Mahaclinic search interface">
          <figcaption>Search · drug · condition</figcaption>
        </figure>
      </div>
    </section>

    <!-- 4. NOW -->
    <section>
      <header class="section-rule"><span>NOW · Q2 2026</span><a href="/maha/now/">archive →</a></header>
      <ul class="now-list">
        <li><span class="now-tag">studying</span> MCAT — target sitting date Aug 2026.</li>
        <li><span class="now-tag">shipping</span> Two more dosing flows: bimzelx HS pediatric + tremfya HS.</li>
        <li><span class="now-tag">reading</span> Atul Gawande, <em>Being Mortal</em>. Eric Topol, <em>Deep Medicine</em>.</li>
        <li><span class="now-tag">applying</span> 2027–28 MD/DO cycle. Texas-focused.</li>
      </ul>
    </section>

    <!-- 5. EXPERIENCE -->
    <section>
      <header class="section-rule"><span>EXPERIENCE</span></header>
      <ul class="maha-experience-list">
        <!-- four .maha-experience-row entries as in §6.2 below -->
      </ul>
    </section>

    <!-- 6. COMPETENCIES (preview) -->
    <section>
      <header class="section-rule"><span>AAMC PREMED COMPETENCIES</span><a href="/maha/competencies/">full mapping →</a></header>
      <div class="competency-preview">
        <!-- 4 .comp-card articles -->
      </div>
    </section>

    <!-- 7. SELECTED WORK -->
    <section>
      <header class="section-rule"><span>SELECTED WORK</span></header>
      <ul class="ruled-list"><!-- 3-4 .ruled-row entries --></ul>
    </section>

    <!-- 8. WRITINGS (v1 placeholder) -->
    <section>
      <header class="section-rule"><span>WRITINGS</span></header>
      <p class="writings-placeholder">
        Notes from the practice — coming soon. Next: "The chart no one had time to make."
      </p>
    </section>

    <!-- 9. ABOUT (short) -->
    <section>
      <header class="section-rule"><span>ABOUT</span><a href="/maha/about/">full bio →</a></header>
      <p class="about-short"><!-- 2 paragraphs --></p>
    </section>

    <!-- 10. COLOPHON -->
    <footer class="site-colophon">
      <span>Maha Mohammad · 2026</span>
      <span>Built on Pelican · Bordeaux + Sepia on Parchment</span>
      <span>Last updated <time datetime="2026-05-19">2026-05-19</time></span>
    </footer>
  </main>
</body>
</html>
```

## 6. Visual System

### 6.1 Palette tokens — `theme/static/css/maha-tokens.css`

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

### 6.2 Component vocabulary

| Component | CSS class | DOM | Source |
|---|---|---|---|
| Hero (no portrait) | `.hero.hero--no-portrait` | `<section>` containing `.hero-content` only | Extends `site.css` `.hero` |
| Hero deck (tagline) | `.hero-deck` | `<p>` between name and bio | New — Instrument Serif italic, ~1.6rem |
| On the Record block | `.maha-record-strip` | `<section>` with `.record-header` + `.record-rows` `<dl>` | New |
| Record row | `.record-rows > div` | `<div>` with `<dt>` + `<dd>` | New — flex, JBMono, tabular-nums, moss-soft top border |
| Featured panel | `.maha-case-study-panel` | `<section>` with `.case-grid` | New |
| Case grid | `.case-grid` | `<div>` containing `.case-prose` + `.case-image` | New — 2-col desktop, stacks ≤700 |
| Case body strong | `.case-body strong` | `<strong>` inside `.case-body` | The "no PHI" line emphasis |
| Now list | `.now-list` | `<ul>` with `<li>` rows | New |
| Now tag chip | `.now-tag` | `<span>` inside `<li>` | JBMono, uppercase, brown text, monospace eyebrow |
| Experience list | `.maha-experience-list` | `<ul>` with `.maha-experience-row` items | New |
| Experience row | `.maha-experience-row` | `<li>` grid: `90px 1fr auto` | Custom 3-col grid |
| Experience annot | `.exp-annot` | `<span>` 3rd grid child | JBMono, small, soft-ink, right-aligned |
| Competency preview | `.competency-preview` | `<div>` 2-col grid (1-col mobile) | New |
| Competency card | `.competency-preview > article` | `<article>` | New — top border, label + body |
| Competency label | `.comp-label` | `<p>` | JBMono, uppercase, ink color |
| Competency body | `.comp-body` | `<p>` | Newsreader body |
| Selected work row | `.ruled-row` | `<li>` | Inherited from `site.css` |
| Writings placeholder | `.writings-placeholder` | `<p>` | Italic, deck color |
| About short | `.about-short` | `<p>` × 2 | Newsreader body |
| Section rule | `.section-rule` | `<header>` | Inherited from `site.css` |
| Site header / nav / colophon | `.site-header` / `.site-nav` / `.site-colophon` | as parent | Inherited from `site.css` |

### 6.3 Maha-specific CSS (in `theme/static/css/maha.css`)

Approximate composition:
- ~30 lines: `@import url('maha-tokens.css');` + base resets + reuse of `site.css` patterns (or actual `@import url('site.css');` if cleaner — TBD during implementation)
- ~30 lines: `.hero--no-portrait` modifier + `.hero-deck` + larger hero-content max-width
- ~50 lines: `.maha-record-strip` + `.record-header` + `.record-rows` flex/grid + `<dt>`/`<dd>` styling + tabular nums
- ~40 lines: `.maha-case-study-panel` + `.case-grid` + `.case-prose` + `.case-image` + `figcaption`
- ~20 lines: `.now-list` + `.now-tag`
- ~30 lines: `.maha-experience-list` + `.maha-experience-row` 3-col grid + `.exp-*` children
- ~30 lines: `.competency-preview` + `.comp-label` / `.comp-body`
- ~20 lines: `.writings-placeholder`, `.about-short`, misc
- ~40 lines: `@media (max-width: 700px)` and `(max-width: 600px)` overrides for the new components only

Estimated total: **~250 lines**, all token-driven.

### 6.4 Typography (inherited unchanged)

- Display: Instrument Serif italic (hero name, hero deck, case-title, h1s on sub-pages)
- Body: Newsreader (running prose, case-body, comp-body, about-short, vignette text)
- Mono: JetBrains Mono (kickers, eyebrows, On-the-Record values, now-tags, exp-annot, exp-date, ruled-date, section-rule labels, colophon)

### 6.5 Numerics

`font-variant-numeric: tabular-nums slashed-zero` applied to:
- `.record-rows dd`
- `.exp-date`
- `.exp-annot`
- `.ruled-date`
- any other numeric context inside `.book-data-row`-pattern blocks

### 6.6 Mahaclinic palette sync (separate small change)

In `content/extra/mahaclinic/styles.css`, line 3:
```diff
- @import url('../theme/css/book-tokens.css');
+ @import url('../theme/css/maha-tokens.css');
```

In `content/extra/mahaclinic/index.html` line 10, `content/extra/mahaclinic/about/index.html` line 10, and `content/extra/mahaclinic/drug.html` (if applicable):
```diff
- <meta name="theme-color" content="#3A4F2A">
+ <meta name="theme-color" content="#6B1F2B">
```

This is a single migration commit. No other mahaclinic changes required.

## 7. Per-Sub-Page Designs (concise)

### 7.1 `/maha/about/` — Long bio essay

- Single-column long-form article, Newsreader, 65ch column.
- Drop cap on opening paragraph.
- Sections: opening (a scene from clinic, not a thesis), UTD years, the gap-year arc, what mahaclinic taught me, what's next.
- ~600–1000 words.
- Reuses `.article-prose` + `.has-dropcap` from `site.css`.
- No section-rule mid-essay; uses `❦ ❦ ❦` dingbat dividers from `book.css`.
- Footer: link to `/maha/` and `/maha/competencies/`.

### 7.2 `/maha/mahaclinic/` — Case study deep-dive

Structure:
1. **The problem** (2 paragraphs) — print-binder workflow, how often dosing references were consulted per patient encounter, what's at stake (biologic dosing errors).
2. **The decisions** (data-row list with rationale)
   - Search-first, not navigation-first — why
   - PWA + offline — why
   - No PHI storage, no diagnoses — why these guardrails
   - Multi-site rollout pattern — why
3. **The guardrails section** — explicit. "What this tool does NOT do." Patient-safety + clinical-informatics framing.
4. **Screenshots** (3-4 inline images with figcaptions) — search view, drug detail view, condition view, about page.
5. **Who uses it** — clinician count, sites, since when.
6. **What's next** — 2-3 planned additions.
7. **Live link** — final CTA to `/mahaclinic/`.

Length: ~800–1200 words. Reuses `.article-prose`.

### 7.3 `/maha/competencies/` — AAMC competency mapping

- Above-table prose (~150 words): explains AAMC's 2023-refresh + 2026-rename of the Premed Competencies (cite the AAMC URL).
- Full table — 15-17 rows. Each row in `.book-data-row`-style grid: `competency name | concrete bullet (1-2 sentences)`.
- Source content from the research brief Q4 mapping table; refine bullets with Maha for specificity.
- Footer note: small italics, "Mapping current as of 2026 AAMC competency framework. Updates as competencies evolve."
- No images.

### 7.4 `/maha/now/` — Updates log

- Reverse-chronological list of small entries.
- Each entry: monospace date prefix + 1-2 line body. JBMono date, Newsreader body.
- Examples: "Shipped tremfya HS flow," "Sat for CARS practice block #4," "Presented mahaclinic at clinic in-service."
- Designed to add an entry every 1-2 weeks. Cheapest possible AAMC competency #10 evidence.
- Pattern from Sohail's site if one exists; otherwise a new `.maha-now-row` class.

### 7.5 `/maha/stories/` — Patient story library *(v2)*

- `<meta name="robots" content="noindex,nofollow">`
- Short intro paragraph: explains de-identification + that stories are reflective material, not patient records.
- Ruled list of 4-6 story titles + 1-line teaser. Each opens to its own page.
- Each individual vignette (`/maha/stories/<slug>/`) is ~150 words, structured as:
  - **Setting** (1 sentence)
  - **What happened** (2-3 sentences)
  - **What I did** (1-2 sentences)
  - **What I learned** (1-2 sentences)
- Newsreader, smaller column (50ch).
- Vignettes also `noindex,nofollow`.

### 7.6 `/maha/for-interviewers/` — Conversation prompts *(v2)*

- `<meta name="robots" content="noindex,nofollow">`
- Linkable in personal-statement footers + interview-prep emails.
- Opens with 1-sentence framing: "Topics I'd love to discuss in an interview, if useful."
- 5-10 prompts in `.book-data-row` format: `topic | 1-sentence elaboration`.
- Example prompts: "How a print binder taught me to build search-first tools," "What I think about biologic prior-auth," "Why the 5-year arc was intentional," etc.
- Plus a link block: "Live tool · Case study · Competencies mapping."

### 7.7 `/maha/for-letter-writers-<8charrand>/` — Recommender resource *(v2)*

- URL has 8-character random suffix as discoverability barrier (`/for-letter-writers-x7k2m9pz/`). Suffix is generated once and never changed.
- `<meta name="robots" content="noindex,nofollow">`.
- No public link from anywhere on the site. Shared only via email to recommenders.
- Structure:
  - Opening (1 paragraph): "Thank you for writing for me. Here is reference material — use any of it freely or ignore it."
  - **Recommender-specific blocks** — one per recommender, each containing: role description (her role under them, dates, scope), 2-3 concrete moments they witnessed, AAMC competencies their letter could surface, and a small "what stood out from your perspective" prompt.
  - **General context block** — full timeline + mahaclinic context + competencies link.
- Recommenders included in v2: TBD with Maha.

### 7.8 Writings sub-pages — `/maha/writings/<slug>/` *(v3)*

Standard article. Reuses `.article-prose`. Section-rule above title. Drop cap on opening paragraph. ~800-2000 words per piece. Three target pieces from the research brief Q9:
1. "The chart no one had time to make"
2. "The seven-year arc"
3. "My patients taught me what I couldn't learn in a classroom"
(Maha picks her own slugs and topics; these are suggested anchors.)

### 7.9 Artifacts sub-pages — `/maha/artifacts/<slug>/` *(v3)*

Each is a short case-study-lite (~300-500 words): problem, decisions, screenshot or excerpt, link if live. Reuses `.article-prose`. Examples:
- `new-ma-training-packet`
- `biologic-intake-workflow`
- `chart-review-prompt-library`

## 8. Mobile Behavior

Inherits all parent breakpoints (`site.css` lines 519-565). Per-component overrides in `maha.css`:

### `≤ 960px` (tablet)
- `.case-grid` keeps 2-col but reduces gap.
- `.competency-preview` reduces gap.
- Nav already wraps via `site.css`.

### `≤ 700px` (mobile portrait)
- `.case-grid` stacks: image above prose.
- `.competency-preview` becomes 1-col.
- `.record-rows` keep 2-col layout (`dt`/`dd` flex), font size steps down.
- `.maha-experience-row` collapses: `.exp-annot` moves below `.exp-body` as a third line.
- Hero loses the wider content column expansion.

### `≤ 600px` (small phone)
- `.record-rows` font scales another step.
- `.case-actions` stacks vertically.
- Hero deck font size reduces.

## 9. Content Requirements (what Maha provides)

| Content | Format | Length | Required for | Priority |
|---|---|---|---|---|
| On-the-Record numbers (7 metrics) | Plain text | 1 number each | v1 home | P0 |
| Mahaclinic clinician count | Number | 1 | v1 home + case study | P0 |
| Hero email address | String | 1 | v1 home | P0 |
| Mahaclinic screenshot | PNG, ≥1200px wide | 1 | v1 home | P0 |
| CV PDF | PDF | n/a | v1 hero | P0 |
| Mahaclinic case study copy | Markdown/prose | ~800-1200 words | v1 case study | P0 |
| Mahaclinic case study screenshots | PNG, ≥1200px wide | 3-4 | v1 case study | P0 |
| Competency mapping bullets | Plain text | 15-17 rows × 1-2 sentences | v1 competencies | P0 |
| About essay | Markdown/prose | ~600-1000 words | v1 about | P0 |
| Now bullets (current Q) | Plain text | 4-6 bullets | v1 home | P0 |
| Site title / hero name spelling preference | String | 1 | v1 home | P0 |
| 4-6 patient story vignettes | Markdown/prose | ~150 words each | v2 stories | P1 |
| For-interviewers prompt list | Plain text | 5-10 prompts | v2 interviewers | P1 |
| For-letter-writers recommender blocks | Markdown | 2-3 blocks | v2 letter-writers | P1 |
| Now-archive seed entries | Plain text | 5-10 entries | v2 now archive | P1 |
| Writings pieces (3 target) | Markdown/prose | ~800-2000 words each | v3 writings | P2 |
| Artifacts case studies | Markdown/prose | ~300-500 words each | v3 artifacts | P2 |

## 10. Implementation Phasing

### v1 — Ship-ready (target: 1 week of focused work)

1. Create `wip/maha-portfolio` branch.
2. Write `theme/static/css/maha-tokens.css`.
3. Write `theme/static/css/maha.css`.
4. Add `"content/extra/maha"` to walker list at `pelicanconf.py:38`.
5. Hand-build `content/extra/maha/index.html` (home page).
6. Hand-build `content/extra/maha/about/index.html`.
7. Hand-build `content/extra/maha/mahaclinic/index.html`.
8. Hand-build `content/extra/maha/competencies/index.html`.
9. Drop in `content/extra/maha/cv.pdf` (placeholder if Maha hasn't supplied yet).
10. Drop in `content/extra/maha/images/mahaclinic-screenshot.png`.
11. Update `content/extra/mahaclinic/styles.css` and `content/extra/mahaclinic/*.html` theme-color metas.
12. Local Pelican build + manual smoke test.
13. Lighthouse audit on `/maha/`.
14. Mobile smoke test at 375px.
15. Push, merge to master, deploy.

### v2 — Private pages and stories (target: 1-2 weeks after v1)

16. Hand-build `content/extra/maha/now/index.html` (full updates log).
17. Hand-build `content/extra/maha/stories/index.html` + 4-6 `<slug>/index.html` vignettes.
18. Hand-build `content/extra/maha/for-interviewers/index.html`.
19. Hand-build `content/extra/maha/for-letter-writers-<rand>/index.html`.
20. Verify all v2 pages serve `<meta name="robots" content="noindex,nofollow">`.
21. Build + deploy.

### v3 — Writings + artifacts (rolling, no deadline)

22. Per-piece: hand-build `content/extra/maha/writings/<slug>/index.html` as Maha writes.
23. Per-artifact: hand-build `content/extra/maha/artifacts/<slug>/index.html` as Maha completes.
24. Update home page's Writings section from placeholder to `.ruled-list` once 2+ pieces exist.
25. Update home page's Selected Work section as artifacts populate.

## 11. Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| M1 | Home page loads at `sohailmo.ai/maha/` with all v1 sections rendered. | Manual: visit URL after deploy. |
| M2 | No `#3A4F2A` (moss) anywhere in `theme/static/css/maha-tokens.css`, `theme/static/css/maha.css`, `content/extra/maha/`, or `content/extra/mahaclinic/`. | `grep -rE "#3A4F2A\|#3a4f2a" content/extra/maha/ content/extra/mahaclinic/ theme/static/css/maha*.css` returns 0. |
| M3 | No card grid, no testimonials, no `font-family: 'Inter'` anywhere in maha CSS/HTML. | `grep -rE "font-family:.*Inter" theme/static/css/maha*.css content/extra/maha/` returns 0. |
| M4 | On the Record shows real numbers (not `—` placeholders) for at least 5/7 metrics. | Manual: visual inspection of home page. |
| M5 | Mahaclinic case study explicitly states "no PHI stored, no diagnoses, FDA-label lookup only" (or near-equivalent). | `grep -i "no PHI\|FDA-label" content/extra/maha/mahaclinic/index.html` returns ≥ 1. |
| M6 | Competencies page lists all 15-17 AAMC competencies with concrete per-row bullets. | Manual: visual inspection + count rows. |
| M7 | `/maha/stories/`, `/maha/for-interviewers/`, `/maha/for-letter-writers-<rand>/` carry `<meta name="robots" content="noindex,nofollow">`. | `grep -l 'noindex,nofollow' content/extra/maha/{stories,for-interviewers,for-letter-writers-*}/index.html` returns each path. |
| M8 | Mobile ≤ 700px: no horizontal scroll on any page. | Manual: Chrome DevTools responsive 375px width. |
| M9 | Lighthouse desktop on home: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95. | `npx lighthouse http://localhost:8000/maha/ --only-categories=performance,accessibility,best-practices --output=json --quiet --chrome-flags="--headless"` |
| M10 | `/mahaclinic/` (the PWA) uses bordeaux palette + `<meta name="theme-color" content="#6B1F2B">`. | `grep "theme-color" content/extra/mahaclinic/*.html` shows `#6B1F2B`. Visual: tool renders in bordeaux. |
| M11 | No mention of GPA or MCAT score anywhere on the public site. | `grep -irE "GPA\|MCAT.{0,5}[0-9]{3}" content/extra/maha/` returns 0 (excluding the literal word "MCAT" in the Now studying line). |
| M12 | No "I want to be a dermatologist" or specialty-fixation language anywhere on the site. | Manual: read through every page. |
| M13 | `<title>` on home page is "Maha Mohammad — clinician + builder" (NOT "Premed portfolio" or "Pre-medical applicant"). | `grep '<title>' content/extra/maha/index.html` shows the approved title. |
| M14 | Hero tagline is "Five years at the bedside. One tool my physicians actually use." | `grep -F "Five years at the bedside" content/extra/maha/index.html` returns 1. |
| M15 | Hero has no `<img>` element in v1 (no portrait). | `grep -c '<img' content/extra/maha/index.html` excludes hero scope; manual inspection of `.hero` section confirms no portrait. |
| M16 | All maha-prefixed pages reference both `maha-tokens.css` and `maha.css` in `<head>`. | `for f in content/extra/maha/**/*.html; do grep -c "maha.*\.css" "$f"; done` returns ≥ 2 for each. |
| M17 | Mahaclinic `@import` line points to `maha-tokens.css`, not `book-tokens.css`. | `grep "@import" content/extra/mahaclinic/styles.css` shows `maha-tokens.css`. |
| M18 | `/maha/cv.pdf` is downloadable. | `curl -sI sohailmo.ai/maha/cv.pdf | head -1` returns 200. |
| M19 | All ruled-list patterns reuse `.ruled-list` / `.ruled-row` from `site.css` (no Maha-specific duplicates). | `grep -E "\.maha-ruled" theme/static/css/maha.css` returns 0. |
| M20 | Site does not load any third-party tracking scripts. | `grep -irE "ga.js\|gtag\|analytics\|hotjar\|fbq" content/extra/maha/` returns 0. |

## 12. Open Questions

1. **Real numbers for On the Record.** Maha to provide. Until then, placeholders use `—` or estimates with a footnote.
2. **Mahaclinic clinician count.** Maha to share. (Self-count from practice; sites are 3 already known.)
3. **Bio essay length and tone.** Maha drafts; Sohail edits if needed.
4. **CV PDF.** Does Maha have an existing CV to drop in, or build from the timeline? Either works; placeholder until provided.
5. **Domain question revisited.** Confirm subdirectory is final (vs. her own domain) before AMCAS application links go in.
6. **Email address.** Maha picks the contact address surfaced on the site.
7. **Recommender list for `/for-letter-writers-<rand>/`.** Maha picks who and what to surface per recommender, after she finalizes her recommender list.
8. **Portrait re-evaluation.** If she wants one in v2, add `.hero--with-portrait` modifier (just removes `.hero--no-portrait`) + drop in `images/hero-portrait.jpg`.
9. **Now-archive seed entries.** Could use git history of mahaclinic work to seed the first 5-10 entries.
10. **Social links in nav?** Sohail's nav has a `.site-social` block. Maha — LinkedIn? GitHub? None? Default: none in v1.
11. **Substack-equivalent subscribe CTA?** Sohail uses `subscribe-banner`. Maha probably doesn't need one until v3 has writings. Defer.

## 13. Risks

- **Maha doesn't have time to provide the v1 content.** Mitigation: build v1 with placeholders. The infrastructure ship is independent of content fill.
- **The "no portrait" choice reads as cold.** Mitigation: revisit after v1 launches; portrait is a one-file-add to reverse.
- **The On-the-Record numbers feel braggy.** Mitigation: keep them as plain rows (no chart, no callout colors), let the data speak. If Maha is uncomfortable, drop the lowest-value rows.
- **The For-Letter-Writers private page leaks publicly.** Mitigation: URL has 8-char random suffix; no public link; `noindex,nofollow`; if a leak is detected, regenerate URL.
- **Mahaclinic palette sync breaks the PWA visually.** Mitigation: change is one `@import` + one `<meta>` tag; smoke-test the PWA after the swap; rollback is a one-line revert.
- **Competency-mapping page reads as performative.** Mitigation: bullets must be *concrete* and *specific*, not generic. "Empathy — pediatric ER + chronic skin-disease patients with disfigurement and depression overlap" > "I am empathetic." Specificity is the difference.
- **Med-school cycle slides past 2027-28.** Mitigation: the `Now` line is one bullet, edited each quarter; no other page promises a specific cycle.
- **AAMC competency framework changes again.** Mitigation: the competencies page footer notes "current as of 2026 framework." Maha updates if AAMC revises again.
- **Reader pattern-matches "AI builder" despite framing.** Mitigation: case-study language leans on patient-safety + multi-site adoption + explicit guardrails. The word "AI" appears sparingly; "tool" and "reference" dominate.
- **Pre-commit hooks block deploy.** Mitigation: run the existing repo's pre-commit hooks before commit; fix issues; never use `--no-verify`.

## 14. Success Criteria (rollup)

- S1. A first-time visitor understands "Lead MA + clinician + builder" in 30 seconds.
- S2. Interviewers can land on `/maha/`, scroll to On-the-Record + Featured + Now, and have 3 concrete topics to discuss.
- S3. LOR writers shared `/maha/for-letter-writers-<rand>/` can write a concrete, specific letter without needing a follow-up call.
- S4. Maha can find any story, role description, or competency mapping in under 30 seconds while drafting secondary essays.
- S5. The mahaclinic case study unambiguously frames the tool as patient-safety reference (not "AI tool").
- S6. The AAMC competency mapping page is unique vs. every other applicant portfolio Maha can find on the public web (verified by 10-portfolio scan).
- S7. Mahaclinic and the portfolio share one visual brand (bordeaux + sepia on parchment).
- S8. The site contains zero of: GPA, MCAT score, specialty fixation, AI-utopianism, testimonials, card grids, glassmorphism, purple/indigo accents.
- S9. Mobile (375px) renders all pages without horizontal scroll.
- S10. Lighthouse desktop on home and case study: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- S11. The Now log is updated at least once per month for the duration of the application cycle.

## 15. File Index (fast onboarding)

| Path | Purpose |
|---|---|
| `history/2026-05-18-book-calculator-uiux-design.md` | Parent design system spec — read §6 (components) and §7 (tokens) |
| `history/2026-05-19-site-wide-design-rollout-brief.md` | Site rollout brief — context for `site.css` |
| `history/2026-05-19-site-design-rollout-plan.md` | Implementation plan for site rollout |
| `history/2026-05-19-maha-portfolio-design.md` | **This document** |
| `research/2026-05-19-med-school-admissions-may-2026.md` | Load-bearing input — May 2026 admissions landscape, 5,252 words, cited sources |
| `theme/static/css/book-tokens.css` | Inherited typography + spacing tokens (palette overridden by maha-tokens.css) |
| `theme/static/css/book.css` | Book component CSS (reused as needed) |
| `theme/static/css/site.css` | Site-wide v2 components (`.hero`, `.ruled-list`, `.section-rule`, etc.) — heavily reused by Maha's CSS |
| `theme/static/css/maha-tokens.css` | **New** — palette override |
| `theme/static/css/maha.css` | **New** — Maha-specific components |
| `content/extra/maha/` | **New** — Maha's site content tree |
| `content/extra/mahaclinic/styles.css` | **Modify** — `@import` line |
| `content/extra/mahaclinic/index.html` (and `about/`, `drug.html`) | **Modify** — `theme-color` meta |
| `pelicanconf.py` line 38 | **Modify** — add `"content/extra/maha"` to walker list |

## 16. Verification Commands

```bash
# M2 — no moss
grep -rE "#3A4F2A|#3a4f2a" content/extra/maha/ content/extra/mahaclinic/ theme/static/css/maha*.css
# must return 0 results

# M3 — no Inter
grep -rE "font-family:.*Inter" theme/static/css/maha*.css content/extra/maha/
# must return 0 results

# M5 — mahaclinic case study has guardrails copy
grep -i "no PHI\|FDA-label" content/extra/maha/mahaclinic/index.html
# must return ≥ 1

# M7 — private pages noindex
for d in stories for-interviewers for-letter-writers-*; do
  test -f "content/extra/maha/$d/index.html" && \
    grep -l 'noindex,nofollow' "content/extra/maha/$d/index.html"
done
# must list each path that exists

# M9 — Lighthouse
npx lighthouse http://localhost:8000/maha/ \
  --only-categories=performance,accessibility,best-practices \
  --output=json --quiet --chrome-flags="--headless" \
  | jq '.categories | to_entries[] | "\(.key): \(.value.score)"'
# performance ≥ 0.90, accessibility ≥ 0.95, best-practices ≥ 0.95

# M10 — mahaclinic theme-color synced
grep "theme-color" content/extra/mahaclinic/index.html content/extra/mahaclinic/about/index.html
# must show #6B1F2B for each

# M11 — no public scores
grep -irE "GPA[^A-Z]|MCAT.{0,5}[0-9]{3}" content/extra/maha/
# must return 0 (the word "MCAT" without a score is allowed in Now)

# M16 — every maha page references both stylesheets
for f in content/extra/maha/**/*.html; do
  printf "%s: " "$f"; grep -c "maha.*\.css" "$f"
done
# must show ≥ 2 for each

# M17 — mahaclinic @import points to maha-tokens.css
grep "@import" content/extra/mahaclinic/styles.css
# must show maha-tokens.css

# M19 — no maha-prefixed ruled-list duplicates
grep -E "\.maha-ruled" theme/static/css/maha.css
# must return 0
```

## 17. Decision Log (Appendix)

| Question | Options considered | Decision | Driver |
|---|---|---|---|
| Primary frame | Clinician-builder / Med school applicant / Clinical CV / Editorial publication | **Clinician-builder** | User choice |
| Content sections | Full list + optionals | About + Mahaclinic + Experience + Contact essentials; Writings + Artifacts + Now optional all selected | User choice |
| URL placement | sohailmo.ai/maha/ subdir / subdomain / own domain / standalone repo | **Subdirectory** | User choice; matches book + mahaclinic precedent |
| Palette family | Bordeaux+Sepia / Burgundy+Mustard / Crimson+Slate / Cabernet+Charcoal | **Bordeaux + Sepia** | User choice; closest to broadsheet warmth |
| Med school visibility | Quiet/implicit / Explicit / Hidden / Toggle | **Quiet/implicit** | User choice; preserves pride goal |
| Approach | A Editor's Notebook / B Field Manual / C Workbench / Hybrid | **Hybrid (Notebook + Workbench)** | User choice |
| Metrics treatment | Card grid / Data-row strip / Margin annotations / All / None | **Data-row strip ("On the Record") + margin annotations on Experience** | User asked for metrics; broadsheet vocabulary requires data-row, not cards |
| Hero portrait | Include / Omit | **Omit** | User skipped option; research mildly skeptical of "hobby photos in the lead" |
| Mahaclinic palette | Sync to bordeaux / Keep moss | **Sync to bordeaux** | User choice; brand alignment |
| Tagline | Tagline 1 / 2 / 3 | **"Five years at the bedside. One tool my physicians actually use."** | User choice |
| Sub-pages added from research | Approve all / Trim some | **Approve all** (competencies, stories, for-interviewers, for-letter-writers) | User choice |
| Token architecture | Standalone file / Import + override / Big swap | **Import + override** | DRY; typography updates propagate |
| Build mechanism | Pelican template / Raw HTML walker | **Raw HTML walker** | Matches mahaclinic precedent; per-page control |

## 18. Out of Scope (explicit)

- A custom wordmark for Maha (defer to a P4-equivalent polish phase if ever).
- A Marimo widget or interactive tool embedded inside Maha's site (mahaclinic is the tool; portfolio is the showcase).
- A separate domain / DNS.
- Auth, paywall, comments, search, newsletter modal, social-share.
- An iOS/Android app version of mahaclinic — already covered by the PWA.
- Migration of any existing Sohail-site content to bordeaux. Maha's palette is hers alone.
- AAMC/AMCAS/AACOMAS/TMDSAS application content — the site supports those applications; it is not them.
- Translation of any page to another language. English only in v1.
- Print stylesheet for the portfolio. Inherited if `book.css` print rules transitively apply; not specifically designed.

## 19. Next Step

Invoke `superpowers:writing-plans` skill to produce the per-task implementation plan from this spec. Plan saved to `history/2026-05-19-maha-portfolio-plan.md`.

---

*End of design spec.*
