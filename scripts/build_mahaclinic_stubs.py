"""ABOUTME: Generates per-drug index.html stubs that load drug.html via app.js.
ABOUTME: One-time generation; commit the stubs. Idempotent."""

import json
import pathlib

ROOT = pathlib.Path("content/extra/mahaclinic")
INDEX = ROOT / "data/_index.json"
DRUG_TEMPLATE = ROOT / "drug.html"

if not DRUG_TEMPLATE.exists():
    raise SystemExit(f"missing {DRUG_TEMPLATE}; run after Task 10 Step 1")

entries = json.loads(INDEX.read_text())
template = DRUG_TEMPLATE.read_text()

for entry in entries:
    slug_dir = ROOT / entry["slug"]
    slug_dir.mkdir(exist_ok=True)
    (slug_dir / "index.html").write_text(template)
print(f"Wrote {len(entries)} stubs.")
