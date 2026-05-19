# ABOUTME: Pelican plugin — for each article and page, also render a v2 copy
# ABOUTME: at /v2/<slug>/ or /v2/pages/<slug>/ using v2_*.html templates.

from pelican import signals


def _v2_article_template(article):
    """Return the v2 template name for a given article based on its Template metadata."""
    meta_template = article.metadata.get("template", "article")
    if meta_template == "longform_article":
        return "v2_longform_article"
    return "v2_article"


def _v2_page_template(page):
    """Return the v2 template name for a given page based on its Template metadata."""
    meta_template = page.metadata.get("template", "page")
    if meta_template == "inference-economics":
        return "v2_inference_economics"
    return "v2_page"


def write_v2_articles(article_generator, writer):
    env = article_generator.env
    for article in article_generator.articles:
        template_name = _v2_article_template(article)
        try:
            template = env.get_template(template_name + ".html")
        except Exception:
            continue
        save_as = "v2/{slug}/index.html".format(slug=article.slug)
        url = "v2/{slug}/".format(slug=article.slug)
        writer.write_file(
            name=save_as,
            template=template,
            context=article_generator.context,
            relative_urls=article_generator.settings.get("RELATIVE_URLS", False),
            article=article,
            category=article.category,
            override_output=True,
            url=url,
        )


def write_v2_pages(page_generator, writer):
    env = page_generator.env
    for page in page_generator.pages:
        template_name = _v2_page_template(page)
        try:
            template = env.get_template(template_name + ".html")
        except Exception:
            continue
        save_as = "v2/pages/{slug}/index.html".format(slug=page.slug)
        url = "v2/pages/{slug}/".format(slug=page.slug)
        writer.write_file(
            name=save_as,
            template=template,
            context=page_generator.context,
            relative_urls=page_generator.settings.get("RELATIVE_URLS", False),
            page=page,
            override_output=True,
            url=url,
        )


def register():
    signals.article_writer_finalized.connect(write_v2_articles)
    signals.page_writer_finalized.connect(write_v2_pages)
