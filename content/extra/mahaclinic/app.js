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

// ── Drug page logic ──────────────────────────────────────────────────

function slugFromPath() {
  const m = location.pathname.match(/^\/mahaclinic\/([^/]+)\/?$/);
  if (!m || m[1] === "about") return null;
  return m[1];
}

function renderDrugHeader(data) {
  document.title = `${data.drug} ${data.indication_short} · Dermatology Dosing`;
  document.getElementById("maha-drug-eyebrow").textContent = data.indication.toUpperCase();
  const titleEl = document.getElementById("maha-drug-title");
  titleEl.textContent = data.drug + ".";
  titleEl.style.fontStyle = "italic";
  if (data.vial_sizes && data.vial_sizes.length) {
    document.getElementById("maha-drug-subtitle").textContent =
      data.vial_sizes.join(" · ") + " · " + data.route;
  }
  const badge = document.getElementById("maha-review-badge");
  if (data.reviewed && data.reviewed.date) {
    badge.className = "maha-badge maha-badge--green";
    badge.textContent = `REVIEWED · ${data.reviewed.date}` + (data.reviewed.by ? ` · ${data.reviewed.by}` : "");
  } else {
    badge.className = "maha-badge maha-badge--amber";
    badge.textContent = "AUTO-EXTRACTED";
  }
  badge.hidden = false;
}

function renderDoseCardHTML(weight) {
  const parts = [];
  if (weight.loading) {
    parts.push(`
      <div class="maha-dose-card-row">
        <p class="maha-dose-card-label">Loading</p>
        <p class="maha-dose-card-value">${weight.loading.value}</p>
        ${weight.loading.notes ? `<p class="maha-dose-card-meta">${weight.loading.notes}</p>` : ""}
      </div>
    `);
  }
  parts.push(`
    <div class="maha-dose-card-row">
      <p class="maha-dose-card-label">Maintenance</p>
      <p class="maha-dose-card-value">${weight.maintenance.value} · ${weight.maintenance.frequency}</p>
      ${weight.maintenance.notes ? `<p class="maha-dose-card-meta">${weight.maintenance.notes}</p>` : ""}
    </div>
  `);
  parts.push(`<p class="maha-dose-card-verify">verify with current label</p>`);
  return parts.join("");
}

function renderTraceTree(data) {
  const trace = document.getElementById("maha-trace");
  trace.innerHTML = "";
  data.age_bands.forEach((band, idx) => {
    const el = document.createElement("section");
    el.className = "maha-trace-band";
    el.dataset.bandIdx = idx;
    el.innerHTML = `
      <div class="maha-trace-band-header">
        <span class="maha-trace-band-label">${band.label}</span>
        <span class="maha-trace-band-hint">${band.hint || ""}</span>
        <span class="maha-trace-band-chev">›</span>
      </div>
      <div class="maha-weight-list" hidden></div>
    `;
    trace.appendChild(el);

    el.addEventListener("click", (e) => {
      if (el.classList.contains("maha-trace-band--active") && e.target.closest(".maha-weight-row")) {
        return;
      }
      if (el.classList.contains("maha-trace-band--active")) {
        trace.querySelectorAll(".maha-trace-band").forEach(b => {
          b.classList.remove("maha-trace-band--active", "maha-trace-band--dim");
          b.querySelector(".maha-weight-list").hidden = true;
          b.querySelector(".maha-trace-band-chev").textContent = "›";
        });
        return;
      }
      trace.querySelectorAll(".maha-trace-band").forEach(b => {
        if (b === el) {
          b.classList.add("maha-trace-band--active");
          b.classList.remove("maha-trace-band--dim");
          b.querySelector(".maha-weight-list").hidden = false;
          b.querySelector(".maha-trace-band-chev").textContent = "⌄";
        } else {
          b.classList.remove("maha-trace-band--active");
          b.classList.add("maha-trace-band--dim");
          b.querySelector(".maha-weight-list").hidden = true;
          b.querySelector(".maha-trace-band-chev").textContent = "›";
        }
      });

      const list = el.querySelector(".maha-weight-list");
      if (!list.children.length) {
        band.weights.forEach((w, wIdx) => {
          const row = document.createElement("div");
          row.className = "maha-weight-row";
          row.dataset.weightIdx = wIdx;
          row.innerHTML = `
            <span class="maha-weight-row-label">${w.label}</span>
            ${w.label_metric ? `<span class="maha-weight-row-metric">${w.label_metric}</span>` : ""}
          `;
          row.addEventListener("click", (ev) => {
            ev.stopPropagation();
            list.querySelectorAll(".maha-weight-row").forEach(r => r.classList.remove("maha-weight-row--selected"));
            row.classList.add("maha-weight-row--selected");
            let card = list.querySelector(".maha-dose-card");
            if (card) card.remove();
            card = document.createElement("div");
            card.className = "maha-dose-card";
            card.innerHTML = renderDoseCardHTML(w);
            row.after(card);
          });
          list.appendChild(row);
        });
      }
    });
  });
}

function renderSupply(data) {
  if (!data.supply_notes || !data.supply_notes.length) return;
  const section = document.getElementById("maha-supply");
  const list = document.getElementById("maha-supply-list");
  list.innerHTML = "";
  data.supply_notes.forEach(note => {
    const li = document.createElement("li");
    li.textContent = note;
    list.appendChild(li);
  });
  section.hidden = false;
}

function renderSource(data) {
  const el = document.getElementById("maha-source");
  el.textContent = `Extracted from "${data.source.file}" on ${data.source.extracted_on}. Verify with current FDA label.`;
}

function renderReportIssue(data) {
  const el = document.getElementById("maha-report");
  const url = location.href;
  const subject = encodeURIComponent(`[mahaclinic] ${data.slug}: <describe>`);
  const body = encodeURIComponent(`URL: ${url}\n\nIssue: <describe what's wrong>\n`);
  loadConfig().then(cfg => {
    el.href = `mailto:${cfg.maintainer_email}?subject=${subject}&body=${body}`;
  });
}

async function renderDrug() {
  const slug = slugFromPath();
  if (!slug) return;
  try {
    const data = await loadDrug(slug);
    renderDrugHeader(data);
    renderTraceTree(data);
    renderSupply(data);
    renderSource(data);
    renderReportIssue(data);
    pushRecent(slug);
  } catch (err) {
    console.error("drug render failed", err);
    document.getElementById("maha-trace").innerHTML =
      `<p>Drug not found. <a href="../">Back to search.</a></p>`;
  }
}

async function renderAbout() {
  const [index, config] = await Promise.all([loadIndex(), loadConfig()]);
  const list = document.getElementById("maha-about-drug-list");
  list.innerHTML = "";
  index.sort((a, b) => a.drug.localeCompare(b.drug)).forEach(entry => {
    const row = document.createElement("a");
    row.className = "maha-about-drug-row";
    row.href = "../" + entry.slug + "/";
    const dotClass = entry.reviewed ? "dot--green" : "dot--amber";
    row.innerHTML = `
      <span><span class="dot ${dotClass}"></span><span class="nm">${entry.drug}</span></span>
      <span class="ind">${entry.indication_short}</span>
    `;
    list.appendChild(row);
  });
  document.getElementById("maha-about-maintainer").textContent =
    "Report errors to: " + config.maintainer_email;
  document.getElementById("maha-about-version").textContent =
    `Version ${config.version} · last built ${config.last_built}`;
}

// ── Service worker registration ──────────────────────────────────────

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(BASE + "sw.js", { scope: BASE })
    .catch(err => console.warn("SW registration failed", err));
}

// ── Bootstrap ────────────────────────────────────────────────────────

const _path = location.pathname;
if (_path === BASE || _path === BASE + "index.html" || _path === BASE.slice(0, -1)) {
  renderHome().catch(err => console.error("home render failed", err));
} else if (_path.endsWith("/about/") || _path.endsWith("/about/index.html")) {
  renderAbout().catch(err => console.error("about render failed", err));
} else if (slugFromPath()) {
  renderDrug();
}
// about.html branch is added in Task 12
