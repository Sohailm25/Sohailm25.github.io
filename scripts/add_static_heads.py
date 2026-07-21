# ABOUTME: One-shot injector for SEO head tags in the static /book/ and
# ABOUTME: /research/ HTML trees, which bypass Pelican templates entirely.

import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE = "https://sohailmo.ai"
OG_IMAGE = f"{SITE}/theme/images/hero-avatar.jpg"

BOOK = {
    "index": (
        "website",
        None,  # keep the existing description
    ),
    "opener": (
        "article",
        "Opening chapter of Production Inference Economics: a worked trace showing "
        "where the token price missed the real cost, the naive versus correct "
        "calculation, and the deterministic gate the book builds on.",
    ),
    "part-0": (
        "article",
        "How to use Production Inference Economics: who the book is for, where its "
        "sources and numbers come from, reading paths, and how the LCPR calculator fits in.",
    ),
    "part-1": (
        "article",
        "Part 1 of Production Inference Economics: token price is not cost, LCPR "
        "(loaded cost per accepted result), and the four data sources that feed it: "
        "trace, invoice, eval, and contract.",
    ),
    "part-2": (
        "article",
        "Part 2 of Production Inference Economics: the hardware cost floor, prefill "
        "versus decode, memory economics, prompt caching and rematerialization, model "
        "architecture, and productive capacity.",
    ),
    "part-3": (
        "article",
        "Part 3 of Production Inference Economics: workload classes that change "
        "treatment. Conversational, agentic, RAG and document extraction, offline, "
        "voice, and specialized workloads.",
    ),
    "part-4": (
        "article",
        "Part 4 of Production Inference Economics: migration gates. The model "
        "candidate funnel, do-nothing as a decision, serverless open models, managed "
        "dedicated, fine-tuning as a cost lever, and self-managed GPUs.",
    ),
    "part-5": (
        "article",
        "Part 5 of Production Inference Economics: operating the decision. Baselines "
        "and evals, benchmarks and goodput, observability and trace-to-loaded-cost, "
        "incidents, and cost attribution.",
    ),
    "appendix": (
        "article",
        "Appendix of Production Inference Economics: the LCPR calculator manual. "
        "Views, worked examples, source snapshot schema, formulas reference, and glossary.",
    ),
    "calculator": (
        "website",
        None,  # keep the existing description
    ),
}

RESEARCH = [
    "activation-steering",
    "escape-velocity",
    "ftle",
    "latent-depth-routing",
    "prediction-market-trader",
    "rlhf-entropy",
]


def head_block(url, title, description, og_type):
    lines = [
        f'<link rel="canonical" href="{url}">',
        f'<meta property="og:type" content="{og_type}">',
        f'<meta property="og:title" content="{title}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{OG_IMAGE}">',
        '<meta property="og:site_name" content="Sohail Mohammad">',
        '<meta name="twitter:card" content="summary">',
        '<meta name="twitter:site" content="@Sohailm25">',
        f'<meta name="twitter:title" content="{title}">',
        f'<link rel="icon" href="/favicon.ico" sizes="32x32">',
    ]
    if description:
        lines.insert(0, f'<meta name="description" content="{description}">')
        lines.append(f'<meta property="og:description" content="{description}">')
        lines.append(f'<meta name="twitter:description" content="{description}">')
    return "\n".join(lines) + "\n"


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;")


def inject(path, block):
    text = path.read_text()
    assert "</head>" in text, path
    assert 'rel="canonical"' not in text, f"{path} already has a canonical"
    path.write_text(text.replace("</head>", block + "</head>", 1))


def title_of(text):
    m = re.search(r"<title>(.*?)</title>", text, re.S)
    return m.group(1).strip()


def existing_description(text):
    return bool(re.search(r'<meta name="description"', text))


def main():
    for slug, (og_type, description) in BOOK.items():
        path = (
            REPO / "content/extra/book" / ("index.html" if slug == "index" else f"{slug}/index.html")
        )
        text = path.read_text()
        url = f"{SITE}/book/" if slug == "index" else f"{SITE}/book/{slug}/"
        title = title_of(text)
        desc = None if existing_description(text) else description
        inject(path, head_block(url, esc(title), esc(desc) if desc else None, og_type))
        print(f"book/{slug}: injected (desc={'kept' if desc is None else 'added'})")

    for slug in RESEARCH:
        path = REPO / "content/extra/research" / slug / "index.html"
        text = path.read_text()
        url = f"{SITE}/research/{slug}/"
        title = title_of(text)
        # distill pages carry their abstract in the d-front-matter JSON
        m = re.search(r"<d-front-matter>\s*<script[^>]*>(.*?)</script>", text, re.S)
        desc = json.loads(m.group(1)).get("description", "") if m else ""
        inject(path, head_block(url, esc(title), esc(desc), "article"))
        print(f"research/{slug}: injected")


if __name__ == "__main__":
    main()
