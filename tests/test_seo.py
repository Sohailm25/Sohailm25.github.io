# ABOUTME: SEO/AEO regression tests over a real publish build.
# ABOUTME: Builds the site once per session, then checks sitemap coverage,
# ABOUTME: discovery surfaces, and head metadata invariants.

import json
import re
import subprocess
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parent.parent
SITE = "https://sohailmo.ai"


@pytest.fixture(scope="session")
def output(tmp_path_factory):
    """Publish build in a temp dir, exactly as CI builds it."""
    out = tmp_path_factory.mktemp("seo-output")
    subprocess.run(
        ["pelican", "content", "-s", "publishconf.py", "-o", str(out)],
        cwd=REPO,
        check=True,
        capture_output=True,
    )
    return out


@pytest.fixture(scope="session")
def sitemap_urls(output):
    sitemap = (output / "sitemap.xml").read_text()
    return re.findall(r"<loc>(.*?)</loc>", sitemap)


def test_sitemap_urls_exist_on_disk(output, sitemap_urls):
    """Every sitemap URL must correspond to a built file."""
    missing = []
    for url in sitemap_urls:
        path = url.removeprefix(SITE + "/")
        target = output / path / "index.html" if path else output / "index.html"
        if not target.exists():
            missing.append(url)
    assert not missing, f"sitemap URLs with no built page: {missing}"


def test_sitemap_covers_flagship_pages(sitemap_urls):
    required = [
        f"{SITE}/",
        f"{SITE}/writings/",
        f"{SITE}/the-forge/",
        f"{SITE}/research/",
        f"{SITE}/book/",
        f"{SITE}/book/calculator/",
        f"{SITE}/research/activation-steering/",
        f"{SITE}/research/escape-velocity/",
        f"{SITE}/research/ftle/",
        f"{SITE}/research/latent-depth-routing/",
        f"{SITE}/research/prediction-market-trader/",
        f"{SITE}/research/rlhf-entropy/",
    ]
    missing = [u for u in required if u not in sitemap_urls]
    assert not missing, f"missing from sitemap: {missing}"


def test_sitemap_excludes_noncanonical(sitemap_urls):
    banned = ("paper-a-escape-velocity", "paper-b-ftle", "mahaclinic", "/extra/")
    bad = [u for u in sitemap_urls if any(b in u for b in banned)]
    assert not bad, f"non-canonical URLs in sitemap: {bad}"


def test_no_pagination_duplicates(output):
    dupes = list(output.glob("index[0-9]*.html"))
    assert not dupes, f"paginated homepage duplicates built: {dupes}"


def test_404_page(output):
    html = (output / "404.html").read_text()
    assert '<meta name="robots" content="noindex">' in html
    assert "/writings/" in html


def test_the_forge_index(output):
    html = (output / "the-forge" / "index.html").read_text()
    assert f'<link rel="canonical" href="{SITE}/the-forge/">' in html
    assert html.count("ruled-row") >= 8


def test_research_landing_moved(output):
    landing = (output / "research" / "index.html").read_text()
    assert f'<link rel="canonical" href="{SITE}/research/">' in landing
    stub = (output / "pages" / "research" / "index.html").read_text()
    assert f"url={SITE}/research/" in stub
    assert 'content="noindex"' in stub


def test_legacy_paper_paths_are_noindex_stubs(output):
    for legacy, target in [
        ("paper-a-escape-velocity", "escape-velocity"),
        ("paper-b-ftle", "ftle"),
    ]:
        html = (output / "research" / legacy / "index.html").read_text()
        assert 'content="noindex"' in html, legacy
        assert f"{SITE}/research/{target}/" in html, legacy


def test_robots_txt(output):
    robots = (output / "robots.txt").read_text()
    assert "Disallow: /mahaclinic/" in robots
    assert "Disallow: /extra/" in robots
    assert f"Sitemap: {SITE}/sitemap.xml" in robots
    # Deliberate allow-all policy: no bot-specific blocking rules.
    assert robots.count("User-agent:") == 1


def test_llms_txt_covers_book_and_research(output):
    llms = (output / "llms.txt").read_text()
    for path in ("/book/", "/book/calculator/", "/research/ftle/", "/the-forge/"):
        assert f"{SITE}{path}" in llms, path
    assert "streamlit.app" not in llms


def _pelican_pages(output):
    """All Pelican-rendered pages (skip the raw static trees)."""
    static_roots = {"book", "extra", "mahaclinic", "maha", "together", "theme", "images", "papers"}
    for f in sorted(output.rglob("index.html")):
        rel = f.relative_to(output)
        top = rel.parts[0] if len(rel.parts) > 1 else ""
        if top in static_roots:
            continue
        # research/<paper>/ dirs are static distill pages; research/index.html
        # and research/experiments|failures/... are Pelican-rendered.
        if (
            top == "research"
            and len(rel.parts) == 3
            and rel.parts[1] not in ("experiments", "failures")
        ):
            continue
        yield f
    yield output / "index.html"
    yield output / "404.html"


def test_jsonld_parses_everywhere(output):
    bad = []
    for f in _pelican_pages(output):
        html = f.read_text()
        for block in re.findall(
            r'<script type="application/ld\+json">(.*?)</script>', html, re.S
        ):
            try:
                json.loads(block)
            except json.JSONDecodeError as e:
                bad.append((str(f.relative_to(output)), str(e)))
    assert not bad, f"invalid JSON-LD: {bad}"


def test_article_structured_data(output):
    """Article pages carry Person + WebSite + TechArticle/BlogPosting JSON-LD."""
    for slug in ("goodput", "inference-field-guide", "the-forge-issue-1", "for-its-own-sake"):
        f = next((output / "writings").glob(f"{slug}/index.html"), None) or output / slug / "index.html"
        if slug == "for-its-own-sake":
            f = output / "writings" / "for-its-own-sake" / "index.html"
        html = f.read_text()
        blocks = [
            json.loads(b)
            for b in re.findall(
                r'<script type="application/ld\+json">(.*?)</script>', html, re.S
            )
        ]
        types = {b["@type"] for b in blocks}
        assert "Person" in types, (slug, types)
        assert "WebSite" in types, (slug, types)
        article = next(b for b in blocks if b["@type"] in ("TechArticle", "BlogPosting"))
        assert article["datePublished"], slug
        assert article["dateModified"], slug
        assert article["image"].startswith("https://"), slug
        assert article["mainEntityOfPage"]["@id"].startswith(SITE), slug
    # Poems are BlogPosting, technical categories are TechArticle.
    poem = (output / "writings" / "for-its-own-sake" / "index.html").read_text()
    assert '"@type": "BlogPosting"' in poem
    tech = (output / "goodput" / "index.html").read_text()
    assert '"@type": "TechArticle"' in tech


def test_visible_machine_readable_timestamps(output):
    html = (output / "goodput" / "index.html").read_text()
    assert re.search(r'<time datetime="20\d\d-\d\d-\d\d[^"]*">', html)
    assert '<meta property="article:published_time"' in html


def test_meta_descriptions_clean(output):
    """No truncation ellipses, TOC pilcrows, or double-escaped entities."""
    bad = []
    for f in _pelican_pages(output):
        html = f.read_text()
        if 'http-equiv="refresh"' in html:
            continue
        m = re.search(r'<meta name="description" content="(.*?)"', html)
        if not m:
            bad.append((str(f.relative_to(output)), "missing description"))
            continue
        desc = m.group(1)
        for artifact in ("...", "…", "¶", "&amp;amp;"):
            if artifact in desc:
                bad.append((str(f.relative_to(output)), f"{artifact!r} in description"))
    assert not bad, f"dirty descriptions: {bad}"


def test_favicons_at_root(output):
    for name in ("favicon.ico", "favicon-32.png", "apple-touch-icon.png", "icon-192.png"):
        assert (output / name).exists(), name
    home = (output / "index.html").read_text()
    assert 'rel="icon"' in home
    assert 'rel="apple-touch-icon"' in home


def test_social_meta(output):
    home = (output / "index.html").read_text()
    assert '<meta property="og:site_name"' in home
    assert '<meta name="twitter:site" content="@Sohailm25">' in home
    assert '<meta property="og:locale" content="en_US">' in home


def test_single_canonical_everywhere(output):
    bad = []
    for f in _pelican_pages(output):
        n = f.read_text().count('rel="canonical"')
        if n != 1:
            bad.append((str(f.relative_to(output)), n))
    assert not bad, f"pages without exactly one canonical: {bad}"
