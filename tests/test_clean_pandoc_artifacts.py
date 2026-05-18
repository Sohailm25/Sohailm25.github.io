# ABOUTME: Tests for the Pandoc artifact cleanup script.
# ABOUTME: Verifies title \n removal, smart-quote conversion, em-dash conversion.

from scripts.clean_pandoc_artifacts import (
    fix_title_newlines,
    smarten_quotes,
    convert_double_dashes,
    clean_html_string,
)


def test_fix_title_newlines_in_title_tag():
    html = "<title>Part 5: Operating The\nDecision</title>"
    assert fix_title_newlines(html) == "<title>Part 5: Operating The Decision</title>"


def test_fix_title_newlines_in_h1():
    html = "<h1>Operating The\nDecision</h1>"
    assert fix_title_newlines(html) == "<h1>Operating The Decision</h1>"


def test_fix_title_newlines_preserves_pre_blocks():
    """\\n inside <pre> is content, not artifact — must be left alone."""
    html = "<pre>line one\nline two</pre>"
    assert fix_title_newlines(html) == html


def test_smarten_quotes_basic():
    html = "<p>He said \"hello\" to me.</p>"
    assert smarten_quotes(html) == "<p>He said “hello” to me.</p>"


def test_smarten_quotes_apostrophe():
    html = "<p>It's working.</p>"
    assert smarten_quotes(html) == "<p>It’s working.</p>"


def test_smarten_quotes_preserves_code():
    """Quotes inside <code> must remain straight."""
    html = '<p>Use <code>"hello"</code> in JSON.</p>'
    out = smarten_quotes(html)
    assert '<code>"hello"</code>' in out


def test_smarten_quotes_preserves_pre():
    html = '<pre>x = "y"</pre>'
    assert smarten_quotes(html) == html


def test_convert_double_dashes_between_words():
    html = "<p>This -- is an em-dash.</p>"
    assert convert_double_dashes(html) == "<p>This—is an em-dash.</p>"


def test_convert_double_dashes_preserves_html_comments():
    html = "<!-- a comment -->"
    assert convert_double_dashes(html) == html


def test_convert_double_dashes_preserves_pre():
    html = "<pre>flag = --verbose</pre>"
    assert convert_double_dashes(html) == html


def test_clean_html_string_applies_all(canonical_part_html_with_newline_title):
    out = clean_html_string(canonical_part_html_with_newline_title)
    assert "\nDecision" not in out
    assert "Operating The Decision" in out
