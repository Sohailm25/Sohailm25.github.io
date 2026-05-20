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

def test_home_title():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "<title>Maha Nadeem — Lead Medical Assistant</title>" in home

def test_home_name_is_nadeem():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "Maha Nadeem" in home
    assert "Maha Mohammad" not in home

def test_home_loads_both_stylesheets():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "maha-tokens.css" in home
    assert "maha.css" in home

def test_home_hero_kicker():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "LEAD MEDICAL ASSISTANT · DALLAS, TX" in home

def test_home_hero_no_imposter_terms():
    """User feedback: 'clinician' overclaims (MA is not a licensed clinician), 'builder' is removed."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "CLINICIAN · BUILDER" not in home
    assert "hero-deck" not in home, "tagline deck removed per user feedback"

def test_home_hero_has_no_portrait_class():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "hero--no-portrait" in home
    hero_block = re.search(r'<section class="hero[^"]*">(.+?)</section>', home, re.S)
    assert hero_block, "must have a .hero section"
    assert "<img" not in hero_block.group(1), "v1 hero must not contain an <img>"

def test_home_now_section_removed():
    """User feedback: remove Now section entirely."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "NOW · Q2 2026" not in home
    assert "now-list" not in home  # no now-list ul should render either

def test_home_sections_in_order():
    home = (OUTPUT / "maha" / "index.html").read_text()
    sections = [
        "LEAD MEDICAL ASSISTANT",   # hero kicker
        "ON THE RECORD",
        "FEATURED · 2026",
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

def test_home_experience_supervisor_links():
    """User feedback: credit supervising physicians with linked profiles."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "Dr. Darlene Gou" in home
    assert "innovative-dermatology.com/physician/darlene-gou-md-faad" in home
    assert "Dr. Khoshnood Ahmad" in home
    assert "childrens.com/doctor-profile/khoshnood-ahmad" in home

def test_home_record_strip_has_mas_trained():
    """User feedback: add 'Medical assistants trained: 10' as a metric."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "Medical assistants trained" in home
    assert ">10<" in home  # value cell

def test_home_record_strip_dropped_rows():
    """User feedback: drop 4 specific rows (years post-grad, encounters, flows, sites)."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "Years post-graduate clinical" not in home
    assert "Patient encounters" not in home
    assert "Biologic dosing flows shipped" not in home
    assert "Practice sites using the tool" not in home


# ── V2 keyword pass (per research v2 brief §6) ──────────────────────

def test_home_uses_longitudinal_keyword():
    """V2 brief §2: 'longitudinal' is a high-signal phrase for 2025-2026 admissions."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "longitudinal" in home.lower()

def test_home_uses_interprofessional_keyword():
    """V2 brief §2."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "interprofessional" in home.lower()

def test_home_uses_patient_centered_keyword():
    """V2 brief §2 + §6F."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "patient-centered" in home.lower() or "patient centered" in home.lower()

def test_home_lead_ma_mentions_training_others():
    """V2 brief §4: surface the 'training other MAs' angle."""
    home = (OUTPUT / "maha" / "index.html").read_text()
    # Should mention training in the Lead MA exp row
    assert "trained" in home or "training" in home
    assert "MAs" in home or "medical assistants" in home

def test_about_uses_longitudinal_keyword():
    about = (OUTPUT / "maha" / "about" / "index.html").read_text()
    assert "longitudinal" in about.lower()

def test_about_uses_interprofessional_keyword():
    about = (OUTPUT / "maha" / "about" / "index.html").read_text()
    assert "interprofessional" in about.lower()

def test_competencies_teamwork_mentions_training():
    """V2 brief §6E: Teamwork & Collaboration row should surface the training-MAs angle."""
    comp = (OUTPUT / "maha" / "competencies" / "index.html").read_text()
    # Find the Teamwork row and check it mentions training
    assert "training ~10" in comp or "trained ~10" in comp or "training 10" in comp

def test_case_study_has_patient_centered_intro():
    """V2 brief §6D: prepend a patient-centered intro line."""
    cs = (OUTPUT / "maha" / "mahaclinic" / "index.html").read_text()
    assert "patient-centered" in cs.lower() or "patient centered" in cs.lower()

def test_home_no_moss_color():
    home = (OUTPUT / "maha" / "index.html").read_text()
    assert "#3A4F2A" not in home.upper() and "#3a4f2a" not in home.lower()

def test_home_no_inter_font():
    home = (OUTPUT / "maha" / "index.html").read_text()
    # Only block the Inter typeface — must NOT match "Interprofessional" etc.
    assert re.search(r"font-family[^;]*['\"]Inter['\"]", home) is None, \
        "Inter font referenced in home"
    assert "'Inter'" not in home and '"Inter"' not in home, \
        "Inter font referenced in home"

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


# ── Static assets (CV PDF + screenshot) ─────────────────────────────

def test_cv_pdf_ships():
    assert (OUTPUT / "maha" / "cv.pdf").exists()

def test_cv_pdf_is_real_pdf():
    head = (OUTPUT / "maha" / "cv.pdf").read_bytes()[:8]
    assert head.startswith(b"%PDF-"), "cv.pdf must be a valid PDF (magic bytes)"

def test_screenshot_ships():
    assert (OUTPUT / "maha" / "images" / "mahaclinic-screenshot.png").exists()

def test_screenshot_is_png():
    head = (OUTPUT / "maha" / "images" / "mahaclinic-screenshot.png").read_bytes()[:8]
    assert head.startswith(b"\x89PNG"), "screenshot must be a valid PNG"


# ── Mahaclinic palette sync ─────────────────────────────────────────

def test_mahaclinic_imports_maha_tokens():
    css = (REPO / "content" / "extra" / "mahaclinic" / "styles.css").read_text()
    assert "@import url('../theme/css/maha-tokens.css')" in css, \
        "mahaclinic styles.css must @import maha-tokens.css (not book-tokens.css)"

def test_mahaclinic_index_theme_color_bordeaux():
    src = (REPO / "content" / "extra" / "mahaclinic" / "index.html").read_text()
    assert '<meta name="theme-color" content="#6B1F2B">' in src

def test_mahaclinic_about_theme_color_bordeaux():
    src = (REPO / "content" / "extra" / "mahaclinic" / "about" / "index.html").read_text()
    assert '<meta name="theme-color" content="#6B1F2B">' in src

def test_mahaclinic_drug_theme_color_bordeaux():
    src = (REPO / "content" / "extra" / "mahaclinic" / "drug.html").read_text()
    # Allow multiple occurrences — all must be bordeaux
    assert '<meta name="theme-color" content="#3A4F2A">' not in src
    assert '<meta name="theme-color" content="#6B1F2B">' in src


# ── Acceptance-criteria grep checks (spec §11) ──────────────────────

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
    """M3: no font-family: 'Inter' anywhere in maha CSS or HTML.
    Must match only the Inter typeface, NOT substrings like 'Interprofessional'.
    """
    targets = [
        REPO / "theme" / "static" / "css" / "maha-tokens.css",
        REPO / "theme" / "static" / "css" / "maha.css",
    ] + list((REPO / "content" / "extra" / "maha").rglob("*.html"))
    for f in targets:
        text = f.read_text(errors='ignore')
        assert re.search(r"font-family[^;]*['\"]Inter['\"]", text) is None, \
            f"Inter font referenced in {f}"
        assert "'Inter'" not in text and '"Inter"' not in text, \
            f"Inter font referenced in {f}"

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
        bad_phrases = [
            "want to be a dermatologist",
            "i want to specialize in",
            "going into dermatology",
        ]
        for phrase in bad_phrases:
            assert phrase not in text, f"specialty-fixation phrase {phrase!r} in {f}"

def test_no_third_party_tracking():
    """M20: no analytics scripts loaded."""
    targets = list((REPO / "content" / "extra" / "maha").rglob("*.html"))
    for f in targets:
        text = f.read_text(errors='ignore').lower()
        for token in ["ga.js", "gtag", "google-analytics", "hotjar", "fbq("]:
            assert token not in text, f"tracking token {token!r} in {f}"
