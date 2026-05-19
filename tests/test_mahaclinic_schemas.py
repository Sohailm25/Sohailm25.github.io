"""ABOUTME: JSON Schema validation for mahaclinic drug-indication data files.
ABOUTME: Ensures every committed JSON conforms to the canonical shape in _schema.json."""

import json
import pathlib
import pytest
import jsonschema

DATA_DIR = pathlib.Path(__file__).parent.parent / "content/extra/mahaclinic/data"

@pytest.fixture
def schema():
    return json.loads((DATA_DIR / "_schema.json").read_text())

def test_sample_validates(schema):
    sample = json.loads((DATA_DIR / "_sample.json").read_text())
    jsonschema.validate(sample, schema)

def test_invalid_sample_fails(schema):
    invalid = {
        "slug": "DUPIXENT-AD",  # uppercase, violates pattern
        "drug": "Dupixent",
        "indication": "Atopic Dermatitis",
        "indication_short": "AD",
        "age_bands": [],  # empty, violates minItems
        "source": {"file": "x.html", "extracted_on": "2026-05-19"}
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(invalid, schema)
