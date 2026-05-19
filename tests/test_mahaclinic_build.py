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


def test_home_shell_has_required_meta():
    home = (OUTPUT / "mahaclinic" / "index.html").read_text()
    assert 'name="robots"' in home and 'noindex' in home
    assert 'rel="manifest"' in home
    assert 'apple-touch-icon' in home
    assert 'maha-search' in home
    assert 'fonts.googleapis.com' in home


def test_home_styles_reach_book_tokens():
    """Ensures the @import URL in styles.css resolves to an actual built file.

    Pelican's theme handler strips 'static/' from theme paths
    (theme/static/css/foo.css -> output/theme/css/foo.css). If the
    @import URL gets out of sync with this convention, the entire
    moss/oxblood design vocabulary is unavailable at runtime.
    """
    styles = (OUTPUT / "mahaclinic" / "styles.css").read_text()
    # The import URL must reference the actual published location
    assert "../theme/css/book-tokens.css" in styles, \
        "styles.css must @import ../theme/css/book-tokens.css (relative from /mahaclinic/)"
    # Must NOT reference the static/ subpath (Pelican strips it)
    assert "theme/static" not in styles, \
        "styles.css must not reference theme/static/ — Pelican strips this segment at build"
    # Verify the target actually exists in output
    target = OUTPUT / "theme" / "css" / "book-tokens.css"
    assert target.exists(), f"book-tokens.css must be at {target} for the @import to resolve"
