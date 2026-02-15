AUTHOR = "Sohail Mohammad"
SITENAME = "sohail mohammad"
SITEURL = ""

PATH = "content"
TIMEZONE = "America/Chicago"
DEFAULT_LANG = "en"

FEED_ALL_ATOM = "feeds/all.atom.xml"
FEED_ALL_RSS = "feeds/all.rss.xml"
CATEGORY_FEED_ATOM = "feeds/{slug}.atom.xml"
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

THEME = "theme"

SOCIAL = (
    ("github", "https://github.com/Sohailm25"),
    ("twitter", "https://x.com/Sohailmo"),
    ("linkedin", "https://www.linkedin.com/in/sohail-mo/"),
    ("email", "mailto:sohailmo.ai@gmail.com"),
)

CLOUDFLARE_ANALYTICS_TOKEN = "2b79882684cd4f4aa938847b472c148e"

DEFAULT_PAGINATION = 10
RELATIVE_URLS = True

STATIC_PATHS = ["images", "extra", "papers"]
EXTRA_PATH_METADATA = {
    "extra/CNAME": {"path": "CNAME"},
}
# Map research directory to root /research/
import os
for root, dirs, files in os.walk("content/extra/research"):
    for file in files:
        filepath = os.path.join(root, file)
        relpath = os.path.relpath(filepath, "content/extra")
        EXTRA_PATH_METADATA[os.path.relpath(filepath, "content")] = {"path": relpath}

ARTICLE_EXCLUDES = ["extra"]
PAGE_EXCLUDES = ["extra"]

PAGE_URL = "pages/{slug}/"
PAGE_SAVE_AS = "pages/{slug}/index.html"
ARTICLE_URL = "{slug}/"
ARTICLE_SAVE_AS = "{slug}/index.html"
ARCHIVES_SAVE_AS = "writings/index.html"
TAG_SAVE_AS = ""
CATEGORY_SAVE_AS = ""
AUTHOR_SAVE_AS = ""
TAGS_SAVE_AS = ""
CATEGORIES_SAVE_AS = ""
AUTHORS_SAVE_AS = ""

DIRECT_TEMPLATES = ["index", "archives", "theforge"]
THEFORGE_SAVE_AS = "the-forge/index.html"

MARKDOWN = {
    "extension_configs": {
        "markdown.extensions.codehilite": {"css_class": "highlight"},
        "markdown.extensions.extra": {},
        "markdown.extensions.meta": {},
    },
    "output_format": "html5",
}
