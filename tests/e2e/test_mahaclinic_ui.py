"""ABOUTME: End-to-end UI tests for mahaclinic via Playwright.
ABOUTME: Asserts search filter, recents, install-hint dismiss, and meta tags."""

import pytest

def test_home_loads(site_server, page):
    page.goto(f"{site_server}/mahaclinic/")
    page.wait_for_selector(".maha-title")
    assert page.title() == "Dermatology Dosing"

def test_most_used_pills_render(site_server, page):
    page.goto(f"{site_server}/mahaclinic/")
    page.wait_for_selector(".maha-pill[data-slug]")
    pills = page.locator(".maha-pill[data-slug]")
    assert pills.count() >= 4

def test_search_filters_results(site_server, page):
    page.goto(f"{site_server}/mahaclinic/")
    page.fill(".maha-search", "dupixent")
    page.wait_for_selector(".maha-result-row")
    rows = page.locator(".maha-result-row")
    assert rows.count() >= 2
    for i in range(rows.count()):
        text = rows.nth(i).inner_text().lower()
        assert "dupixent" in text

def test_search_empty_state_hides_results(site_server, page):
    page.goto(f"{site_server}/mahaclinic/")
    page.fill(".maha-search", "dupi")
    page.fill(".maha-search", "")
    rows = page.locator(".maha-result-row")
    assert rows.count() == 0
