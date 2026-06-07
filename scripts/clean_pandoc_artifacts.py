# ABOUTME: One-pass cleanup of Pandoc-emitted artifacts in book HTML.
# ABOUTME: Title \n removal, smart-quote conversion, em-dash conversion.

from __future__ import annotations

import re
import sys
from pathlib import Path

# Match <pre>...</pre> and <code>...</code> blocks to preserve their content
PRE_OR_CODE_RE = re.compile(
    r"(<(?:pre|code)\b[^>]*>.*?</(?:pre|code)>)",
    re.DOTALL | re.IGNORECASE,
)
HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)


def _split_preserved(html: str) -> list[tuple[str, bool]]:
    """Split HTML into segments tagged (text, is_preserved).

    Preserved segments are <pre>/<code> blocks and HTML comments;
    they should not be touched by any cleanup.
    """
    parts: list[tuple[str, bool]] = []
    cursor = 0
    # Combine pre/code + comment matches by walking both
    all_matches = sorted(
        list(PRE_OR_CODE_RE.finditer(html)) + list(HTML_COMMENT_RE.finditer(html)),
        key=lambda m: m.start(),
    )
    for m in all_matches:
        if m.start() > cursor:
            parts.append((html[cursor:m.start()], False))
        parts.append((html[m.start():m.end()], True))
        cursor = m.end()
    if cursor < len(html):
        parts.append((html[cursor:], False))
    return parts


def _apply_to_unpreserved(html: str, transform) -> str:
    return "".join(seg if preserved else transform(seg) for seg, preserved in _split_preserved(html))


def fix_title_newlines(html: str) -> str:
    """Collapse \\n inside <title> and <h1>..<h6> tags to a single space."""
    def collapse(m: re.Match) -> str:
        tag_open, content, tag_close = m.group(1), m.group(2), m.group(3)
        collapsed = re.sub(r"\s*\n\s*", " ", content)
        return f"{tag_open}{collapsed}{tag_close}"

    pattern = re.compile(
        r"(<(?:title|h[1-6])[^>]*>)(.*?)(</(?:title|h[1-6])>)",
        re.DOTALL | re.IGNORECASE,
    )
    return _apply_to_unpreserved(html, lambda seg: pattern.sub(collapse, seg))


def smarten_quotes(text: str) -> str:
    """Convert straight quotes to typographic quotes outside of <pre>/<code>."""
    def transform(seg: str) -> str:
        # Apostrophe: between letters or after letter
        seg = re.sub(r"(?<=\w)'(?=\w)", "’", seg)
        seg = re.sub(r"(?<=\w)'", "’", seg)
        # Double quotes: open before non-space, close after non-space
        seg = re.sub(r'"([^"\s])', "“\\1", seg)
        seg = re.sub(r'([^"\s])"', "\\1”", seg)
        return seg
    return _apply_to_unpreserved(text, transform)


def convert_double_dashes(text: str) -> str:
    """Convert `--` between word characters to em-dash."""
    def transform(seg: str) -> str:
        return re.sub(r"(?<=\w)\s*--\s*(?=\w)", "—", seg)
    return _apply_to_unpreserved(text, transform)


def clean_html_string(html: str) -> str:
    """Apply Pandoc-artifact cleanups: title newlines + em-dashes only.

    Smart-quote conversion (smarten_quotes) is intentionally SKIPPED — the
    current regex over-matches HTML attribute delimiters and CSS string quotes,
    breaking document validity. The function remains in the module and passes
    its unit tests in isolation, but is not called end-to-end. Smart quotes
    will be reintroduced in a future polish pass using a proper HTML parser
    (BeautifulSoup over text nodes only). See plan §Task 7 amendment.
    """
    html = fix_title_newlines(html)
    html = convert_double_dashes(html)
    return html


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: clean_pandoc_artifacts.py <root-dir-or-file>")
        return 2
    root = Path(argv[1])
    targets: list[Path]
    if root.is_file():
        targets = [root]
    else:
        targets = sorted(root.rglob("index.html"))
    changed = 0
    for path in targets:
        original = path.read_text(encoding="utf-8")
        cleaned = clean_html_string(original)
        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            print(f"cleaned: {path}")
            changed += 1
    print(f"{changed} file(s) changed")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
