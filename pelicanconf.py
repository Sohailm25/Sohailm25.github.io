AUTHOR = "Sohail Mohammad"
SITENAME = "Sohail Mohammad"
SITEURL = ""
CANONICAL_SITEURL = "https://sohailmo.ai"
SITEDESCRIPTION = (
    "Sohail Mohammad is a forward deployed engineer at Together AI writing about "
    "production inference, post-training, AI infrastructure, and loaded cost per accepted result."
)
DEFAULT_OG_IMAGE = f"{CANONICAL_SITEURL}/theme/images/hero-avatar.jpg"

PATH = "content"
TIMEZONE = "America/Chicago"

PLUGIN_PATHS = ["plugins"]
PLUGINS = ["lazy_images"]
DEFAULT_LANG = "en"

FEED_ALL_ATOM = "feed.xml"
FEED_ALL_RSS = None
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

CLOUDFLARE_ANALYTICS_TOKEN = "2b79882684cd4f4aa938847b472c148e"

RELATIVE_URLS = True

READERS = {"html": None}

STATIC_PATHS = ["images", "extra", "papers"]
EXTRA_PATH_METADATA = {
    "extra/CNAME": {"path": "CNAME"},
    "extra/robots.txt": {"path": "robots.txt"},
    # The research index moved from /pages/research/ to /research/; keep the
    # old URL alive as a redirect stub.
    "extra/redirects/pages-research.html": {"path": "pages/research/index.html"},
    # Root-level favicons: browsers and crawlers probe /favicon.ico blindly.
    "extra/favicon.ico": {"path": "favicon.ico"},
    "extra/favicon-32.png": {"path": "favicon-32.png"},
    "extra/apple-touch-icon.png": {"path": "apple-touch-icon.png"},
    "extra/icon-192.png": {"path": "icon-192.png"},
}
# Map research and book directories to root-level paths
import os

# Standalone pages under book/ and research/ that belong in sitemap.xml.
# Legacy paper-* paths are redirect stubs, not canonical pages.
_SITEMAP_EXCLUDED_DIRS = {"research/paper-a-escape-velocity", "research/paper-b-ftle"}
EXTRA_SITEMAP_URLS = []
for static_dir in ["content/extra/research", "content/extra/book", "content/extra/mahaclinic", "content/extra/maha", "content/extra/together", "content/extra/lc500"]:
    for root, dirs, files in os.walk(static_dir):
        for file in files:
            filepath = os.path.join(root, file)
            relpath = os.path.relpath(filepath, "content/extra")
            EXTRA_PATH_METADATA[os.path.relpath(filepath, "content")] = {"path": relpath}
            reldir = os.path.dirname(relpath)
            if (
                file == "index.html"
                and reldir.split("/")[0] in ("book", "research")
                and reldir not in _SITEMAP_EXCLUDED_DIRS
            ):
                EXTRA_SITEMAP_URLS.append(reldir + "/")
EXTRA_SITEMAP_URLS.sort()

PAGE_URL = "pages/{slug}/"
PAGE_SAVE_AS = "pages/{slug}/index.html"
ARTICLE_URL = "{slug}/"
ARTICLE_SAVE_AS = "{slug}/index.html"
DIRECT_TEMPLATES = ("index", "archives", "sitemap", "llms", "404", "theforge")
ARCHIVES_SAVE_AS = "writings/index.html"
SITEMAP_SAVE_AS = "sitemap.xml"
LLMS_SAVE_AS = "llms.txt"
THEFORGE_SAVE_AS = "the-forge/index.html"

# The index template renders curated sections from the full article list;
# pagination would only emit unlinked index2.html... duplicates of it.
DEFAULT_PAGINATION = False

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
