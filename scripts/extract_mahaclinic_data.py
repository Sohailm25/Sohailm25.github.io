"""ABOUTME: Extracts dosing data from mahaclinic source HTML flowcharts to JSON.
ABOUTME: One-pass converter; idempotent; preserves source attribution for audit."""

from __future__ import annotations
import datetime
import json
import pathlib
import re
import sys
from typing import Any, Optional

from bs4 import BeautifulSoup, Tag


SHORT_AGE_KEYWORDS = {
    "infant": "Infants",
    "children": "Children",
    "adolescent": "Children",
    "teen": "Children",
    "adult": "Adults",
    "pediatric": "Pediatric",
    "peds": "Pediatric",
}

INDICATION_SHORTS = [
    ("hidradenitis suppurativa", "HS"),
    ("plaque psoriasis", "PsO"),
    ("psoriasis", "PsO"),
    ("atopic dermatitis", "AD"),
    ("bullous pemphigoid", "BP"),
    ("prurigo nodularis", "PN"),
    ("urticaria", "Urticaria"),
    ("alopecia areata", "AA"),
]

# Word-form numbers commonly appearing in dose frequencies ("every two weeks").
WORD_NUMBERS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
}


def slugify(drug: str, indication_short: str, hint: Optional[str] = None) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", drug.lower()).strip("-")
    ind = re.sub(r"[^a-z0-9]+", "-", indication_short.lower()).strip("-")
    parts = [base, ind]
    if hint:
        parts.append(re.sub(r"[^a-z0-9]+", "-", hint.lower()).strip("-"))
    return "-".join(p for p in parts if p)


def indication_short_for(indication: str) -> str:
    low = indication.lower()
    for needle, code in INDICATION_SHORTS:
        if needle in low:
            return code
    return "".join(w[0].upper() for w in indication.split() if len(w) >= 3)[:8]


def short_age_label(label: str) -> str:
    low = label.lower()
    for needle, short in SHORT_AGE_KEYWORDS.items():
        if needle in low:
            return short
    return label.split()[0].capitalize()


def parse_vial_sizes(subtitle: Optional[str]) -> list[str]:
    if not subtitle:
        return []
    matches = re.findall(r"(\d+\s*mg)\s*/\s*([\d.]+\s*m?L)", subtitle)
    return [f"{a.strip()} / {b.strip()}" for (a, b) in matches]


def parse_route(subtitle: Optional[str]) -> str:
    if not subtitle:
        return "subcutaneous"
    low = subtitle.lower()
    if "subcutaneous" in low or "subq" in low or "sub q" in low:
        return "subcutaneous"
    if "intravenous" in low or "iv " in low:
        return "intravenous"
    if "oral" in low or "tablet" in low or "capsule" in low:
        return "oral"
    if "topical" in low or "cream" in low or "ointment" in low:
        return "topical"
    if "intramuscular" in low or " im " in low:
        return "intramuscular"
    return "subcutaneous"


def normalize_frequency(text: str) -> str:
    """Normalize a frequency phrase like 'every two weeks' -> 'every 2 weeks'.

    Source flowcharts mix numeric and word-form digits; downstream consumers
    (and tests) expect the numeric form so they can match on '2 week'.
    """
    def _swap(match: re.Match[str]) -> str:
        word = match.group(0).lower()
        return str(WORD_NUMBERS[word])

    pattern = re.compile(r"\b(" + "|".join(WORD_NUMBERS.keys()) + r")\b", re.I)
    return pattern.sub(_swap, text)


def extract_dose_from_card(card: Tag) -> dict[str, Any]:
    result: dict[str, Any] = {"loading": None, "maintenance": None}
    for section in card.select(".dose-section"):
        label_el = section.select_one(".dose-label")
        detail_el = section.select_one(".dose-detail")
        label = (label_el.get_text(strip=True).lower() if label_el else "")
        detail_text = detail_el.get_text(" ", strip=True) if detail_el else ""

        # Some cards encode "no loading dose" in the detail with no label.
        if "no loading" in detail_text.lower() or "no loading" in label:
            result["loading"] = None
            continue

        value_match = re.search(r"(\d+\s*mg)", detail_text)
        value = value_match.group(1) if value_match else detail_text

        n_match = re.search(r"(\d+)\s*[×x]\s*\d+\s*mg", detail_text)
        n_injections = int(n_match.group(1)) if n_match else 1

        if "loading" in label:
            total_match = re.search(r"\((\d+\s*mg)\)", detail_text)
            total = total_match.group(1) if total_match else value
            entry: dict[str, Any] = {"value": total, "n_injections": n_injections}
            if "×" in detail_text or "x" in detail_text:
                entry["notes"] = detail_text
            result["loading"] = entry
        elif "maintenance" in label:
            normalized = normalize_frequency(detail_text)
            freq_match = re.search(r"every\s+\d+\s+weeks?", normalized, re.I)
            freq = freq_match.group(0).lower() if freq_match else "as directed"
            result["maintenance"] = {
                "value": value,
                "frequency": freq,
                "n_injections": n_injections,
            }
    return result


def extract_weight_branches(branch_col: Tag) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    # Single dose card path (e.g., adults — no sub-branches).
    sub_branches = branch_col.select(".sub-branch-col")
    if not sub_branches:
        direct_card = branch_col.select_one(".dose-card")
        if direct_card:
            row = {"label": "all weights"}
            row.update(extract_dose_from_card(direct_card))
            rows.append(row)
        return rows

    for sub in sub_branches:
        weight_label_el = sub.select_one(".weight-label, .circle-label")
        card = sub.select_one(".dose-card")
        if not card:
            continue
        weight_label = (
            weight_label_el.get_text(" ", strip=True).replace("\xa0", " ")
            if weight_label_el
            else "unspecified"
        )
        row: dict[str, Any] = {"label": weight_label}
        row.update(extract_dose_from_card(card))
        rows.append(row)
    return rows


def extract_one_html(path: pathlib.Path) -> dict[str, Any]:
    html = path.read_text()
    soup = BeautifulSoup(html, "html.parser")

    drug_el = soup.select_one(".drug-title")
    drug_raw = drug_el.get_text(" ", strip=True) if drug_el else "Unknown"
    drug = drug_raw if drug_raw.istitle() else " ".join(w.capitalize() for w in drug_raw.split())

    indication_el = soup.select_one(".drug-indication")
    indication_raw = indication_el.get_text(" ", strip=True) if indication_el else "Unknown"
    indication = re.sub(r"\s*\([A-Z]+\)\s*$", "", indication_raw).strip().title()
    indication_short = indication_short_for(indication)

    subtitle_el = soup.select_one(".drug-subtitle")
    subtitle_text = subtitle_el.get_text(" ", strip=True) if subtitle_el else None

    age_bands: list[dict[str, Any]] = []
    for branch in soup.select(".branch-col, .branch-col-wide"):
        label_el = branch.select_one(".branch-label")
        if not label_el:
            continue
        label = label_el.get_text(" ", strip=True).replace("\xa0", " ")
        age_bands.append({
            "label": label,
            "label_short": short_age_label(label),
            "weights": extract_weight_branches(branch),
        })

    supply_notes_el = soup.select_one(".supply-note")
    supply_notes: list[str] = []
    if supply_notes_el:
        supply_notes = [
            s.strip()
            for s in supply_notes_el.get_text("\n", strip=True).split("\n")
            if s.strip()
        ]

    slug = slugify(drug, indication_short)

    return {
        "slug": slug,
        "drug": drug,
        "indication": indication,
        "indication_short": indication_short,
        "vial_sizes": parse_vial_sizes(subtitle_text),
        "route": parse_route(subtitle_text),
        "age_bands": age_bands,
        "supply_notes": supply_notes,
        "source": {
            "file": path.name,
            "extracted_on": datetime.date.today().isoformat(),
        },
        "reviewed": {"by": None, "date": None},
    }


def main():
    if len(sys.argv) < 3:
        print("Usage: extract_mahaclinic_data.py <source-dir> <output-dir>")
        sys.exit(2)
    src = pathlib.Path(sys.argv[1])
    out = pathlib.Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)

    for html_path in sorted(src.glob("*.html")):
        try:
            data = extract_one_html(html_path)
        except Exception as e:
            print(f"FAILED on {html_path.name}: {e}")
            continue
        target = out / f"{data['slug']}.json"
        target.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        n_bands = len(data["age_bands"])
        n_rows = sum(len(b["weights"]) for b in data["age_bands"])
        print(f"OK {html_path.name} -> {target.name} ({n_bands} age bands, {n_rows} weight rows)")


if __name__ == "__main__":
    main()
