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


def test_index_lists_match_actual_files():
    index = json.loads((DATA_DIR / "_index.json").read_text())
    slugs_in_index = {entry["slug"] for entry in index}
    slugs_on_disk = {
        f.stem for f in DATA_DIR.glob("*.json")
        if not f.stem.startswith("_")
    }
    assert slugs_in_index == slugs_on_disk, \
        f"Mismatch: in-index-only={slugs_in_index - slugs_on_disk}, " \
        f"on-disk-only={slugs_on_disk - slugs_in_index}"


def test_config_has_required_fields():
    config = json.loads((DATA_DIR / "_config.json").read_text())
    assert "version" in config
    assert "most_used" in config
    assert "maintainer_email" in config
    index = json.loads((DATA_DIR / "_index.json").read_text())
    valid_slugs = {entry["slug"] for entry in index}
    for slug in config["most_used"]:
        assert slug in valid_slugs, f"_config most_used has unknown slug {slug}"
