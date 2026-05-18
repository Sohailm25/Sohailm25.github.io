# ABOUTME: Tests for the book HTML structural migration script.
# ABOUTME: Strip <style>, restructure to prose-grid, hyperlink cross-refs, add components.

from bs4 import BeautifulSoup

from scripts.migrate_book_markup import (
    strip_inline_style,
    add_book_part_class_to_article,
    promote_first_paragraph_to_dropcap,
    convert_where_this_breaks_h3,
    convert_decision_rule_h3,
    hyperlink_cross_references,
    migrate_html_string,
)


def _soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def test_strip_inline_style_removes_all_style_tags():
    html = '<head><style>body{color:red}</style><style>p{margin:0}</style></head>'
    out = strip_inline_style(html)
    soup = _soup(out)
    assert soup.find_all("style") == []


def test_strip_inline_style_preserves_link_tags():
    html = '<head><link rel="stylesheet" href="/book.css"><style>x{}</style></head>'
    out = strip_inline_style(html)
    soup = _soup(out)
    assert soup.find("link") is not None


def test_add_book_part_class_to_article():
    html = "<article><h1>Title</h1><p>Body</p></article>"
    out = add_book_part_class_to_article(html)
    soup = _soup(out)
    article = soup.find("article")
    assert "book-part" in article.get("class", [])


def test_promote_first_paragraph_letter_first():
    html = "<article><h1>Title</h1><p>Suppose you run a service.</p><p>Then.</p></article>"
    out = promote_first_paragraph_to_dropcap(html)
    soup = _soup(out)
    paragraphs = soup.find_all("p")
    assert "has-dropcap" in paragraphs[0].get("class", [])
    assert "has-dropcap" not in paragraphs[1].get("class", [])


def test_promote_first_paragraph_skips_when_starts_with_quote():
    html = '<article><h1>Title</h1><p>“Quoted thing,” he said.</p></article>'
    out = promote_first_paragraph_to_dropcap(html)
    soup = _soup(out)
    p = soup.find("p")
    assert "has-dropcap" not in p.get("class", [])


def test_promote_first_paragraph_skips_when_starts_with_digit():
    html = "<article><h1>Title</h1><p>500,000 requests per month.</p></article>"
    out = promote_first_paragraph_to_dropcap(html)
    soup = _soup(out)
    p = soup.find("p")
    assert "has-dropcap" not in p.get("class", [])


def test_convert_where_this_breaks_h3():
    html = """<article>
        <h3>Where This Breaks</h3>
        <p>At very low quality-gate pass rates.</p>
        <h3>Next Section</h3>
        <p>More text.</p>
    </article>"""
    out = convert_where_this_breaks_h3(html)
    soup = _soup(out)
    breaks = soup.find_all("div", class_="book-break")
    assert len(breaks) == 1
    label = breaks[0].find(class_="book-break-label")
    assert label is not None and label.string == "Where this breaks"
    assert "very low" in breaks[0].get_text()
    # And no leftover h3 with "Where This Breaks"
    h3s = soup.find_all("h3")
    assert not any("Where This Breaks" in h.get_text() for h in h3s)


def test_convert_decision_rule_h3():
    html = """<article>
        <h3>Decision Rule</h3>
        <p>Pick serverless when monthly tokens stay below 42M/d.</p>
    </article>"""
    out = convert_decision_rule_h3(html)
    soup = _soup(out)
    rules = soup.find_all("div", class_="book-decision-rule")
    assert len(rules) == 1
    label = rules[0].find(class_="book-decision-rule-label")
    assert label.string == "Decision rule"


def test_hyperlink_cross_references_part_chapter():
    """Part+Chapter refs link to the part page; chapter-level anchors are
    deferred (no chapter id attributes exist in current book HTML yet).
    Link text preserves the original "Part 2, Chapter 3" phrasing."""
    html = "<p>See Part 2, Chapter 3 for the derivation.</p>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    links = soup.find_all("a")
    assert len(links) == 1
    assert links[0].get("href") == "/book/part-2/"
    assert links[0].get_text() == "Part 2, Chapter 3"


def test_hyperlink_cross_references_part_alone():
    html = "<p>Returning to Part 1 for review.</p>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    link = soup.find("a")
    assert link is not None
    assert link.get("href") == "/book/part-1/"


def test_hyperlink_cross_references_appendix():
    """Appendix refs link to the appendix page; section-level anchors deferred."""
    html = "<p>Profile saas_chat is documented in Appendix B.</p>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    link = soup.find("a")
    assert link is not None
    assert link.get("href") == "/book/appendix/"
    assert link.get_text() == "Appendix B"


def test_hyperlink_does_not_double_link():
    """If already an <a href> with the same text, leave alone."""
    html = '<p>See <a href="/book/part-2/">Part 2</a> for details.</p>'
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    links = soup.find_all("a")
    assert len(links) == 1  # not 2


def test_migrate_html_string_applies_all(canonical_part_html):
    out = migrate_html_string(canonical_part_html)
    soup = _soup(out)
    # All transformations applied
    assert soup.find("style") is None
    assert soup.find("article", class_="book-part") is not None
    assert soup.find("div", class_="book-break") is not None
    assert soup.find("div", class_="book-decision-rule") is not None
    assert soup.find("a", href="/book/part-2/") is not None
