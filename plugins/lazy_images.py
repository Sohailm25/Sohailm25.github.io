# ABOUTME: Pelican plugin that adds loading="lazy" and decoding="async" to
# ABOUTME: article/page body images. The first image stays eager: it is the
# ABOUTME: likely LCP element and lazy-loading it would hurt, not help.

import re

from pelican import signals
from pelican.contents import Content

IMG_RE = re.compile(r"<img\b[^>]*>")


def _augment(html):
    count = 0

    def fix(match):
        nonlocal count
        count += 1
        tag = match.group(0)
        if "decoding=" not in tag:
            tag = tag.replace("<img", '<img decoding="async"', 1)
        if count > 1 and "loading=" not in tag:
            tag = tag.replace("<img", '<img loading="lazy"', 1)
        return tag

    return IMG_RE.sub(fix, html)


def add_lazy_loading(content):
    if not isinstance(content, Content) or not content._content:
        return
    content._content = _augment(content._content)


def register():
    signals.content_object_init.connect(add_lazy_loading)
