AUTHOR = "Sohail Mohammad"
SITENAME = "Sohail Mohammad"
SITEURL = ""

PATH = "content"
TIMEZONE = "America/Chicago"
DEFAULT_LANG = "en"

FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

THEME = "theme"

SOCIAL = (
    ("github", "https://github.com/Sohailm25"),
    ("twitter", "https://x.com/Sohailm25"),
    ("linkedin", "https://www.linkedin.com/in/sohail-mo/"),
    ("email", "mailto:sohailmo.ai@gmail.com"),
)

CLOUDFLARE_ANALYTICS_TOKEN = ""

DEFAULT_PAGINATION = 10
RELATIVE_URLS = True

READERS = {"html": None}

STATIC_PATHS = ["images", "extra", "papers"]
EXTRA_PATH_METADATA = {
    "extra/CNAME": {"path": "CNAME"},
}
# Map research and book directories to root-level paths
import os
for static_dir in ["content/extra/research", "content/extra/book"]:
    for root, dirs, files in os.walk(static_dir):
        for file in files:
            filepath = os.path.join(root, file)
            relpath = os.path.relpath(filepath, "content/extra")
            EXTRA_PATH_METADATA[os.path.relpath(filepath, "content")] = {"path": relpath}

PAGE_URL = "pages/{slug}/"
PAGE_SAVE_AS = "pages/{slug}/index.html"
ARTICLE_URL = "{slug}/"
ARTICLE_SAVE_AS = "{slug}/index.html"
DIRECT_TEMPLATES = ("index", "archives")
ARCHIVES_SAVE_AS = "writings/index.html"

TAG_SAVE_AS = ""
CATEGORY_SAVE_AS = ""
AUTHOR_SAVE_AS = ""
TAGS_SAVE_AS = ""
CATEGORIES_SAVE_AS = ""
AUTHORS_SAVE_AS = ""

MARKDOWN = {
    "extension_configs": {
        "markdown.extensions.codehilite": {"css_class": "highlight"},
        "markdown.extensions.extra": {},
        "markdown.extensions.meta": {},
        "markdown.extensions.toc": {"permalink": True, "toc_depth": 3},
    },
    "output_format": "html5",
}
