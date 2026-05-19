"""ABOUTME: Builds mahaclinic data/_index.json from the per-drug JSON files.
ABOUTME: Idempotent; safe to re-run after every extraction."""

import json
import pathlib
import sys

DATA = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "content/extra/mahaclinic/data")

entries = []
for f in sorted(DATA.glob("*.json")):
    if f.stem.startswith("_"):
        continue
    data = json.loads(f.read_text())
    entries.append({
        "slug": data["slug"],
        "drug": data["drug"],
        "indication": data["indication"],
        "indication_short": data["indication_short"],
        "reviewed": bool(data.get("reviewed", {}).get("date")),
    })

(DATA / "_index.json").write_text(json.dumps(entries, indent=2) + "\n")
print(f"Wrote {len(entries)} entries to _index.json")
