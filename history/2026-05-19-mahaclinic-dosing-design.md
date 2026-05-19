# Maha Clinic — Dermatology Dosing Reference (Design Spec)

**Date:** 2026-05-19
**Author:** Sohail Mohammad (with Claude)
**Status:** Approved, awaiting implementation plan
**Repo affected:** `Sohailm25.github.io` (new self-contained section under `content/extra/mahaclinic/`)
**Out of scope for this repo:** none — the calculator and book repos are untouched

---

## 1. Context

Sohail's wife is the lead medical assistant in a dermatology practice. The practice's MAs handle dosing lookups for ~28 biologic and small-molecule dermatology medications (Dupixent, Cosentyx, Skyrizi, Humira, Tremfya, Adbry, Bimzelx, Taltz, Ebglyss, Cibinqo, Rinvoq, Otezla, Sotyktu, Olumiant, Leqselvi, Litfulo, Nemluvio, Icotyde, Rhapsido, and others) across multiple indications (atopic dermatitis, psoriasis, hidradenitis suppurativa, bullous pemphigoid, prurigo nodularis, urticaria, alopecia areata).

She has authored print-ready HTML flowcharts for each drug-indication pair (~28 files), located in `/Users/sohailmo/Downloads/Please print/`. Each flowchart follows a consistent structure:

```
Drug name
Vial sizes / route subtitle
Indication eyebrow
↓
Age question (1–3 age bands)
↓ (per band)
Weight branches (1–3 weight rows)
↓ (per row)
Dose card { loading dose (sometimes null), maintenance dose, frequency, device }
↓
Supply note (autoinjector vs syringe rules)
```

These flowcharts currently exist as static printables. The team's reference workflow is "find the right printout, read it, transcribe the dose into the order." This is error-prone (printouts get lost, get out of date, are read in low light, etc.) and doesn't scale to onboarding new MAs.

**The ask:** transform the print flowcharts into an interactive iPad-first reference tool living at `sohailmo.ai/mahaclinic/`, hidden from the rest of the site (no inbound links, `noindex`), themed to match the existing book/calculator design language (moss + oxblood on parchment, Instrument Serif italic + Newsreader + JetBrains Mono), and packaged as an installable PWA with full offline support so it works in exam rooms regardless of network state.

The tool serves two user intents simultaneously: (a) **confirm a dose** for a known drug + known patient, (b) **train new MAs** by exposing the full decision structure of each drug. The chosen interaction model ("trace-through") satisfies both — see §6.2.

## 2. Goals

1. **One canonical reference** for dermatology dosing across the practice's biologic + small-molecule drug list, replacing the current binder-of-printouts workflow.
2. **iPad-first** ergonomics: touch-friendly hit targets, full-screen PWA install, responsive down to iPhone-SE (375px) and up to desktop without visual regressions.
3. **Offline-capable.** Service worker caches all 28 drug data files + the shell on first install; the tool works in airplane mode and on clinic-WiFi failure.
4. **Visually continuous** with `sohailmo.ai/book/` — same paper, ink, brown, type stacks. Reuses the existing `book-tokens.css` directly; no duplicate token set.
5. **Self-contained.** All mahaclinic code lives under `content/extra/mahaclinic/` and ships via the existing Pelican `EXTRA_PATH_METADATA` walker pattern. Zero changes to templates, zero risk to the rest of the site.
6. **Hidden by obscurity.** Not linked from `sohailmo.ai`, not in the sitemap, `noindex`/`nofollow` headers, `robots.txt` disallows the route.
7. **Safe by visible mitigation.** Phase 1 ships extracted but unreviewed dosing data — see §9 for the five safety nets that absorb this risk.

## 3. Non-Goals

- **PA / insurance content.** Out of scope for Phase 1. Phase 2 backlog (§16).
- **Patient counseling scripts.** Out of scope for Phase 1. Phase 2 backlog.
- **Workflow checklists** ("how to start a patient on Dupixent"). Out of scope for Phase 1.
- **Authentication.** No login, no PIN. The route is hidden, not protected. The data is non-PHI reference info available in any FDA prescribing label.
- **Real-time multi-user sync.** Recents are device-local (`localStorage`). No backend.
- **Dark mode.** Same two-color print register as the book.
- **Cross-device sync of any kind.** Each iPad/iPhone has its own state.
- **Print artifacts.** Web replaces the print flowcharts; no separate print PDFs generated. (A clean print stylesheet is included as a side effect so Safari's "Print to PDF" produces usable output — but no automated print build.)
- **A separate UI for adding/editing drugs.** Updates happen via git commits to JSON files. If non-technical editing becomes a real need, it's Phase 2.
- **Decision support beyond what's on the existing flowcharts.** No "which drug should I pick" recommender — the existing flowcharts assume drug selection happened upstream by the provider, and the tool honors that.
- **Calculator-like interactive widgets.** Mahaclinic is a reference tool, not a workspace.

## 4. Decisions

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Scope | Reference tool only — dosing data for ~28 drug-indication pairs; no PA, counseling, or workflow content | YAGNI; ships a complete vertical slice rather than a half-built broad scope; Phase 2 adds the rest |
| 2 | User intent | Two intents served simultaneously: confirm-dose + train-MA | Sohail's explicit answer to "what's the moment of use"; both selected in brainstorm |
| 3 | Home screen | Search + recently-viewed + most-used | Sohail's choice. 80% of usage is 6–8 drugs; search-first respects that without precluding browsing |
| 4 | Drug detail UX | "Trace-through": all paths visible, tap age band to expand & dim others, tap weight to surface dose | Sohail's choice. Preserves training value of seeing all paths while focusing attention on the active selection |
| 5 | Drug scope, Phase 1 | All 28 drug-indication pairs from the Downloads folder | Source content already authored; no reason to ship a subset |
| 6 | Branding | Functional title only (`Dermatology Dosing`); no personal/practice name on-page | Sohail's choice. Team-facing, not personal-branded |
| 7 | Privacy posture | Hidden URL only (noindex, no inbound links, robots disallow); no auth | Non-PHI reference info; threat model is low; auth would require non-trivial infra change |
| 8 | App-likeness | Full PWA + service-worker offline + Add-to-Home-Screen | Critical for in-clinic reliability and "feels real" UX |
| 9 | Data model | One JSON file per drug-indication, plus a small index for search | Validatable at build, extensible (Phase 2 adds new fields without restructure), language-neutral |
| 10 | Content extraction strategy | Claude extracts all 28 JSONs from the existing HTMLs and ships them; safety nets (§9) absorb the unreviewed-data risk | Sohail's explicit choice after I pushed back twice; tradeoff documented in §17 (Risks) |
| 11 | Print artifacts | Web-only; print stylesheet present as a side effect; no separate print PDF build | Sohail's choice |
| 12 | Tech stack | Vanilla HTML + CSS + JS; no framework, no bundler, no transpiler | Matches the book's "no build" philosophy; ships fast; debuggable from Safari iPad inspector |
| 13 | Integration | New `mahaclinic/` directory added to the existing Pelican `EXTRA_PATH_METADATA` walker (`pelicanconf.py:36-42`) alongside `research` and `book` | One-line config change; zero risk to existing templates |
| 14 | Design tokens | Reuse `theme/static/css/book-tokens.css` directly; new component CSS in `styles.css` under `.maha-` namespace | Visual continuity; no duplicate token set |
| 15 | Routing | Client-side `pushState`-based SPA-style routing; `drug.html` serves as fallback for direct deep-link hits | Smooth iPad navigation; deep-linkable URLs |
| 16 | Branch | New branch `wip/mahaclinic` off `master` | Standard. Independent of the concurrent `wip/site-design-rollout-v2-parallel` |
| 17 | Multi-indication drugs | Treated as distinct entities (`dupixent-ad`, `dupixent-bp`, `dupixent-pn`, `dupixent-urticaria`); search returns them as separate results | Matches the 1:1 mapping with existing print files; clearer semantics in search |
| 18 | Search behavior | Substring + token match on drug name AND indication name; empty query shows recents + most-used | Standard expected behavior; minimal cognitive load |
| 19 | Recents storage | `localStorage`, MRU list capped at 5, key `mahaclinic.recents` | Lightest possible; no backend; per-device |
| 20 | "Most used" curation | Hard-coded list of ~8 slugs in `data/_config.json`'s `most_used` field; tunable by editing one JSON value | Cheaper than usage analytics; meets actual need; single source of truth in `_config.json` |
| 21 | Testing strategy | JSON schema validation (pytest+jsonschema) + extraction smoke tests (3 hand-checked drugs) + UI behavior tests (Playwright) | TDD where it pays; skip pixel diffs |
| 22 | Safety nets | Five visible mechanisms: page-level disclaimer, per-dose "verify with label" stamp, review-state badge, source attribution, report-an-issue mailto | Explicit risk mitigation for the extract-and-ship decision |
| 23 | Review state | Each drug JSON has a `reviewed: {by, date}` field; UI shows amber `AUTO-EXTRACTED` badge if null, green `REVIEWED [date]` if set | Soft signal; doesn't block shipping; creates natural prioritization pressure |
| 24 | Update workflow | Edits happen via git commits to JSON files in `data/`; service worker auto-purges old caches on new version | Standard static-site flow |
| 25 | Type scale & spacing | Reuse book scale unchanged; mahaclinic-specific exception: dose-card numerics use `--fs-h3` for emphasis | Visual continuity dominates |
| 26 | Disclaimer placement | (a) Top of every drug page in a moss-bordered callout, (b) inline below every dose value | Belt-and-suspenders; impossible to miss |

## 5. Architecture

### 5.1 Pelican integration

The site already uses `EXTRA_PATH_METADATA` to bypass Pelican's template system for `content/extra/book/` and `content/extra/research/` directories (`pelicanconf.py:32-42`). Mahaclinic uses the same pattern.

**File operation:**

```python
# pelicanconf.py — line ~37
# BEFORE
for static_dir in ["content/extra/research", "content/extra/book"]:
    ...

# AFTER
for static_dir in ["content/extra/research", "content/extra/book", "content/extra/mahaclinic"]:
    ...
```

Result: every file inside `content/extra/mahaclinic/` ships unchanged to `/mahaclinic/<path>` in the built output. Templates not invoked. CSS not auto-injected. The directory is fully self-contained.

This is the same mechanism that lets the book ship its own embedded `<style>` blocks; mahaclinic gets the same isolation.

### 5.2 File layout

```
content/extra/mahaclinic/
├── index.html              # Home shell (search input + slots for results)
├── drug.html               # Drug detail shell (template; populated by JS based on URL)
├── about.html              # Disclaimer + how-to-use + maintainer contact
├── app.js                  # Router + search + render + recents + extraction-state
├── styles.css              # Mahaclinic-specific CSS; @imports ../../theme/static/css/book-tokens.css
├── sw.js                   # Service worker
├── manifest.json           # PWA manifest
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── data/
│   ├── _index.json         # Small file listing all drug-indication pairs (for search)
│   ├── _config.json        # most-used drugs list, last-build timestamp, version
│   ├── dupixent-ad.json
│   ├── dupixent-bp.json
│   ├── dupixent-pn.json
│   ├── dupixent-urticaria.json
│   ├── cosentyx-hs.json
│   ├── cosentyx-pso.json
│   ├── ...                 # ~28 total
│   └── (one per drug-indication)
└── (no markdown — Pelican is bypassed for this entire tree)
```

### 5.3 Routing

Client-side. Two physical HTML files (`index.html`, `drug.html`); `app.js` reads `location.pathname` on load and renders accordingly. Navigation between drugs uses `history.pushState` to update the URL without a full page reload.

| URL | Renders |
|-----|---------|
| `/mahaclinic/` | Home (search + recents) |
| `/mahaclinic/dupixent-ad/` | Drug detail for Dupixent AD |
| `/mahaclinic/about/` | About + disclaimer + report-issue |

For drug pages, the actual file served is `/mahaclinic/<slug>/index.html`. To keep this static-host-friendly, each drug slug gets a stub `index.html` that imports the shared `drug.html` template via a tiny redirect-load — OR we configure URL rewriting via a `.htaccess`-style trick. **Decision: use directory-based static hosting.** Each drug gets its own directory with an `index.html` that's a one-line copy of `drug.html`. This means the deploy is just 28 stubs that all load the same JS. The walker handles this automatically.

A simpler alternative is to use `/mahaclinic/?drug=dupixent-ad` query-string routing, but path routing is cleaner for sharing and PWA caching.

**Build-time step:** a small Python script in `scripts/build_mahaclinic_stubs.py` generates the per-drug stub directories at Pelican build time (or before; can be a one-off then committed). This script reads `data/_index.json` and writes a stub `index.html` per slug. Stubs are committed to the repo (they don't change frequently).

## 6. UX surfaces

### 6.1 Home screen (`/mahaclinic/`)

Layout, top to bottom (iPad portrait reference, responsive scales up/down):

| Region | Component | Notes |
|--------|-----------|-------|
| 0–24px | Top safe-area padding | `viewport-fit=cover` |
| 24–32px | Broadsheet ruled bar | 2px moss top + 0.5px moss bottom, the same rule used on `/book/` |
| 32–60px | Eyebrow | Mono, small caps: `MAHA CLINIC · DERMATOLOGY DOSING` |
| 60–110px | Title | Instrument Serif italic: `Dermatology Dosing.` |
| 110–180px | Search input | 56px tall, parchment fill, moss border, JBMono placeholder `⌕  Search drug or condition…` |
| 180–240px | "Recently viewed" label + pill row | Up to 5 pills, oxblood outline; absent on first visit |
| 240–320px | "Most used in clinic" label + pill row | ~8 hard-coded pills |
| ... | Dingbat divider `❦ ❦ ❦` | Center-aligned moss |
| ... | Power-user footer | `See all · By condition · A–Z` — tap to expand a hidden full index |
| (first visit) | PWA install hint | Dismissible banner: "Add to Home Screen for full-screen + offline. Share button → Add to Home Screen." Stored dismissal in localStorage |

**Search interaction:**
- Real-time filter on every keystroke (debounced 60ms)
- Filter source: `data/_index.json` (loaded once on home mount, kept in memory)
- Match logic: tokenized substring against `drug.toLowerCase()` and `indication.toLowerCase()`, returning a ranked union
- Empty query → recents + most-used; non-empty query → results list (max 20, no pagination — if more than 20 match, the user should type more)
- Each result row shows: drug name (Instrument Serif italic), indication eyebrow (Mono small caps), review-state dot (amber/green)

### 6.2 Drug detail page (`/mahaclinic/<slug>/`)

Layout, top to bottom:

| Region | Component | Notes |
|--------|-----------|-------|
| Top | Crumb back link | Mono: `← Search · Dupixent AD` |
| | Review-state badge (top-right, absolute-positioned) | Amber `AUTO-EXTRACTED` until reviewed, green `REVIEWED 2026-05-22` after |
| | Title block | `Dupixent.` (Instrument Serif italic) + `ATOPIC DERMATITIS` eyebrow + vial sizes subtitle |
| | Disclaimer callout | Moss-bordered, parchment fill: *"Reference only. Always verify against the current FDA prescribing label before administering."* |
| Middle | Trace tree | One row per age band. Collapsed by default. Tapping a band: it expands, others dim to opacity 0.45. Expanded band shows weight rows. Tapping a weight: dose card animates in below it (moss fill, parchment numerals). |
| Bottom | Supply notes | Mono, bulleted list, oxblood ink |
| | Source attribution | Tiny Mono footer: *"Extracted from Dupixent AD.html on 2026-05-19. Verify with current FDA label."* |
| | Report-an-issue button | Oxblood outlined button: `Report an issue` — `mailto:` link with subject pre-filled `[mahaclinic] dupixent-ad: ` and body containing the current URL and a "describe the issue" prompt |

**State management:** active band + active weight are kept in JS component state only. Not encoded in the URL. Reload returns to "all collapsed" state. This is intentional: URL-encoded patient-derived selections would risk PHI leakage if a URL is ever screenshotted or shared.

**Touch behavior:**
- Hit targets: minimum 44×44px (iOS HIG)
- No hover dependency; all interactions tap-driven
- No double-tap-zoom suppression (we want pinch-zoom to work for accessibility)
- Active band gets a 3px moss left+right border + 6% darker fill so it's visible at glance

### 6.3 About page (`/mahaclinic/about/`)

Single page, brief:

1. What this is ("Dermatology dosing reference for [practice] MAs")
2. Who maintains it
3. **Prominent disclaimer** — bigger and louder than the per-page disclaimer
4. How to report an error (mailto link, same as drug page)
5. Last-deployed timestamp (read from `data/_config.json`)
6. List of all drug-indication pairs with their review state (amber/green dots) — useful overview for the team

## 7. Data model

### 7.1 Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MahaclinicDrugIndication",
  "type": "object",
  "required": ["slug", "drug", "indication", "indication_short", "age_bands", "source"],
  "properties": {
    "slug": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
    "drug": { "type": "string", "minLength": 1 },
    "indication": { "type": "string", "minLength": 1 },
    "indication_short": { "type": "string", "minLength": 1, "maxLength": 8 },
    "vial_sizes": { "type": "array", "items": { "type": "string" } },
    "route": { "type": "string", "enum": ["subcutaneous", "intravenous", "oral", "topical", "intramuscular"] },
    "age_bands": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["label", "weights"],
        "properties": {
          "label": { "type": "string" },
          "label_short": { "type": "string" },
          "hint": { "type": "string" },
          "weights": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": ["label", "maintenance"],
              "properties": {
                "label": { "type": "string" },
                "label_metric": { "type": "string" },
                "loading": {
                  "oneOf": [
                    { "type": "null" },
                    {
                      "type": "object",
                      "required": ["value"],
                      "properties": {
                        "value": { "type": "string" },
                        "n_injections": { "type": "integer", "minimum": 1 },
                        "notes": { "type": "string" }
                      }
                    }
                  ]
                },
                "maintenance": {
                  "type": "object",
                  "required": ["value", "frequency"],
                  "properties": {
                    "value": { "type": "string" },
                    "frequency": { "type": "string" },
                    "n_injections": { "type": "integer", "minimum": 1 },
                    "notes": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "supply_notes": { "type": "array", "items": { "type": "string" } },
    "source": {
      "type": "object",
      "required": ["file", "extracted_on"],
      "properties": {
        "file": { "type": "string" },
        "extracted_on": { "type": "string", "format": "date" }
      }
    },
    "reviewed": {
      "type": "object",
      "properties": {
        "by": { "type": ["string", "null"] },
        "date": { "type": ["string", "null"], "format": "date" }
      }
    }
  }
}
```

### 7.2 Example: `data/dupixent-ad.json`

```json
{
  "slug": "dupixent-ad",
  "drug": "Dupixent",
  "indication": "Atopic Dermatitis",
  "indication_short": "AD",
  "vial_sizes": ["200 mg / 1.14 mL", "300 mg / 2 mL"],
  "route": "subcutaneous",
  "age_bands": [
    {
      "label": "Infants 6 mo–5 yr",
      "label_short": "Infants",
      "hint": "no loading dose",
      "weights": [
        {
          "label": "11–<33 lbs",
          "label_metric": "5–<15 kg",
          "loading": null,
          "maintenance": { "value": "200 mg", "frequency": "every 4 weeks", "n_injections": 1 }
        },
        {
          "label": "33–<66 lbs",
          "label_metric": "15–<30 kg",
          "loading": null,
          "maintenance": { "value": "300 mg", "frequency": "every 4 weeks", "n_injections": 1 }
        }
      ]
    },
    {
      "label": "Children & Adolescents 6–17 yr",
      "label_short": "Children",
      "hint": "load + maintain",
      "weights": [
        {
          "label": "33–<66 lbs",
          "label_metric": "15–<30 kg",
          "loading": { "value": "600 mg", "n_injections": 2, "notes": "2 × 300 mg" },
          "maintenance": { "value": "300 mg", "frequency": "every 4 weeks", "n_injections": 1 }
        },
        {
          "label": "66–<132 lbs",
          "label_metric": "30–<60 kg",
          "loading": { "value": "400 mg", "n_injections": 2, "notes": "2 × 200 mg" },
          "maintenance": { "value": "200 mg", "frequency": "every 2 weeks", "n_injections": 1 }
        },
        {
          "label": "≥132 lbs",
          "label_metric": "≥60 kg",
          "loading": { "value": "600 mg", "n_injections": 2, "notes": "2 × 300 mg" },
          "maintenance": { "value": "300 mg", "frequency": "every 2 weeks", "n_injections": 1 }
        }
      ]
    },
    {
      "label": "Adults 18+",
      "label_short": "Adults",
      "hint": "load + maintain",
      "weights": [
        {
          "label": "all weights",
          "loading": { "value": "600 mg", "n_injections": 2, "notes": "2 × 300 mg" },
          "maintenance": { "value": "300 mg", "frequency": "every 2 weeks", "n_injections": 1 }
        }
      ]
    }
  ],
  "supply_notes": [
    "Patients 2+ years: autoinjector or syringe.",
    "Patients 6 months to <2 years: syringes only."
  ],
  "source": { "file": "Dupixent AD.html", "extracted_on": "2026-05-19" },
  "reviewed": { "by": null, "date": null }
}
```

### 7.3 Index: `data/_index.json`

A small array (~3 KB) listing all drug-indication pairs. Loaded once on home mount, kept in memory for search.

```json
[
  {"slug": "adbry-adult", "drug": "Adbry", "indication": "Atopic Dermatitis", "indication_short": "AD (Adult)", "reviewed": false},
  {"slug": "adbry-peds", "drug": "Adbry", "indication": "Atopic Dermatitis (Pediatric)", "indication_short": "AD (Peds)", "reviewed": false},
  {"slug": "bimzelx-hs", "drug": "Bimzelx", "indication": "Hidradenitis Suppurativa", "indication_short": "HS", "reviewed": false},
  {"slug": "bimzelx-pso", "drug": "Bimzelx", "indication": "Plaque Psoriasis", "indication_short": "PsO", "reviewed": false},
  {"slug": "cibinqo-ad", "drug": "Cibinqo", "indication": "Atopic Dermatitis", "indication_short": "AD", "reviewed": false},
  {"slug": "cosentyx-hs", "drug": "Cosentyx", "indication": "Hidradenitis Suppurativa", "indication_short": "HS", "reviewed": false},
  {"slug": "cosentyx-pso", "drug": "Cosentyx", "indication": "Plaque Psoriasis", "indication_short": "PsO", "reviewed": false},
  {"slug": "dupixent-ad", "drug": "Dupixent", "indication": "Atopic Dermatitis", "indication_short": "AD", "reviewed": false},
  {"slug": "dupixent-bp", "drug": "Dupixent", "indication": "Bullous Pemphigoid", "indication_short": "BP", "reviewed": false},
  {"slug": "dupixent-pn", "drug": "Dupixent", "indication": "Prurigo Nodularis", "indication_short": "PN", "reviewed": false},
  {"slug": "dupixent-urticaria", "drug": "Dupixent", "indication": "Chronic Urticaria", "indication_short": "Urticaria", "reviewed": false},
  {"slug": "ebglyss-ad", "drug": "Ebglyss", "indication": "Atopic Dermatitis", "indication_short": "AD", "reviewed": false},
  {"slug": "humira-hs", "drug": "Humira", "indication": "Hidradenitis Suppurativa", "indication_short": "HS", "reviewed": false},
  {"slug": "humira-pso", "drug": "Humira", "indication": "Plaque Psoriasis", "indication_short": "PsO", "reviewed": false},
  {"slug": "icotyde-ad", "drug": "Icotyde", "indication": "Atopic Dermatitis", "indication_short": "AD", "reviewed": false},
  {"slug": "leqselvi-aa", "drug": "Leqselvi", "indication": "Alopecia Areata", "indication_short": "AA", "reviewed": false},
  {"slug": "litfulo-aa", "drug": "Litfulo", "indication": "Alopecia Areata", "indication_short": "AA", "reviewed": false},
  {"slug": "nemluvio-pn", "drug": "Nemluvio", "indication": "Prurigo Nodularis", "indication_short": "PN", "reviewed": false},
  {"slug": "olumiant-aa", "drug": "Olumiant", "indication": "Alopecia Areata", "indication_short": "AA", "reviewed": false},
  {"slug": "otezla-pso", "drug": "Otezla", "indication": "Plaque Psoriasis", "indication_short": "PsO", "reviewed": false},
  {"slug": "rhapsido-ad", "drug": "Rhapsido", "indication": "Atopic Dermatitis", "indication_short": "AD", "reviewed": false},
  {"slug": "rinvoq-ad", "drug": "Rinvoq", "indication": "Atopic Dermatitis", "indication_short": "AD", "reviewed": false},
  {"slug": "skyrizi-pso", "drug": "Skyrizi", "indication": "Plaque Psoriasis", "indication_short": "PsO", "reviewed": false},
  {"slug": "sotyktu-pso", "drug": "Sotyktu", "indication": "Plaque Psoriasis", "indication_short": "PsO", "reviewed": false},
  {"slug": "taltz-adults-pso", "drug": "Taltz", "indication": "Plaque Psoriasis (Adult)", "indication_short": "PsO (Adult)", "reviewed": false},
  {"slug": "taltz-peds-pso", "drug": "Taltz", "indication": "Plaque Psoriasis (Pediatric)", "indication_short": "PsO (Peds)", "reviewed": false},
  {"slug": "tremfya-pso", "drug": "Tremfya", "indication": "Plaque Psoriasis", "indication_short": "PsO", "reviewed": false}
]
```

Final slug list and exact indication names are confirmed during extraction. The list above is a working draft from inspecting filenames; one or two entries may be renamed/merged once we read each source HTML.

### 7.4 Config: `data/_config.json`

```json
{
  "version": "1.0.0",
  "last_built": "2026-05-19T14:00:00Z",
  "most_used": ["dupixent-ad", "cosentyx-hs", "skyrizi-pso", "humira-hs", "tremfya-pso", "adbry-adult", "bimzelx-hs", "taltz-adults-pso"],
  "maintainer_email": "sohailmo.ai@gmail.com"
}
```

The `most_used` list is editable by Sohail; the UI re-renders the home pills from it.

### 7.5 Extraction process

A one-off script — `scripts/extract_mahaclinic_data.py` — reads each HTML in `/Users/sohailmo/Downloads/Please print/` and produces a candidate JSON in `content/extra/mahaclinic/data/`. The script:

1. Uses BeautifulSoup to parse the HTML
2. Extracts drug name from `.drug-title`, indication from `.drug-indication`, vial sizes from `.drug-subtitle`
3. Walks the branch structure (age `.branch-label` → weight `.weight-label` / `.circle-label` → dose card)
4. For each dose card, extracts loading + maintenance labels and values
5. Extracts supply notes from `.supply-note`
6. Writes JSON to the correct slug filename
7. Logs a per-file extraction summary (counts of age bands and weight rows extracted) for spot-checking

After the script runs:
- Schema validation: every JSON validates against the schema in §7.1
- A small `tests/test_extraction_smoke.py` hand-checks 3 drugs against expected values
- Human spot-check on ~5 drugs before commit

The script is committed alongside the data so re-runs are reproducible. If a future flowchart is added, the script handles it without code change (provided it follows the existing structural pattern).

## 8. PWA + offline

### 8.1 Manifest (`manifest.json`)

```json
{
  "name": "Dermatology Dosing",
  "short_name": "Dosing",
  "start_url": "/mahaclinic/",
  "scope": "/mahaclinic/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#3A4F2A",
  "background_color": "#faf5e9",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Icons: 192px and 512px PNGs generated once from a single Instrument Serif italic glyph (`D` or `Rx`) in moss on parchment. No logo design required; this is a typography-only mark.

`apple-touch-icon` link tag in `index.html` head pointing to a 180×180 PNG (iOS doesn't honor the manifest icons for Add-to-Home-Screen; needs the apple-touch-icon).

### 8.2 Service worker (`sw.js`)

Cache-first strategy for everything under `/mahaclinic/`. Network-first for nothing else (out of scope).

**Install event:** pre-cache the full asset list:

```
/mahaclinic/
/mahaclinic/index.html
/mahaclinic/drug.html
/mahaclinic/about.html
/mahaclinic/app.js
/mahaclinic/styles.css
/mahaclinic/manifest.json
/mahaclinic/icons/icon-192.png
/mahaclinic/icons/icon-512.png
/mahaclinic/icons/apple-touch-icon.png
/mahaclinic/data/_index.json
/mahaclinic/data/_config.json
/mahaclinic/data/dupixent-ad.json
... (one per slug, ~28 total)
/theme/static/css/book-tokens.css
(any web fonts that book-tokens.css references — see §11)
```

**Fetch event:** for any request whose URL starts with `/mahaclinic/`, respond from cache; if cache miss, fall through to network and add to cache. For any other request, do nothing (let the browser handle).

**Activate event:** purge old cache versions (compare `CACHE_NAME` constant against existing caches).

**Version bump:** the cache name embeds a version string read from `data/_config.json` `version` field. Bumping the version in `_config.json` triggers a fresh install on next visit. Build step ensures `sw.js` is regenerated with the new version on every commit (or just hard-code and update by hand for Phase 1).

### 8.3 iOS quirks

- `apple-mobile-web-app-capable` meta tag for full-screen on Add-to-Home-Screen
- `apple-mobile-web-app-status-bar-style` meta tag set to `black-translucent`
- `viewport-fit=cover` for notched iPads + iPhones
- `apple-touch-icon` link (iOS doesn't use the manifest icons)
- Service worker scope must match the start_url scope exactly; both `/mahaclinic/`
- iOS Safari supports `display: standalone` but requires Add-to-Home-Screen (no install prompt API)
- iOS clears service worker storage after a few weeks of non-use; the install hint mentions this isn't permanent storage but is best-effort

## 9. Safety nets

Five visible mechanisms absorb the extract-and-ship risk (Decision #10). Each is implementable in Phase 1 with no extra infra:

### 9.1 Page-level disclaimer

Every drug page has a moss-bordered callout immediately under the title block:

```
┌────────────────────────────────────────────────────────────────┐
│  Reference only.                                                │
│  Always verify against the current FDA prescribing label        │
│  before administering. This tool is auto-extracted from         │
│  team-authored flowcharts and has not been clinically reviewed. │
└────────────────────────────────────────────────────────────────┘
```

Visual treatment: 2px moss border, parchment fill, Newsreader italic for the headline, Newsreader regular for the body. Cannot be dismissed.

### 9.2 Per-dose-card "verify with label" stamp

Under every dose value, a tiny Mono small-caps line:

```
LOADING: 600 mg (2 × 300 mg)
MAINTENANCE: 300 mg every 2 weeks
    └── verify with current label
```

Same treatment per dose card. Repetition is intentional.

### 9.3 Review-state badge

Top-right corner of every drug page. Two states:

- **Amber** (default): `AUTO-EXTRACTED` — moss text on light amber fill (still on-palette: `#d4a747` works with moss)
- **Green** (after sign-off): `REVIEWED · 2026-05-22 · MM` — moss text on light moss fill

Sign-off is just editing the `reviewed` field in the JSON file. The UI reads the field on render. No backend, no audit log in Phase 1.

### 9.4 Source attribution

Tiny footer on every drug page:

```
Extracted from "Dupixent AD.html" on 2026-05-19. Verify with current FDA label.
```

Both the filename and the extraction date are read from the JSON's `source` block. This makes the data's provenance auditable at a glance.

### 9.5 Report-an-issue mailto

Every drug page has a `Report an issue` button at the bottom. Tapping it opens:

```
mailto:sohailmo.ai@gmail.com
?subject=[mahaclinic] dupixent-ad: <describe>
&body=URL: https://sohailmo.ai/mahaclinic/dupixent-ad/%0A%0AIssue: <describe what's wrong>
```

The email address is read from `_config.json` `maintainer_email` and can be changed later (e.g., to a shared inbox or a Google Form URL).

Any team member can flag an error in <30s. The Mono-styled button keeps it visible without being aggressive.

## 10. Privacy posture

- `<meta name="robots" content="noindex, nofollow">` on every page in `/mahaclinic/`
- `robots.txt` updated to add `Disallow: /mahaclinic/`
- `<meta name="referrer" content="no-referrer">` on every page (so accidental outbound clicks don't leak the URL via Referer)
- No links from anywhere on `sohailmo.ai` (verified by grep over `theme/` and `content/` for `mahaclinic` references)
- No sitemap entry (sitemap.xml regeneration excludes `/extra/mahaclinic/` by default since the directory isn't an article/page)
- The `_index.json` does NOT contain any PHI; it's drug names + indication names only
- Recents (`localStorage`) contain slugs (`dupixent-ad`) — no patient info, no timestamps in a way that could be cross-referenced

## 11. Design tokens & components

### 11.1 Tokens (reuse)

Import `theme/static/css/book-tokens.css` directly via `@import` at the top of `styles.css`. All token names usable as `var(--paper)`, `var(--ink)`, `var(--brown)`, `var(--font-display)`, `var(--font-body)`, `var(--font-mono)`, etc.

Fonts are loaded via Google Fonts `<link>` tags in mahaclinic's `index.html` and `drug.html` heads — copy the exact preconnect + stylesheet block already used in `theme/templates/base.html` and `theme/templates/book-part.html` (Instrument Serif + Newsreader + JetBrains Mono). The service worker caches the resulting CSS + woff2 files after first online visit, so subsequent loads (including offline) get the same fonts. No self-hosted font files needed in Phase 1.

### 11.2 Mahaclinic-specific component CSS (in `styles.css`)

All under `.maha-` namespace to prevent any collision with book/page styles (though there shouldn't be any, since templates aren't used).

| Class | Purpose |
|-------|---------|
| `.maha-search` | The home-screen search input |
| `.maha-pill` | Recent/most-used drug pills on home |
| `.maha-drug-row` | Search results list row |
| `.maha-trace-band` | Age band container (collapsed/active/dim states) |
| `.maha-trace-band--active` | Expanded state |
| `.maha-trace-band--dim` | Non-active sibling state |
| `.maha-weight-row` | Tappable weight option inside expanded band |
| `.maha-weight-row--selected` | Active weight after tap |
| `.maha-dose-card` | The big dose card displayed on weight selection |
| `.maha-disclaimer` | The moss-bordered callout |
| `.maha-badge` | Review-state badge (amber/green) |
| `.maha-badge--amber` / `.maha-badge--green` | Color variants |
| `.maha-source-attribution` | Tiny footer block |
| `.maha-report-issue` | Mailto button |
| `.maha-broadsheet-rule` | The 2px-moss / 0.5px-moss top ruled bar |
| `.maha-dingbat` | `❦ ❦ ❦` divider |

Component CSS targets ~250 lines total.

### 11.3 Responsive breakpoints

Same as the book: 960px (sidebar collapse N/A here, but spacing tightens), 700px, 600px. Mobile-first.

Touch targets enforced at min 44×44px on `iframe` and `button` elements.

## 12. Tech stack

- **HTML:** static, hand-authored
- **CSS:** vanilla, single file, no preprocessor, references `book-tokens.css`
- **JS:** vanilla ES2020+, no framework, no bundler, no transpiler. Module pattern: each function group lives in its own `<script type="module">` import within `app.js`, but everything compiles to a single file because the modules are inlined at author time (no build step). Browser support: iPad Safari 14+ (everything in scope ships).
- **Data:** static JSON files served via Pelican passthrough
- **Routing:** `history.pushState` for navigation; per-slug stub directories for direct-load
- **PWA:** standard Service Worker API + manifest.json
- **Build:** existing Pelican build; one-time stub generation script for per-drug directories
- **Deploy:** existing GitHub Actions workflow (`.github/workflows/pelican.yml`)

Total code surface: ~600 lines JS + ~250 lines CSS + 4 HTML files + 28 JSON data files.

## 13. Testing

### 13.1 JSON schema validation

`tests/test_mahaclinic_schemas.py`:

```python
import json
import pathlib
import jsonschema

SCHEMA = json.load(open("content/extra/mahaclinic/data/_schema.json"))

def test_all_drug_jsons_validate():
    for f in pathlib.Path("content/extra/mahaclinic/data/").glob("*.json"):
        if f.stem.startswith("_"):
            continue
        data = json.load(open(f))
        jsonschema.validate(data, SCHEMA)

def test_index_lists_match_actual_files():
    index = json.load(open("content/extra/mahaclinic/data/_index.json"))
    slugs_in_index = {entry["slug"] for entry in index}
    slugs_on_disk = {f.stem for f in pathlib.Path("content/extra/mahaclinic/data/").glob("*.json") if not f.stem.startswith("_")}
    assert slugs_in_index == slugs_on_disk
```

### 13.2 Extraction smoke test

`tests/test_mahaclinic_extraction.py`:

```python
def test_dupixent_ad_extraction():
    data = json.load(open("content/extra/mahaclinic/data/dupixent-ad.json"))
    assert data["drug"] == "Dupixent"
    assert data["indication"] == "Atopic Dermatitis"
    assert len(data["age_bands"]) == 3
    adults = next(b for b in data["age_bands"] if b["label_short"] == "Adults")
    assert adults["weights"][0]["loading"]["value"] == "600 mg"
    assert adults["weights"][0]["maintenance"]["value"] == "300 mg"
    assert adults["weights"][0]["maintenance"]["frequency"] == "every 2 weeks"

# Same pattern for 2 more drugs (Cosentyx HS, Humira HS)
```

These three smoke tests act as a regression net when the extraction script changes.

### 13.3 UI behavior (Playwright)

`tests/e2e/test_mahaclinic_ui.py`:

- Search filter responds to keystroke within 100ms
- Tapping a recent pill navigates to that drug
- On a drug page, tapping an age band expands it and dims others
- Tapping a weight surfaces the dose card with correct values
- Direct URL navigation to `/mahaclinic/dupixent-ad/` loads the right drug
- Service worker registration succeeds; offline reload still works (`page.context.set_offline(True)`)
- "Report an issue" button has correct mailto link with URL pre-filled
- `noindex` meta tag present on every page
- `apple-touch-icon` link present in head

Tests run in CI against `output/mahaclinic/` after Pelican build.

### 13.4 Acceptance (Lighthouse + manual)

- Lighthouse desktop: Performance ≥90, Accessibility ≥95, Best Practices ≥95 on home + a drug page
- Manual: load on iPad Safari, install to home screen, force-quit, airplane-mode reload, drug pages still load
- Manual: load on iPhone-SE-width viewport (375px) — no horizontal scroll

## 14. Acceptance criteria (Phase 1)

- `sohailmo.ai/mahaclinic/` resolves and renders the home screen
- All 28 drug-indication JSON files exist and pass schema validation
- All 28 drug detail pages render without console errors
- Search filters in <100ms after keystroke
- Trace-through interaction works on iPad Safari (touch events, no hover-dependence)
- PWA installs cleanly via "Add to Home Screen" on iPad Safari + iPhone Safari
- Service worker caches all drug data; airplane-mode reload still works after first online visit
- `noindex` + `robots.txt` block confirmed via `curl /robots.txt`
- No links to `/mahaclinic/` from anywhere else on `sohailmo.ai` (verified by grep)
- Lighthouse on home + a representative drug page: Performance ≥90, Accessibility ≥95, Best Practices ≥95
- Mobile responsive: works iPhone-SE-width (375px) without horizontal scroll
- All five safety nets visible on every drug page (disclaimer, per-dose stamps, review badge, source attribution, report-issue link)
- About page reachable from drug pages and home
- The print stylesheet produces usable output when Safari "Share → Print" is invoked (cleanly formatted, doesn't break)

## 15. File operations summary

```
NEW    history/2026-05-19-mahaclinic-dosing-design.md     (this file)
NEW    history/2026-05-19-mahaclinic-dosing-plan.md       (implementation plan — next step via writing-plans)

NEW    content/extra/mahaclinic/
NEW    content/extra/mahaclinic/index.html
NEW    content/extra/mahaclinic/drug.html
NEW    content/extra/mahaclinic/about.html
NEW    content/extra/mahaclinic/app.js
NEW    content/extra/mahaclinic/styles.css
NEW    content/extra/mahaclinic/sw.js
NEW    content/extra/mahaclinic/manifest.json
NEW    content/extra/mahaclinic/icons/icon-192.png
NEW    content/extra/mahaclinic/icons/icon-512.png
NEW    content/extra/mahaclinic/icons/apple-touch-icon.png
NEW    content/extra/mahaclinic/data/_schema.json
NEW    content/extra/mahaclinic/data/_index.json
NEW    content/extra/mahaclinic/data/_config.json
NEW    content/extra/mahaclinic/data/{slug}.json  × 28
NEW    content/extra/mahaclinic/{slug}/index.html × 28  (stubs that load drug.html via shared JS)

MODIFY pelicanconf.py                          (one-line addition to EXTRA_PATH_METADATA walker)
NEW    theme/static/robots.txt                 (no robots.txt exists today; create with Disallow: /mahaclinic/ and the standard host directive)

NEW    scripts/extract_mahaclinic_data.py      (one-pass extraction of HTML flowcharts to JSON)
NEW    scripts/build_mahaclinic_stubs.py       (generates per-drug index.html stubs from _index.json)
NEW    tests/test_mahaclinic_schemas.py
NEW    tests/test_mahaclinic_extraction.py
NEW    tests/e2e/test_mahaclinic_ui.py
```

## 16. Phase 2 backlog

Items deliberately deferred. Each is independently shippable on top of Phase 1.

| # | Item | Rough sizing | Dependencies |
|---|------|--------------|--------------|
| 1 | Device & supply detail section per drug | 1–2 days | Phase 1 data shape is extensible — just add fields |
| 2 | Insurance / prior auth notes section | 3–5 days | Requires Sohail's wife to author PA content per drug |
| 3 | Patient counseling section (storage, technique, side-effects to call about) | 3–5 days | Requires content authoring |
| 4 | Workflow checklist per drug (start-of-therapy, refill, follow-up) | 2–3 days | Requires content authoring |
| 5 | "By condition" browse view (AD/PsO/HS landing cards) | 1 day | Adds a route + a render path |
| 6 | Drug-comparison side-by-side | 2 days | Same data; new render path |
| 7 | Cross-device recents sync | 2–3 days | Requires backend (Cloudflare Worker + KV) |
| 8 | Per-MA review-signoff workflow with audit log | 3–5 days | Requires backend; multi-user model |
| 9 | Drug label version tracking | 3–5 days | New data field + UI |
| 10 | In-app issue reporter (replacing mailto) | 1–2 days | Backend or third-party form |

## 17. Risks & mitigations

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | Auto-extracted dose data contains a typo that causes a clinical error | Medium | High (patient harm; tool credibility destroyed) | (a) 5 visible safety nets per §9; (b) every dose card carries "verify with label" stamp; (c) prominent disclaimer; (d) report-an-issue path; (e) Sohail/wife review the 8 most-used drugs ASAP after launch (offered but Sohail chose extract-and-ship; this remains as a recommended action) |
| 2 | The 28 source HTMLs have structural inconsistencies that break the extractor | High | Medium (some drugs miss data) | Schema validation catches structural mismatches; extraction script logs per-drug summary; we run smoke tests on the 3 most complex drugs; failed extractions get manual cleanup before commit |
| 3 | Service worker stale-cache surfaces an outdated dose | Low | High | Cache name embeds version from `_config.json`; bumping version triggers fresh install; document the "bump on every dose-data update" rule in maintenance docs |
| 4 | iOS revokes service worker storage after extended non-use | Low | Low | First-visit hint about Add-to-Home-Screen + standalone install; standalone PWAs retain storage longer than tab-based PWAs; explicit re-cache on every online visit |
| 5 | Hidden route leaks via referer headers or someone shares URL publicly | Low | Low (content is non-PHI) | `<meta name="referrer" content="no-referrer">`; URL doesn't contain identifiers; data is FDA-label-equivalent |
| 6 | Pelican `EXTRA_PATH_METADATA` walker has performance issues with the extra ~60 files | Low | Low | Existing walker handles `book/` (similar file count) without issue; if slow, the build is offline; iterate |
| 7 | The "trace-through" UX is too clever and MAs find it confusing | Medium | Medium | First-time-user hint: on first drug-page visit, show a 2-second translucent "tap an age band" overlay; can be dismissed; stored in localStorage |
| 8 | New drug added later isn't covered by the extraction script | Medium | Low | The script handles the existing structural pattern; if a new flowchart deviates, the script fails loudly with a parse error; manual JSON authoring is always an escape hatch |
| 9 | Web fonts fail to load on first install (offline) | Low | Low | Service worker pre-caches font woff2 files on install; fallback font stack still produces readable result |
| 10 | iPad orientation/keyboard issues (e.g., on-screen keyboard hides results) | Medium | Low | `viewport-fit=cover` + responsive layout; manual test on real iPad before Phase 1 sign-off |

---

**Next step:** invoke `superpowers:writing-plans` to produce a detailed, TDD-oriented implementation plan from this spec.
