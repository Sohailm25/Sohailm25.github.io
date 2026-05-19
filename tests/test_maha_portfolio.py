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
