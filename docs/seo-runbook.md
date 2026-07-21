# SEO / AEO runbook

How this site stays discoverable in search engines and AI answer engines.
Written 2026-07-21, alongside the seo-aeo branch changes.

## One-time setup (manual, requires account access)

1. Google Search Console: add a **Domain property** for `sohailmo.ai`.
   Verification needs a DNS TXT record at the domain registrar. A domain
   property covers http, https, and www at once.
2. Submit the sitemap: `https://sohailmo.ai/sitemap.xml`.
3. Remove stale results. The old portfolio site's `/blog` and `/resume.pdf`
   are still in Google's index. Use Indexing → Removals → New request for
   each. They 404 today, so after the ~6-month removal window they age out
   for good. Check `site:sohailmo.ai` for other stale paths.
4. Request indexing (URL Inspection → Request indexing) for the flagship
   pages: `/`, `/writings/`, `/book/`, `/book/calculator/`, `/research/`,
   `/inference-field-guide/`, `/goodput/`, `/denominator-problem/`,
   `/workload-costs/`, `/trace-autopsy/`.
5. Bing Webmaster Tools: use "Import from Google Search Console". One click.
   Bing feeds Copilot and some ChatGPT retrieval paths.
6. Optional: IndexNow. Generate a key at indexnow.org, commit the key file
   as `content/extra/<key>.txt` with an `EXTRA_PATH_METADATA` entry mapping
   it to root, and ping after deploys. No verified evidence this matters for
   a small site; skip unless bored.
7. Optional: set `CLOUDFLARE_ANALYTICS_TOKEN` in `pelicanconf.py`. The
   beacon snippet is already wired in `base.html`. Without some analytics
   none of this work is measurable.

## Two weeks after setup

Check GSC → Indexing → Pages: `/book/*` and `/research/*` URLs should move
to Indexed, and the stale `/blog` entry should be gone.

## Conventions that keep the machinery working

- **`Modified:` front matter.** Any substantive edit to an article adds or
  updates `Modified: YYYY-MM-DD`. It feeds `dateModified` in JSON-LD, the
  visible "Updated" date, and sitemap `lastmod`. Git dates are useless here:
  CI does a shallow checkout.
- **`Summary:` front matter.** Every article and page has one. It becomes
  the meta description untruncated, so keep it under ~250 characters, start
  with a capital letter, and put the concrete claim in it.
- **`Image:` front matter (optional).** `Image: /images/foo.png` gives an
  article its own social card image and upgrades the Twitter card to
  `summary_large_image`. Without it, pages use the avatar and a small card.
- **TL;DR blocks.** The seven inference-economics essays open with
  `<div class="tldr" markdown="1">`. The block answers the essay's core
  question in 2-4 sentences with its key numbers. AI engines extract chunks;
  the answer has to be at the top. New flagship essays should follow suit.
- **New book or research pages.** Any `index.html` added under
  `content/extra/book/` or `content/extra/research/` joins the sitemap
  automatically (`EXTRA_SITEMAP_URLS` in `pelicanconf.py`). It does NOT get
  head tags automatically: copy the description/canonical/OG pattern from an
  existing page (see `scripts/add_static_heads.py` for the shape).
- **robots.txt policy.** All crawlers allowed, including AI training bots.
  Deliberate decision (2026-07-21): visibility in AI answers is the goal.
  OpenAI and Anthropic use separate user-agents for training (GPTBot,
  ClaudeBot) versus search/user-fetch (OAI-SearchBot, ChatGPT-User,
  Claude-SearchBot, Claude-User); blocking training bots would not cost
  search visibility, but we currently block nothing.
- **Tests.** `pytest tests/test_seo.py` builds the site and checks sitemap
  coverage, JSON-LD validity, description cleanliness, and head tags on the
  static trees. CI-independent; run before pushing.

## What we deliberately do not do

- **FAQ schema or FAQ rewrites.** Benchmarked as useless to harmful
  (Princeton GEO, KDD 2024; C-SEO Bench, NeurIPS D&B 2025).
- **Keyword optimization.** Scored below the unoptimized baseline in the
  same benchmarks.
- **Heavy llms.txt investment.** Ahrefs found 97% of llms.txt files get
  zero bot requests. Ours exists and is cheap to maintain; that is the
  right level of investment.
- **Git-derived dateModified.** Wrong under shallow CI checkout.
- **Minification pipeline.** Marginal bytes; adds fragility to a reusable
  workflow we don't control.

## The lever this repo cannot pull

Across 149,912 production AI citations measured by Ranqo (2026), only 2.9%
pointed at the tracked entity's own domain; 75% went to third-party pages.
On-page work raises the ceiling; earned media raises the floor. Pitch the
flagship essays (field guide, goodput, denominator problem) to HN,
newsletters, and podcasts; keep publishing code and talks that other people
link to.
