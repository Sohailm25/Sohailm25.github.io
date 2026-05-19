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


def test_cosentyx_hs_extraction():
    """Locks the two-band Pediatric+Adults variant with explicit weight rows."""
    data = extract_one_html(FIXTURES / "Cosentyx HS.html")

    assert data["drug"] == "Cosentyx"
    assert data["indication"] == "Hidradenitis Suppurativa"
    assert data["indication_short"] == "HS"
    assert data["route"] == "subcutaneous"

    # Two age bands: Pediatric (12+) and Adults (18+)
    assert len(data["age_bands"]) == 2
    labels = [b["label_short"] for b in data["age_bands"]]
    assert "Pediatric" in labels
    assert "Adults" in labels

    # Pediatric band has two weight rows
    peds = next(b for b in data["age_bands"] if b["label_short"] == "Pediatric")
    assert len(peds["weights"]) == 2
    light = peds["weights"][0]
    heavy = peds["weights"][1]
    assert "66" in light["label"] and "198" in light["label"]
    assert light["loading"]["value"] == "150 mg"
    assert light["maintenance"]["value"] == "150 mg"
    assert light["maintenance"]["frequency"] == "every 4 weeks"
    assert "198" in heavy["label"]
    assert heavy["loading"]["value"] == "300 mg"
    assert heavy["maintenance"]["value"] == "300 mg"
    assert heavy["maintenance"]["frequency"] == "every 4 weeks"

    # Adults band: single dose card, no sub-branches
    adults = next(b for b in data["age_bands"] if b["label_short"] == "Adults")
    assert len(adults["weights"]) == 1
    adult_dose = adults["weights"][0]
    assert adult_dose["loading"]["value"] == "300 mg"
    assert adult_dose["maintenance"]["value"] == "300 mg"
    assert adult_dose["maintenance"]["frequency"] == "every 4 weeks"

    assert data["source"]["file"] == "Cosentyx HS.html"


def test_humira_hs_extraction():
    """Locks the variant where drug title carries the indication and the
    indication itself lives in .drug-subtitle (not .drug-indication)."""
    data = extract_one_html(FIXTURES / "humira-hs.html")

    # Drug title is 'Humira (HS)' in source — parser must preserve the 'HS'
    # acronym casing and strip the parenthetical indication suffix.
    assert data["drug"] == "Humira"
    assert data["indication"] == "Hidradenitis Suppurativa"
    assert data["indication_short"] == "HS"
    assert data["route"] == "subcutaneous"

    # Two age bands: Adult and Adolescent
    assert len(data["age_bands"]) == 2
    labels = [b["label"] for b in data["age_bands"]]
    assert "Adult" in labels
    assert "Adolescent" in labels

    adult = next(b for b in data["age_bands"] if b["label"] == "Adult")
    assert len(adult["weights"]) >= 1
    adult_dose = adult["weights"][0]
    # Loading dose first-day value
    assert adult_dose["loading"]["value"] == "160 mg"
    # Maintenance is '40 mg ... every week OR 80 mg ... every other week'.
    # Parser should pull the first dose and a recognizable frequency.
    assert adult_dose["maintenance"] is not None
    assert "40 mg" in adult_dose["maintenance"]["value"]
    assert "week" in adult_dose["maintenance"]["frequency"]

    adolescent = next(b for b in data["age_bands"] if b["label"] == "Adolescent")
    adoles_dose = adolescent["weights"][0]
    assert adoles_dose["loading"]["value"] == "80 mg"
    assert adoles_dose["maintenance"] is not None
    assert "40 mg" in adoles_dose["maintenance"]["value"]
