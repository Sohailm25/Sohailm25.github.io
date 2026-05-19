"""ABOUTME: Verifies Pelican builds mahaclinic directory contents to /mahaclinic/.
ABOUTME: Acts as the smallest end-to-end check that EXTRA_PATH_METADATA wiring works."""

import subprocess
import pathlib
import pytest

REPO = pathlib.Path(__file__).parent.parent
OUTPUT = REPO / "output"


@pytest.fixture(scope="session", autouse=True)
def pelican_build():
    """Build Pelican once per session; all integration tests share this output."""
    subprocess.run(
        ["uv", "run", "pelican", "content", "-s", "pelicanconf.py"],
        cwd=REPO, check=True,
    )


def test_pelican_builds_mahaclinic_index():
    target = OUTPUT / "mahaclinic" / "index.html"
    assert target.exists(), f"Expected {target} to exist after Pelican build"
    assert target.read_text().startswith("<!DOCTYPE html>"), \
        "index.html should be a real HTML doc"


def test_robots_disallows_mahaclinic():
    robots = OUTPUT / "robots.txt"
    assert robots.exists(), f"Expected {robots} after build"
    text = robots.read_text()
    assert "Disallow: /mahaclinic/" in text, \
        "robots.txt must explicitly disallow /mahaclinic/"
    assert "User-agent: *" in text, "must have a universal user-agent block"
