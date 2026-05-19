# v2 Cutover Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote v2 to canonical. The new design replaces the old at the existing live URLs (`/`, `/writings/`, `/<slug>/`, `/pages/<slug>/`). The v2 scaffolding (`/v2*` routes, `v2_*.html` templates, `v2_router` plugin) is retired. Inbound links to existing essays continue to resolve. Old `style.css` deleted.

**Architecture:** Take each `v2_<name>.html` body and copy it into the live `<name>.html` template, but update internal links to point to canonical URLs (`/` instead of `/v2home/`, `/writings/` instead of `/v2writings/`, `/<slug>/` instead of `/v2/<slug>/`, `/pages/<slug>/` instead of `/v2/pages/<slug>/`). Then delete the v2 templates, the plugin, and the v2 entries in `pelicanconf.py`.

**Branch:** `wip/v2-cutover` off master. Three phases as three commits, then merge `--no-ff`.

---

## Decisions

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | URL preservation | Existing live URLs unchanged (`/`, `/<slug>/`, etc.) | All inbound links (Substack, search, friend bookmarks) keep working. |
| 2 | `/v2*` URLs after cutover | **Deleted.** Visitors get 404. | These were preview URLs explicitly shared with testers; not for public bookmarking. |
| 3 | `lightbox.js` | **Keep**, but update selector from `.page-content img` to `.article-prose img` | Image-heavy essays still want click-to-zoom. Cheap fix. |
| 4 | `sections.js` | **Drop** | The hierarchical heading-wrapper was an old-design device. v2 uses typographic hierarchy (font/size/color) instead. |
| 5 | `style.css` | **Deleted** at end of Phase 3 | No template references it after Phase 1; safe to remove. |
| 6 | `book-tokens.css` / `book.css` | **Unchanged** | Book at `/book/*` continues to render exactly as today. Tokens are shared. |
| 7 | Strategy | Three discrete commits on `wip/v2-cutover`, merge with `--no-ff` to master | Each commit independently revertable. Matches the existing branch+merge pattern. |
| 8 | "Back" link target on article/page templates | `/` (home) | Same as v2 currently does (was pointing at `/v2home/`). |

---

## Open questions (answer before executing)

| # | Question | Default I'll use if you say "go" |
|---|---|---|
| Q1 | Lightbox: confirm "keep + update selector" — OK? | Keep + update selector |
| Q2 | `sections.js`: confirm "drop" — OK? | Drop |
| Q3 | `/v2*` URLs: confirm "delete, 404 is fine" — OK? | Delete, 404 fine |
| Q4 | Should I push each phase commit immediately, or batch all three then push once at the end? | Push at end (one GH Actions build) |

---

## File map

| File | Phase | Operation |
|---|---|---|
| `theme/templates/base.html` | 1 | **Replace contents** with base-v2.html body, nav links rewritten to canonical URLs, drop `sections.js`, keep `lightbox.js`. |
| `theme/templates/index.html` | 1 | **Replace contents** with v2_index.html body, links rewritten. |
| `theme/templates/archives.html` | 1 | **Replace contents** with v2_archives.html body, links rewritten. |
| `theme/templates/article.html` | 1 | **Replace contents** with v2_article.html body, Back link → `/`. |
| `theme/templates/longform_article.html` | 1 | **Replace contents** with v2_longform_article.html body, Back link → `/`. |
| `theme/templates/page.html` | 1 | **Replace contents** with v2_page.html body, Back link → `/`. |
| `theme/templates/inference-economics.html` | 1 | **Replace contents** with v2_inference_economics.html body, Back link → `/`. |
| `theme/templates/theforge.html` | 1 | **Replace contents** with v2_theforge.html body, links rewritten. |
| `theme/templates/videos.html` | 1 | **Replace contents** with v2_page.html body (videos.md uses Template: videos but the page renders identically to a generic page). |
| `theme/static/js/lightbox.js` | 1 | **Modify** selector from `.page-content img` to `.article-prose img`. |
| `theme/static/js/sections.js` | 3 | **Delete**. |
| `theme/templates/base-v2.html` | 2 | **Delete**. |
| `theme/templates/v2_*.html` (7 files) | 2 | **Delete**. |
| `plugins/v2_router.py` | 2 | **Delete**. |
| `plugins/` directory | 2 | **Delete** if empty after v2_router removal. |
| `pelicanconf.py` | 2 | Remove `v2_*` entries from `DIRECT_TEMPLATES`, all `V2_*_SAVE_AS/URL` lines, `PLUGIN_PATHS`, `PLUGINS`. |
| `theme/static/css/style.css` | 3 | **Delete**. |
| `theme/static/css/style.css.backup` | 3 | **Delete**. |
| `history/2026-05-19-site-design-rollout-plan.md` | 3 | Append "v2 Cutover Shipped" addendum referencing the merge commit. |

---

## Pre-flight

- [ ] **Step 1: Confirm clean master**

```bash
git checkout master
git pull origin master
git status
```
Expected: working tree clean.

- [ ] **Step 2: Create cutover branch**

```bash
git checkout -b wip/v2-cutover
```

- [ ] **Step 3: Baseline build to confirm clean starting point**

```bash
pelican content -s pelicanconf.py
```
Expected: "Done: Processed 46 articles, 0 drafts, 0 hidden articles, 4 pages…" with no errors.

---

## Phase 1 — Cutover: v2 templates replace live templates

### Task 1.1 — Replace `theme/templates/base.html`

- [ ] **Step 1: Verification before**

```bash
grep -q "v2home" theme/templates/base.html && echo "FAIL (v2home found in canonical base)" || echo "PASS"
```
Expected: `PASS`.

- [ ] **Step 2: Overwrite `theme/templates/base.html`** with this content (note: nav links point to canonical URLs, `lightbox.js` is kept, `sections.js` is removed):

```html
<!DOCTYPE html>
<html lang="en">
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
<body{% block body_class %}{% endblock %}>
<div id="reading-progress"></div>

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
      {% if name == 'email' %}
      <a href="{{ url }}" title="Email" aria-label="Email"><svg viewBox="0 0 24 24"><path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z"/></svg></a>
      {% elif name == 'github' %}
      <a href="{{ url }}" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub"><svg viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.44 24 17.12 24 12.02 24 5.74 18.27.5 12 .5z"/></svg></a>
      {% elif name == 'twitter' %}
      <a href="{{ url }}" target="_blank" rel="noopener" title="X (Twitter)" aria-label="X (Twitter)"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
      {% elif name == 'linkedin' %}
      <a href="{{ url }}" target="_blank" rel="noopener" title="LinkedIn" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
      {% endif %}
      {% endfor %}
    </div>
  </div>
</header>

<main class="site-main" id="main-content">
  {% block content %}{% endblock %}
  <footer class="site-colophon">
    <span>SOHAILMO · MMXXVI</span>
    <span>Set in Instrument Serif · Newsreader · JetBrains Mono</span>
  </footer>
</main>

<script src="{{ SITEURL }}/theme/js/lightbox.js"></script>
<script>
  window.addEventListener('scroll', function() {
    var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = (winScroll / height) * 100;
    var bar = document.getElementById("reading-progress");
    if (bar) bar.style.width = scrolled + "%";
  });
</script>
{% if CLOUDFLARE_ANALYTICS_TOKEN %}
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "{{ CLOUDFLARE_ANALYTICS_TOKEN }}"}'></script>
{% endif %}
</body>
</html>
```

- [ ] **Step 3: Verification after**

```bash
grep -q "site.css" theme/templates/base.html && \
  grep -q '"{{ SITEURL }}/"' theme/templates/base.html && \
  ! grep -q 'v2home' theme/templates/base.html && \
  ! grep -q 'sections.js' theme/templates/base.html && \
  grep -q 'lightbox.js' theme/templates/base.html && \
  echo PASS || echo FAIL
```
Expected: `PASS`.

### Task 1.2 — Replace `theme/templates/index.html`

- [ ] **Overwrite contents** with this (note: article links go to `/<slug>/`, "see all" links go to `/writings/` and `/pages/research/`):

```html
{% extends "base.html" %}

{% block nav_home %} class="active" aria-current="page"{% endblock %}
{% block body_class %} class="home-page"{% endblock %}

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
<div class="section-rule"><span>Featured</span></div>
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

- [ ] **Verification:**

```bash
grep -q 'class="hero-name">Sohail Mohammad' theme/templates/index.html && \
  ! grep -q 'v2/' theme/templates/index.html && \
  ! grep -q 'v2home' theme/templates/index.html && echo PASS || echo FAIL
```

### Task 1.3 — Replace `theme/templates/archives.html`

- [ ] **Overwrite contents:**

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

### Task 1.4 — Replace `theme/templates/article.html`

- [ ] **Overwrite contents:**

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

### Task 1.5 — Replace `theme/templates/longform_article.html`

- [ ] **Overwrite contents:**

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

### Task 1.6 — Replace `theme/templates/page.html`

- [ ] **Overwrite contents:**

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

### Task 1.7 — Replace `theme/templates/inference-economics.html`

- [ ] **Overwrite contents:**

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

### Task 1.8 — Replace `theme/templates/theforge.html`

- [ ] **Overwrite contents:**

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
<p class="series-intro">
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
  <form class="subscribe-form" action="https://buttondown.email/api/emails/embed-subscribe/sohailmo" method="post" target="popupwindow" onsubmit="window.open('https://buttondown.email/sohailmo', 'popupwindow', 'scrollbars=yes,width=800,height=600');return true;">
    <input type="email" name="email" placeholder="you@example.com" required aria-label="Email address">
    <input type="hidden" name="tag" value="the-forge">
    <button type="submit" class="site-btn">Subscribe</button>
  </form>
</div>
{% endblock %}
```

### Task 1.9 — Replace `theme/templates/videos.html`

- [ ] **Overwrite contents** (same as page.html — videos.md uses Template: videos but renders generically):

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

### Task 1.10 — Update `theme/static/js/lightbox.js` selector

- [ ] **Edit** the line `const contentImages = document.querySelectorAll('.page-content img');` to:

```javascript
const contentImages = document.querySelectorAll('.article-prose img');
```

- [ ] **Verification:**

```bash
grep -q "article-prose img" theme/static/js/lightbox.js && \
  ! grep -q "page-content img" theme/static/js/lightbox.js && echo PASS || echo FAIL
```

### Task 1.11 — Build + smoke test all canonical URLs

- [ ] **Run:**

```bash
pelican content -s pelicanconf.py
python3 -m http.server 8765 --directory output > /tmp/cutover-server.log 2>&1 &
echo $! > /tmp/cutover-server.pid
sleep 1
python3 - <<'PY'
import urllib.request
paths = [
    "/", "/writings/",
    "/managing-agents-complexity/", "/goodput/", "/denominator-problem/",
    "/inference-field-guide/", "/lcpr-calculator-v2/",
    "/pages/about/", "/pages/research/", "/pages/inference-economics/", "/pages/videos/",
    "/book/", "/book/opener/",
]
for p in paths:
    try:
        r = urllib.request.urlopen(f"http://localhost:8765{p}", timeout=3)
        print(f"{r.status:>3}  {p}")
    except Exception as e:
        print(f"ERR  {p}  {e}")
PY
```
Expected: every path returns `200`. `/book/` and `/book/opener/` must still render — they use their own CSS via the EXTRA_PATH_METADATA mechanism and should be unaffected.

- [ ] **Visual confirm in browser** at `/`, `/writings/`, `/managing-agents-complexity/`, `/goodput/`, `/pages/about/`. Resize to mobile width — header should stack vertically as it does on `/v2home/` today.

```bash
open http://localhost:8765/
open http://localhost:8765/writings/
open http://localhost:8765/managing-agents-complexity/
open http://localhost:8765/goodput/
```

- [ ] **Commit Phase 1:**

```bash
git add theme/templates/base.html theme/templates/index.html theme/templates/archives.html \
        theme/templates/article.html theme/templates/longform_article.html \
        theme/templates/page.html theme/templates/inference-economics.html \
        theme/templates/theforge.html theme/templates/videos.html \
        theme/static/js/lightbox.js
git commit -m "feat(cutover): promote v2 design to canonical templates

The live templates (base, index, archives, article, longform_article,
page, inference-economics, theforge, videos) now render the v2 design
at their existing canonical URLs. Internal links rewritten to use
canonical paths (/ , /writings/, /<slug>/, /pages/<slug>/) instead
of /v2* preview routes. lightbox.js selector updated from .page-content
img to .article-prose img to match the new prose container class."
```

---

## Phase 2 — Remove v2 scaffolding

### Task 2.1 — Delete v2 templates and the plugin

- [ ] **Run:**

```bash
git rm theme/templates/base-v2.html \
       theme/templates/v2_index.html \
       theme/templates/v2_archives.html \
       theme/templates/v2_article.html \
       theme/templates/v2_longform_article.html \
       theme/templates/v2_page.html \
       theme/templates/v2_inference_economics.html \
       theme/templates/v2_theforge.html \
       plugins/v2_router.py
rmdir plugins 2>/dev/null || true
```

### Task 2.2 — Strip v2 entries from `pelicanconf.py`

- [ ] **Edit `pelicanconf.py`** to remove the v2 routing block. Replace this section:

```python
DIRECT_TEMPLATES = ("index", "archives", "v2_index", "v2_archives", "v2_theforge")
ARCHIVES_SAVE_AS = "writings/index.html"

# v2 parallel deployment — same article/page data, rendered through v2_*.html templates
# at /v2home/, /v2writings/, /v2theforge/, plus per-article /v2/<slug>/ via the
# v2_router plugin. Old site remains unchanged.
V2_INDEX_SAVE_AS = "v2home/index.html"
V2_INDEX_URL = "v2home/"
V2_ARCHIVES_SAVE_AS = "v2writings/index.html"
V2_ARCHIVES_URL = "v2writings/"
V2_THEFORGE_SAVE_AS = "v2theforge/index.html"
V2_THEFORGE_URL = "v2theforge/"

PLUGIN_PATHS = ["plugins"]
PLUGINS = ["v2_router"]
```

…with:

```python
DIRECT_TEMPLATES = ("index", "archives")
ARCHIVES_SAVE_AS = "writings/index.html"
```

- [ ] **Verification:**

```bash
! grep -q "v2_" pelicanconf.py && \
  ! grep -q "PLUGIN" pelicanconf.py && \
  ! grep -qE "V2_" pelicanconf.py && echo PASS || echo FAIL
```
Expected: `PASS`.

### Task 2.3 — Build + verify `/v2*` URLs are gone

- [ ] **Run:**

```bash
rm -rf output
pelican content -s pelicanconf.py
test ! -e output/v2home && \
  test ! -e output/v2writings && \
  test ! -e output/v2theforge && \
  test ! -e output/v2 && echo "PASS: no v2 routes" || echo "FAIL: v2 routes still present"
```
Expected: `PASS: no v2 routes`.

Also confirm canonical routes intact:

```bash
test -e output/index.html && \
  test -e output/writings/index.html && \
  test -e output/managing-agents-complexity/index.html && \
  test -e output/goodput/index.html && \
  test -e output/pages/about/index.html && echo "PASS: canonical routes intact" || echo FAIL
```

- [ ] **Commit Phase 2:**

```bash
git add pelicanconf.py
git commit -m "chore(cutover): retire v2 scaffolding (templates + plugin + config)

The v2 design is now the canonical design served at root URLs.
Delete the base-v2.html, v2_*.html templates, the v2_router Pelican
plugin, and the V2_*_SAVE_AS/URL + PLUGIN_PATHS/PLUGINS entries in
pelicanconf.py. /v2home/, /v2writings/, /v2theforge/, /v2/<slug>/
and /v2/pages/<slug>/ no longer exist."
```

---

## Phase 3 — Cleanup

### Task 3.1 — Delete the old `style.css`

- [ ] **Verify no template references it:**

```bash
grep -rn "style\.css" theme/templates/ && echo "FAIL: still referenced" || echo PASS
```
Expected: `PASS` (no matches).

- [ ] **Delete:**

```bash
git rm theme/static/css/style.css theme/static/css/style.css.backup
```

### Task 3.2 — Delete `sections.js`

- [ ] **Verify no template references it:**

```bash
grep -rn "sections\.js" theme/templates/ && echo "FAIL: still referenced" || echo PASS
```

- [ ] **Delete:**

```bash
git rm theme/static/js/sections.js
```

### Task 3.3 — Final smoke test

- [ ] **Build + crawl:**

```bash
rm -rf output
pelican content -s pelicanconf.py
python3 -m http.server 8765 --directory output > /tmp/cutover-server.log 2>&1 &
echo $! > /tmp/cutover-server.pid
sleep 1
python3 - <<'PY'
import urllib.request
paths = [
    "/", "/writings/",
    "/managing-agents-complexity/", "/goodput/", "/denominator-problem/",
    "/inference-field-guide/", "/lcpr-calculator-v2/", "/workload-costs/",
    "/trace-autopsy/", "/ray-production-lessons/", "/rag-infrastructure-pgvector/",
    "/pages/about/", "/pages/research/", "/pages/inference-economics/", "/pages/videos/",
    "/book/", "/book/opener/", "/book/part-1/", "/book/calculator/",
    "/v2home/", "/v2writings/", "/v2theforge/",  # MUST 404
    "/v2/goodput/", "/v2/pages/about/",  # MUST 404
]
expected_404 = {p for p in paths if p.startswith("/v2")}
for p in paths:
    try:
        r = urllib.request.urlopen(f"http://localhost:8765{p}", timeout=3)
        status = r.status
        flag = "OK " if (p not in expected_404 and status == 200) else "FAIL"
        print(f"{flag} {status:>3}  {p}")
    except urllib.error.HTTPError as e:
        flag = "OK " if (p in expected_404 and e.code == 404) else "FAIL"
        print(f"{flag} {e.code:>3}  {p}")
    except Exception as e:
        print(f"ERR  {p}  {e}")
PY
kill $(cat /tmp/cutover-server.pid)
```
Expected: every canonical URL `OK 200`, every `/v2*` URL `OK 404`.

### Task 3.4 — Append cutover addendum to design rollout plan doc

- [ ] **Edit `history/2026-05-19-site-design-rollout-plan.md`** — append at bottom:

```markdown
---

# v2 Cutover — Shipped 2026-05-XX

The v2 parallel deployment described above was promoted to canonical on
2026-05-XX (commit <merge-hash>). Old templates and `style.css` retired.
v2-prefixed URLs (`/v2home/`, `/v2writings/`, `/v2theforge/`,
`/v2/<slug>/`, `/v2/pages/<slug>/`) now return 404 — they were preview
URLs and no longer needed once the design landed at root.

Verification snapshot at cutover:
- 46 articles + 4 pages rendering via v2 templates at canonical URLs.
- `theme/static/css/style.css` deleted (was 1674 lines, 91 !important).
- `theme/static/js/sections.js` deleted.
- `theme/static/js/lightbox.js` updated for new `.article-prose` selector.
- `book-tokens.css` + `book.css` unchanged; book at `/book/*` renders
  unaffected.
```

### Task 3.5 — Commit Phase 3 + merge to master

- [ ] **Commit:**

```bash
git add history/2026-05-19-site-design-rollout-plan.md
git commit -m "chore(cutover): retire style.css + sections.js; document cutover

Final cleanup. style.css (1674 lines, 91 !important rules) and
sections.js (heading-section wrapper) are no longer referenced by
any template — delete. Append cutover record to the design rollout
plan doc."
```

- [ ] **Push + merge to master:**

```bash
git push -u origin wip/v2-cutover
git checkout master
git merge --no-ff wip/v2-cutover -m "Merge wip/v2-cutover into master

Promote v2 design to canonical. Old templates replaced in place at
existing URLs; v2 scaffolding (templates, plugin, /v2* routes) removed;
style.css and sections.js retired."
git push origin master
```

GitHub Actions deploys (~1 min). Smoke `sohailmo.ai/` once live.

---

## Acceptance criteria

| # | Criterion | Verification |
|---|---|---|
| A1 | `sohailmo.ai/` renders the v2 hero + ruled-list sections | Visual + `curl -s sohailmo.ai/ \| grep -q 'Sohail Mohammad'` |
| A2 | `sohailmo.ai/writings/` renders the v2 ruled list | Visual |
| A3 | Every existing essay URL still 200s | The smoke crawl in Task 3.3 |
| A4 | `/v2home/`, `/v2writings/`, `/v2theforge/`, `/v2/<slug>/`, `/v2/pages/<slug>/` all 404 | The smoke crawl |
| A5 | `/book/` and `/book/opener/` unaffected | Visual |
| A6 | `theme/static/css/style.css` does not exist | `! test -f theme/static/css/style.css` |
| A7 | `theme/static/js/sections.js` does not exist | `! test -f theme/static/js/sections.js` |
| A8 | Mobile header stacks vertically at iPhone width | Visual at 375px |
| A9 | Lightbox triggers on essay images | Click an image inside a Case Study with images |
| A10 | No `font-family: 'Inter'` references in `theme/static/css/` | `! grep -rE "font-family:\s*['\"]Inter['\"]" theme/static/css/` |

---

## Risks

| Risk | Mitigation |
|---|---|
| Existing essay with embedded `<style>` block conflicts with v2 prose styles | Audit before Task 1.4; if found, scope embedded style or rewrite. None found at audit time. |
| A `Template: longform_article` essay's `article.toc` is empty → empty sidebar | The v2 long-form template guards with `{% if article.toc %}`; renders empty sidebar gracefully. |
| Lightbox fails silently if image markup is wrapped in additional elements | Sanity-check one image-heavy essay during Task 1.11. |
| GH Pages cache lag — visitors see old design briefly | Hard-refresh + give CDN ~5 min after deploy. |
| Reverting the cutover later | `git revert -m 1 <merge-hash>` restores everything; `wip/v2-cutover` remains as a record. |
| `/v2*` bookmarks shared with friends now 404 | Expected. Send them new canonical URLs. If complaints, add `<meta http-equiv="refresh">` stubs in a follow-up. |

---

## Rollback

If the deploy looks wrong on production:

```bash
git revert -m 1 <merge-commit-hash>
git push origin master
```
This restores the parallel state — old site at `/`, v2 at `/v2*` — within one GH Actions cycle.
