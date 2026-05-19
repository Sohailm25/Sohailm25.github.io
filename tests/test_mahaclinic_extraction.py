"""ABOUTME: Smoke tests for HTML-to-JSON extraction of mahaclinic source flowcharts.
ABOUTME: Locks expected dosing values for structurally distinct drugs."""

import pathlib
import sys

REPO = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(REPO / "scripts"))
from extract_mahaclinic_data import extract_one_html

FIXTURES = REPO / "tests/fixtures/mahaclinic"

def test_dupixent_ad_extraction():
    data = extract_one_html(FIXTURES / "Dupixent AD.html")

    assert data["drug"] == "Dupixent"
    assert data["indication"] == "Atopic Dermatitis"
    assert data["indication_short"] == "AD"
    assert data["route"] == "subcutaneous"
    assert "200 mg / 1.14 mL" in data["vial_sizes"]
    assert "300 mg / 2 mL" in data["vial_sizes"]

    # Three age bands
    assert len(data["age_bands"]) == 3
    labels = [b["label_short"] for b in data["age_bands"]]
    assert "Infants" in labels
    assert "Children" in labels
    assert "Adults" in labels

    # Adult dose
    adults = next(b for b in data["age_bands"] if b["label_short"] == "Adults")
    assert len(adults["weights"]) == 1
    adult_dose = adults["weights"][0]
    assert adult_dose["loading"]["value"] == "600 mg"
    assert adult_dose["maintenance"]["value"] == "300 mg"
    assert "2 week" in adult_dose["maintenance"]["frequency"]

    # Infant dose has no loading
    infants = next(b for b in data["age_bands"] if b["label_short"] == "Infants")
    assert infants["weights"][0]["loading"] is None

    # Source attribution
    assert data["source"]["file"] == "Dupixent AD.html"
    assert data["source"]["extracted_on"]

    # Review state starts empty
    assert data["reviewed"]["by"] is None
    assert data["reviewed"]["date"] is None
