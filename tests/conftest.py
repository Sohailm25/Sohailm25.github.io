# ABOUTME: pytest fixtures shared across migration script tests.
# ABOUTME: Provides sample HTML strings matching the book's structural patterns.

import pytest


@pytest.fixture
def canonical_part_html():
    """Minimal HTML matching the structural pattern of every part page.

    Mirrors the real part HTML shape: sidebar chrome sits as a body
    sibling of a <div class="main-content"> wrapper, which the migration
    will rewrap in <article class="book-part">.
    """
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Part 1: The Field Problem</title>
  <style>
    :root { --c-bg: #faf9f6; --c-text: #1a1a1a; }
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  <nav id="sidebar">TOC</nav>
  <div class="main-content">
    <h1>The Field Problem</h1>
    <p>First sentence with a "quoted phrase" and an em -- dash.</p>
    <h3>Where This Breaks</h3>
    <p>At very low quality-gate pass rates.</p>
    <h3>Decision Rule</h3>
    <p>Pick serverless when monthly tokens stay below 42M/d.</p>
    <p>See Part 2, Chapter 3 for the derivation.</p>
  </div>
  <script>/* page chrome */</script>
</body>
</html>"""


@pytest.fixture
def canonical_part_html_with_newline_title():
    """The Part 5 case — title containing a literal \\n artifact."""
    return """<!DOCTYPE html>
<html><head><title>Part 5: Operating The
Decision</title></head><body><h1>Operating The
Decision</h1></body></html>"""
