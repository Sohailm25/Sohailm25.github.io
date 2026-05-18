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


def test_add_book_part_class_to_main_content_div():
    """Virgin page with a main-content div but no article: wrap only the
    div in <article class="book-part">. Siblings (sidebar, scripts) stay
    as body children — they are NOT semantic article content."""
    html = (
        "<html><body>"
        "<nav id=\"sidebar\">SIDE</nav>"
        "<div class=\"main-content\"><h1>Title</h1><p>Body.</p></div>"
        "<script>console.log('x');</script>"
        "</body></html>"
    )
    out = add_book_part_class_to_article(html)
    soup = _soup(out)
    article = soup.find("article", class_="book-part")
    assert article is not None
    # Article wraps the main-content div
    inner_div = article.find("div", class_="main-content")
    assert inner_div is not None
    assert "Body." in inner_div.get_text()
    # Sidebar and script remain as body children (siblings of article)
    body = soup.find("body")
    sidebar = body.find("nav", id="sidebar")
    script = body.find("script")
    assert sidebar is not None
    assert script is not None
    assert sidebar.parent.name == "body"
    assert script.parent.name == "body"
    # Article is also a direct body child
    assert article.parent.name == "body"


def test_add_book_part_class_idempotent_on_correctly_wrapped():
    """If <article class="book-part"> already wraps <div class="main-content">
    directly (post-fix state), running again is a no-op."""
    html = (
        "<html><body>"
        "<nav id=\"sidebar\">SIDE</nav>"
        "<article class=\"book-part\"><div class=\"main-content\">"
        "<h1>T</h1><p>Body.</p></div></article>"
        "<script>x()</script>"
        "</body></html>"
    )
    out = add_book_part_class_to_article(html)
    soup = _soup(out)
    # Exactly one article, exactly one main-content div, article wraps div
    articles = soup.find_all("article")
    assert len(articles) == 1
    assert "book-part" in articles[0].get("class", [])
    inner = articles[0].find("div", class_="main-content")
    assert inner is not None
    # Sidebar and script remain siblings of article
    body = soup.find("body")
    assert body.find("nav", id="sidebar").parent.name == "body"
    assert body.find("script").parent.name == "body"
    # No double-wrapping
    assert articles[0].find("article") is None


def test_add_book_part_class_unwraps_too_wide_article():
    """If an existing <article class="book-part"> wraps both the main-content
    div AND sibling chrome (sidebar, scripts), unwrap and re-wrap so only
    the main-content div is inside the article."""
    html = (
        "<html><body>"
        "<article class=\"book-part\">"
        "<div id=\"progress-bar\"></div>"
        "<nav id=\"sidebar\">SIDE</nav>"
        "<div class=\"main-content\"><h1>T</h1><p>Body.</p></div>"
        "<script>x()</script>"
        "</article>"
        "</body></html>"
    )
    out = add_book_part_class_to_article(html)
    soup = _soup(out)
    articles = soup.find_all("article")
    assert len(articles) == 1
    art = articles[0]
    assert "book-part" in art.get("class", [])
    # Article now contains ONLY the main-content div
    inner = art.find("div", class_="main-content")
    assert inner is not None
    assert "Body." in inner.get_text()
    # Sidebar, progress bar, script restored as body children
    body = soup.find("body")
    sidebar = body.find("nav", id="sidebar")
    progress = body.find("div", id="progress-bar")
    script = body.find("script")
    assert sidebar is not None and sidebar.parent.name == "body"
    assert progress is not None and progress.parent.name == "body"
    assert script is not None and script.parent.name == "body"
    # And those are NOT inside the article anymore
    assert art.find("nav", id="sidebar") is None
    assert art.find("div", id="progress-bar") is None
    assert art.find("script") is None


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


def test_insert_stylesheet_links(canonical_part_html):
    from scripts.migrate_book_markup import insert_stylesheet_links
    out = insert_stylesheet_links(canonical_part_html)
    soup = _soup(out)
    hrefs = [link.get("href") for link in soup.find_all("link")]
    assert "/theme/css/book-tokens.css" in hrefs
    assert "/theme/css/book.css" in hrefs
    # Google Fonts link present
    assert any("fonts.googleapis.com" in (h or "") for h in hrefs)


def test_insert_stylesheet_links_idempotent(canonical_part_html):
    from scripts.migrate_book_markup import insert_stylesheet_links
    once = insert_stylesheet_links(canonical_part_html)
    twice = insert_stylesheet_links(once)
    soup_once = _soup(once)
    soup_twice = _soup(twice)
    assert len(soup_once.find_all("link", href="/theme/css/book.css")) == 1
    assert len(soup_twice.find_all("link", href="/theme/css/book.css")) == 1


def test_remove_legacy_font_links_removes_inter():
    from scripts.migrate_book_markup import remove_legacy_font_links
    html = '<head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap" rel="stylesheet"></head>'
    out = remove_legacy_font_links(html)
    soup = _soup(out)
    assert soup.find("link") is None


def test_remove_legacy_font_links_preserves_new_fonts():
    from scripts.migrate_book_markup import remove_legacy_font_links
    html = '<head><link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400&display=swap" rel="stylesheet"></head>'
    out = remove_legacy_font_links(html)
    soup = _soup(out)
    assert soup.find("link") is not None


def test_remove_legacy_font_links_preserves_unrelated_inter_substrings():
    """Don't accidentally strip fonts that happen to contain 'inter' (e.g. Interstate).
    The regex must require the family= qualifier."""
    from scripts.migrate_book_markup import remove_legacy_font_links
    html = '<head><link href="https://fonts.googleapis.com/css2?family=Interstate:wght@400&display=swap" rel="stylesheet"></head>'
    out = remove_legacy_font_links(html)
    soup = _soup(out)
    assert soup.find("link") is not None


def test_hyperlink_does_not_inject_into_title():
    html = "<html><head><title>Part 1: The Field Problem</title></head><body><p>Hello.</p></body></html>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    title = soup.find("title")
    # title must not contain an <a> tag, and must keep its plain text content
    assert title.find("a") is None
    assert "Part 1" in title.get_text()


def test_hyperlink_does_not_inject_into_h2():
    html = "<article><h2>Part 1 Summary</h2><p>Body.</p></article>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    h2 = soup.find("h2")
    assert h2.find("a") is None
    assert h2.get_text().strip() == "Part 1 Summary"


def test_hyperlink_still_works_in_body_prose():
    """Regression: ensure the new skip set didn't break body-prose hyperlinking."""
    html = "<article><h1>Title</h1><p>See Part 2 for details.</p></article>"
    out = hyperlink_cross_references(html)
    soup = _soup(out)
    link = soup.select_one("p > a")
    assert link is not None
    assert link.get("href") == "/book/part-2/"
