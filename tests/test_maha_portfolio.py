"""ABOUTME: Verifies the /maha/ portfolio pages build and meet acceptance criteria.
ABOUTME: Companion to test_mahaclinic_build.py; has its own session-scoped Pelican-build fixture."""

import pathlib
import re
import subprocess
import pytest

REPO = pathlib.Path(__file__).parent.parent
OUTPUT = REPO / "output"
SOURCE = REPO / "content" / "extra" / "maha"
THEME_CSS = REPO / "theme" / "static" / "css"


@pytest.fixture(scope="session", autouse=True)
def pelican_build():
    """Build Pelican once per session; all integration tests in this module share this output."""
    subprocess.run(
        ["uv", "run", "pelican", "content", "-s", "pelicanconf.py"],
        cwd=REPO, check=True,
    )


# ── Build wiring ────────────────────────────────────────────────────

def test_pelican_builds_maha_index():
    target = OUTPUT / "maha" / "index.html"
    assert target.exists(), f"Expected {target} to exist after Pelican build"
    assert target.read_text().startswith("<!DOCTYPE html>"), \
        "index.html should be a real HTML doc"


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


# ── maha.css base + components ──────────────────────────────────────

def test_maha_css_exists_and_imports_tokens():
    src = (THEME_CSS / "maha.css").read_text()
    assert "@import url('maha-tokens.css')" in src, \
        "maha.css must @import maha-tokens.css"

def test_maha_css_has_hero_no_portrait():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".hero--no-portrait" in src, "must define .hero--no-portrait modifier"
    assert ".hero-deck" in src, "must define .hero-deck (tagline) class"

def test_maha_css_has_record_strip():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".maha-record-strip" in src
    assert ".record-rows" in src
    assert "tabular-nums" in src

def test_maha_css_has_case_study_panel():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".maha-case-study-panel" in src
    assert ".case-grid" in src
    assert ".case-prose" in src
    assert ".case-image" in src

def test_maha_css_has_now_list():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".now-list" in src
    assert ".now-tag" in src

def test_maha_css_has_experience_row():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".maha-experience-row" in src
    assert ".exp-date" in src
    assert ".exp-annot" in src

def test_maha_css_has_competency_preview():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".competency-preview" in src
    assert ".comp-label" in src
    assert ".comp-body" in src

def test_maha_css_has_misc_components():
    src = (THEME_CSS / "maha.css").read_text()
    assert ".writings-placeholder" in src
    assert ".about-short" in src
    assert ".competency-table" in src
    assert ".maha-now-row" in src
    assert ".story-vignette" in src

def test_maha_css_has_mobile_breakpoints():
    src = (THEME_CSS / "maha.css").read_text()
    assert "@media (max-width: 960px)" in src
    assert "@media (max-width: 700px)" in src
    assert "@media (max-width: 600px)" in src


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
    hero_block = re.search(r'<section class="hero[^"]*">(.+?)</section>', home, re.S)
    assert hero_block, "must have a .hero section"
    assert "<img" not in hero_block.group(1), "v1 hero must not contain an <img>"

def test_home_sections_in_order():
    home = (OUTPUT / "maha" / "index.html").read_text()
    sections = [
        "CLINICIAN · BUILDER",
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
    assert "Inter" not in home

def test_home_theme_color_bordeaux():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert 'name="theme-color" content="#6B1F2B"' in home

def test_home_mahaclinic_link_present():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert 'href="/mahaclinic/"' in home

def test_home_cv_link_present():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert 'href="/maha/cv.pdf"' in home


# ── Sub-pages: about / mahaclinic case study / competencies ─────────

def test_about_builds():
    assert (OUTPUT / "maha" / "about" / "index.html").exists()

def test_about_has_drop_cap_class():
    about = (OUTPUT / "maha" / "about" / "index.html").read_text()
    assert "has-dropcap" in about

def test_about_links_back_home():
    about = (OUTPUT / "maha" / "about" / "index.html").read_text()
    assert 'href="/maha/"' in about

def test_case_study_builds():
    assert (OUTPUT / "maha" / "mahaclinic" / "index.html").exists()

def test_case_study_has_patient_safety_framing():
    cs = (OUTPUT / "maha" / "mahaclinic" / "index.html").read_text()
    assert "No PHI" in cs or "no PHI" in cs
    assert "FDA-label" in cs or "FDA label" in cs
    assert "No diagnoses" in cs or "no diagnoses" in cs

def test_case_study_links_live_tool():
    cs = (OUTPUT / "maha" / "mahaclinic" / "index.html").read_text()
    assert 'href="/mahaclinic/"' in cs

def test_competencies_builds():
    assert (OUTPUT / "maha" / "competencies" / "index.html").exists()

def test_competencies_has_at_least_15_rows():
    comp = (OUTPUT / "maha" / "competencies" / "index.html").read_text()
    n_rows = comp.count('<li class="ct-row">')
    assert n_rows >= 15, f"expected ≥ 15 competency rows, found {n_rows}"

def test_competencies_cites_aamc():
    comp = (OUTPUT / "maha" / "competencies" / "index.html").read_text()
    assert "AAMC" in comp
