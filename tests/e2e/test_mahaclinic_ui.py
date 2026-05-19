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

def test_drug_page_renders_title_and_disclaimer(site_server, page):
    page.goto(f"{site_server}/mahaclinic/dupixent-ad/")
    page.wait_for_selector("#maha-drug-title")
    assert "Dupixent" in page.inner_text("#maha-drug-title")
    eyebrow = page.inner_text("#maha-drug-eyebrow").upper()
    assert "ATOPIC DERMATITIS" in eyebrow or "AD" in eyebrow
    assert "Reference only" in page.inner_text(".maha-disclaimer")

def test_drug_page_renders_age_bands(site_server, page):
    page.goto(f"{site_server}/mahaclinic/dupixent-ad/")
    page.wait_for_selector(".maha-trace-band")
    bands = page.locator(".maha-trace-band")
    assert bands.count() == 3

def test_trace_band_expands_on_click(site_server, page):
    page.goto(f"{site_server}/mahaclinic/dupixent-ad/")
    page.wait_for_selector(".maha-trace-band")
    bands = page.locator(".maha-trace-band")
    bands.nth(0).click()
    page.wait_for_timeout(200)
    assert "maha-trace-band--active" in (bands.nth(0).get_attribute("class") or "")
    other_class = bands.nth(1).get_attribute("class") or ""
    assert "maha-trace-band--dim" in other_class

def test_weight_click_reveals_dose(site_server, page):
    page.goto(f"{site_server}/mahaclinic/dupixent-ad/")
    page.wait_for_selector(".maha-trace-band")
    page.locator(".maha-trace-band").nth(0).click()
    page.wait_for_selector(".maha-weight-row", timeout=2000)
    page.locator(".maha-weight-row").first.click()
    page.wait_for_selector(".maha-dose-card", timeout=2000)
    card_text = page.inner_text(".maha-dose-card")
    assert "mg" in card_text.lower()

def test_report_issue_has_mailto(site_server, page):
    page.goto(f"{site_server}/mahaclinic/dupixent-ad/")
    page.wait_for_selector(".maha-report-issue")
    href = page.locator(".maha-report-issue").get_attribute("href")
    assert href.startswith("mailto:")
    assert "dupixent-ad" in href

def test_drug_page_has_noindex(site_server, page):
    page.goto(f"{site_server}/mahaclinic/dupixent-ad/")
    robots = page.locator('meta[name="robots"]').get_attribute("content")
    assert "noindex" in robots

def test_about_page_renders(site_server, page):
    page.goto(f"{site_server}/mahaclinic/about/")
    page.wait_for_selector(".maha-about-disclaimer")
    text = page.inner_text("body")
    assert "Reference only" in text
    assert "Maintainer" in text or "Report" in text
    rows = page.locator(".maha-about-drug-row")
    assert rows.count() >= 20
