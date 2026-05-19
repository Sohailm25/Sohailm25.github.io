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


def test_all_drug_jsons_validate(schema):
    """Every committed drug-indication JSON must satisfy the canonical schema.

    Sweeps the data directory and ignores files prefixed with '_' (which are
    schema/sample metadata, not drug records). Any new file dropped into the
    directory is automatically covered.
    """
    json_files = [f for f in DATA_DIR.glob("*.json") if not f.stem.startswith("_")]
    assert json_files, "expected at least one drug JSON to validate against"
    for f in json_files:
        data = json.loads(f.read_text())
        try:
            jsonschema.validate(data, schema)
        except jsonschema.ValidationError as e:
            pytest.fail(f"{f.name} fails schema: {e.message} at path {list(e.absolute_path)}")
