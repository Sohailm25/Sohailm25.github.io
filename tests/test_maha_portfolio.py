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
