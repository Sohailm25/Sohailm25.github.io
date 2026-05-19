"""ABOUTME: Verifies Pelican builds mahaclinic directory contents to /mahaclinic/.
ABOUTME: Acts as the smallest end-to-end check that EXTRA_PATH_METADATA wiring works."""

import subprocess
import pathlib
import pytest

REPO = pathlib.Path(__file__).parent.parent
OUTPUT = REPO / "output"

def test_pelican_builds_mahaclinic_index():
    subprocess.run(
        ["uv", "run", "pelican", "content", "-s", "pelicanconf.py"],
        cwd=REPO, check=True
    )
    target = OUTPUT / "mahaclinic" / "index.html"
    assert target.exists(), f"Expected {target} to exist after Pelican build"
    assert target.read_text().startswith("<!DOCTYPE html>"), \
        "index.html should be a real HTML doc"
