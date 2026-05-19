// ABOUTME: Mahaclinic client logic — routing, data loading, render, recents, search.
// ABOUTME: Single-file ES2020 module; no framework, no build step.

const BASE = "/mahaclinic/";
const DATA = BASE + "data/";
const RECENTS_KEY = "mahaclinic.recents";
const RECENTS_CAP = 5;
const INSTALL_DISMISSED_KEY = "mahaclinic.installDismissed";

// ── Storage helpers ──────────────────────────────────────────────────

function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch { return []; }
}

function pushRecent(slug) {
  const cur = getRecents().filter(s => s !== slug);
  cur.unshift(slug);
  while (cur.length > RECENTS_CAP) cur.pop();
  localStorage.setItem(RECENTS_KEY, JSON.stringify(cur));
}

// ── Data loaders ─────────────────────────────────────────────────────

let _indexPromise = null;
function loadIndex() {
  if (!_indexPromise) _indexPromise = fetch(DATA + "_index.json").then(r => r.json());
  return _indexPromise;
}

let _configPromise = null;
function loadConfig() {
  if (!_configPromise) _configPromise = fetch(DATA + "_config.json").then(r => r.json());
  return _configPromise;
}

function loadDrug(slug) {
  return fetch(DATA + slug + ".json").then(r => {
    if (!r.ok) throw new Error("drug not found: " + slug);
    return r.json();
  });
}

// ── Render helpers ───────────────────────────────────────────────────

function pillForEntry(entry) {
  const a = document.createElement("a");
  a.className = "maha-pill";
  a.href = BASE + entry.slug + "/";
  a.dataset.slug = entry.slug;
  a.innerHTML = `<span class="maha-pill-nm">${entry.drug}</span>` +
                `<span class="maha-pill-ind">${entry.indication_short}</span>`;
  return a;
}

function resultRowForEntry(entry) {
  const a = document.createElement("a");
  a.className = "maha-result-row";
  a.href = BASE + entry.slug + "/";
  a.dataset.slug = entry.slug;
  a.innerHTML = `<span class="nm">${entry.drug}</span>` +
                `<span class="ind">${entry.indication}</span>`;
  return a;
}

// ── Search ───────────────────────────────────────────────────────────

function filterIndex(index, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/);
  return index.filter(entry => {
    const hay = (entry.drug + " " + entry.indication + " " + entry.indication_short).toLowerCase();
    return tokens.every(t => hay.includes(t));
  }).slice(0, 20);
}

// ── Home page logic ──────────────────────────────────────────────────

async function renderHome() {
  const [index, config] = await Promise.all([loadIndex(), loadConfig()]);
  const indexBySlug = Object.fromEntries(index.map(e => [e.slug, e]));

  const mostUsedRow = document.querySelector('[data-pill-row="most-used"]');
  mostUsedRow.innerHTML = "";
  for (const slug of config.most_used) {
    const entry = indexBySlug[slug];
    if (entry) mostUsedRow.appendChild(pillForEntry(entry));
  }

  const recents = getRecents();
  const recentsSection = document.getElementById("maha-recents");
  const recentsRow = recentsSection?.querySelector('[data-pill-row="recents"]');
  if (recents.length > 0) {
    recentsSection.hidden = false;
    recentsRow.innerHTML = "";
    for (const slug of recents) {
      const entry = indexBySlug[slug];
      if (entry) recentsRow.appendChild(pillForEntry(entry));
    }
  }

  const searchEl = document.getElementById("maha-search");
  const resultsEl = document.getElementById("maha-results");
  let debounce;
  searchEl.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const matches = filterIndex(index, searchEl.value);
      resultsEl.innerHTML = "";
      if (matches.length === 0) {
        mostUsedRow.parentElement.hidden = false;
        if (recentsSection) recentsSection.hidden = recents.length === 0;
        return;
      }
      for (const entry of matches) {
        resultsEl.appendChild(resultRowForEntry(entry));
      }
      mostUsedRow.parentElement.hidden = true;
      if (recentsSection) recentsSection.hidden = true;
    }, 60);
  });

  const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
  if (!dismissed && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
    const hint = document.getElementById("maha-install-hint");
    if (hint) {
      hint.hidden = false;
      hint.querySelector('[data-dismiss="install"]').addEventListener("click", () => {
        localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
        hint.hidden = true;
      });
    }
  }
}

// ── Service worker registration ──────────────────────────────────────

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(BASE + "sw.js", { scope: BASE })
    .catch(err => console.warn("SW registration failed", err));
}

// ── Bootstrap ────────────────────────────────────────────────────────

const path = location.pathname;
if (path === BASE || path === BASE + "index.html" || path === BASE.slice(0, -1)) {
  renderHome().catch(err => console.error("home render failed", err));
}
// (drug.html and about.html branches added in Tasks 11 and 12)
