# ABOUTME: Structural migration of book HTML to the new component vocabulary.
# ABOUTME: Strip <style>, add book-part class, drop caps, callouts, cross-ref hyperlinks.

from __future__ import annotations

import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString


def _parse(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def strip_inline_style(html: str) -> str:
    soup = _parse(html)
    for style in soup.find_all("style"):
        style.decompose()
    return str(soup)


def add_book_part_class_to_article(html: str) -> str:
    soup = _parse(html)
    articles = soup.find_all("article")
    if not articles and soup.body is not None:
        # No <article> wrapper — create one around body content so the rest
        # of the migration pipeline can target it. (BS edge case: lxml will
        # not synthesize <article> for body-level content.)
        article = soup.new_tag("article")
        article["class"] = ["book-part"]
        body_children = list(soup.body.children)
        for child in body_children:
            article.append(child.extract())
        soup.body.append(article)
        return str(soup)
    for article in articles:
        classes = article.get("class", [])
        if "book-part" not in classes:
            classes.append("book-part")
            article["class"] = classes
    return str(soup)


def promote_first_paragraph_to_dropcap(html: str) -> str:
    soup = _parse(html)
    for article in soup.find_all("article"):
        first_p = article.find("p")
        if first_p is None:
            continue
        text = first_p.get_text().lstrip()
        if not text:
            continue
        if not text[0].isalpha():
            continue  # skip if first char isn't a letter
        classes = first_p.get("class", [])
        if "has-dropcap" not in classes:
            classes.append("has-dropcap")
            first_p["class"] = classes
    return str(soup)


def _wrap_h3_section_as(html: str, h3_label_match: str, wrapper_class: str, label_class: str, label_text: str) -> str:
    """Convert <h3>LABEL</h3><p>body</p>... into <div class="..."><span>label</span><p>body</p></div>.

    Sibling <p> tags following the h3 are absorbed until the next heading.
    """
    soup = _parse(html)
    targets = []
    for h3 in soup.find_all("h3"):
        if h3.get_text().strip().lower() == h3_label_match.lower():
            targets.append(h3)
    for h3 in targets:
        wrapper = soup.new_tag("div")
        wrapper["class"] = [wrapper_class]
        label = soup.new_tag("span")
        label["class"] = [label_class]
        label.string = label_text
        wrapper.append(label)
        # Collect siblings until next heading
        sib = h3.find_next_sibling()
        to_move = []
        while sib is not None and sib.name not in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            to_move.append(sib)
            sib = sib.find_next_sibling()
        for el in to_move:
            wrapper.append(el.extract())
        h3.replace_with(wrapper)
    return str(soup)


def convert_where_this_breaks_h3(html: str) -> str:
    return _wrap_h3_section_as(
        html,
        h3_label_match="Where This Breaks",
        wrapper_class="book-break",
        label_class="book-break-label",
        label_text="Where this breaks",
    )


def convert_decision_rule_h3(html: str) -> str:
    return _wrap_h3_section_as(
        html,
        h3_label_match="Decision Rule",
        wrapper_class="book-decision-rule",
        label_class="book-decision-rule-label",
        label_text="Decision rule",
    )


_CROSS_REF_RE = re.compile(
    r"\b(Part\s+(\d+)(?:,\s*(?:Chapter|Section)\s*(\d+))?|"
    r"Appendix\s+([A-Z])(?:,\s*(?:Section)\s*(\d+))?)\b",
)


def _href_for(match: re.Match) -> str:
    # Chapter-level anchors are deferred until Phase 4 (would require
    # inserting id="chapter-N" on h2 elements during migration).
    # For now, all part+chapter refs land on the part page.
    if match.group(2):  # "Part N" (with optional Chapter M — ignored for URL)
        part = match.group(2)
        return f"/book/part-{part}/"
    # "Appendix X" — link to appendix page; section-level anchors deferred.
    return "/book/appendix/"


def hyperlink_cross_references(html: str) -> str:
    soup = _parse(html)
    for text_node in list(soup.find_all(string=True)):
        # Skip text inside existing <a>, <code>, <pre>, <style>, <script>
        ancestor_tags = {p.name for p in text_node.parents if p.name}
        if ancestor_tags & {"a", "code", "pre", "style", "script"}:
            continue
        raw = str(text_node)
        if not _CROSS_REF_RE.search(raw):
            continue
        # Build a sequence of NavigableString + Tag pieces
        pieces: list = []
        cursor = 0
        for m in _CROSS_REF_RE.finditer(raw):
            if m.start() > cursor:
                pieces.append(NavigableString(raw[cursor:m.start()]))
            link = soup.new_tag("a", href=_href_for(m))
            link.string = m.group(0)
            pieces.append(link)
            cursor = m.end()
        if cursor < len(raw):
            pieces.append(NavigableString(raw[cursor:]))
        text_node.replace_with(*pieces)
    return str(soup)


def migrate_html_string(html: str) -> str:
    """Apply all structural migrations in order."""
    html = strip_inline_style(html)
    html = add_book_part_class_to_article(html)
    html = promote_first_paragraph_to_dropcap(html)
    html = convert_where_this_breaks_h3(html)
    html = convert_decision_rule_h3(html)
    html = hyperlink_cross_references(html)
    return html


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: migrate_book_markup.py <root-dir-or-file>")
        return 2
    root = Path(argv[1])
    if root.is_file():
        targets = [root]
    else:
        targets = sorted(root.rglob("index.html"))
    changed = 0
    for path in targets:
        # Skip the landing index — it gets hand-authored
        if path.parent == root and path.name == "index.html":
            print(f"skipping landing page (hand-authored): {path}")
            continue
        original = path.read_text(encoding="utf-8")
        migrated = migrate_html_string(original)
        if migrated != original:
            path.write_text(migrated, encoding="utf-8")
            print(f"migrated: {path}")
            changed += 1
    print(f"{changed} file(s) changed")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
