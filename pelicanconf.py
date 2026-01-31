AUTHOR = "Sohail Mohammad"
SITENAME = "Sohail Mohammad"
SITEURL = ""

PATH = "content"
TIMEZONE = "America/Chicago"
DEFAULT_LANG = "en"

# Feeds — explicitly disabled
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Theme
THEME = "Flex"

# Flex theme config
SITETITLE = "Sohail Mohammad"
SITESUBTITLE = "Personal & Technical Blog"
SITEDESCRIPTION = "Thoughts on tech, AI, and life."
SITELOGO = ""

# Links
MAIN_MENU = True
MENUITEMS = (
    ("Archives", "/archives.html"),
    ("About", "/pages/about/"),
)

SOCIAL = (("github", "https://github.com/Sohailm25"),)

DEFAULT_PAGINATION = 10
RELATIVE_URLS = True

# CNAME preservation — CRITICAL
STATIC_PATHS = ["images", "extra/CNAME"]
EXTRA_PATH_METADATA = {
    "extra/CNAME": {"path": "CNAME"},
}

# Disable features not requested
TAG_SAVE_AS = ""
CATEGORY_SAVE_AS = ""
AUTHOR_SAVE_AS = ""
TAGS_SAVE_AS = ""
CATEGORIES_SAVE_AS = ""
AUTHORS_SAVE_AS = ""

# Markdown config with syntax highlighting
MARKDOWN = {
    "extension_configs": {
        "markdown.extensions.codehilite": {"css_class": "highlight"},
        "markdown.extensions.extra": {},
        "markdown.extensions.meta": {},
    },
    "output_format": "html5",
}
