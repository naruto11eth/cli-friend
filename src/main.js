import { search, topUsed, groupedByCategory, DOMAINS } from "./search.js";

const $q = document.getElementById("q");
const $results = document.getElementById("results");
const $toast = document.getElementById("toast");
const $mic = document.getElementById("mic");
const $speak = document.getElementById("speak");
const $gear = document.getElementById("gear");
const $settings = document.getElementById("settings");
const $chips = document.getElementById("chips");

// Active domain filter: null = All, else "Vim" / "CLI".
let domain = null;

// Live settings (loaded from the Rust config at startup).
let cfg = { hotkey: "cmd+ctrl+h", edge: "right", opacity: 0.26, voice: "" };

let current = []; // commands currently shown, in row order
let active = 0; // index of highlighted row (into `current`)

// Tauri's global API (enabled via withGlobalTauri). Guarded so the page
// also runs in a plain browser for quick iteration.
const invoke = window.__TAURI__?.core?.invoke;

// ── usage frequency (persisted) ──
// Boosts the commands you look up most. Stored in the WebView's localStorage,
// which persists across launches.
const USAGE_KEY = "vh_usage_v1";
let usage = loadUsage();

function loadUsage() {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function bumpUsage(keys) {
  usage[keys] = (usage[keys] || 0) + 1;
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch {
    /* private mode / quota — frequency just won't persist */
  }
}

function hideWindow() {
  if (invoke) invoke("hide_main").catch(() => {});
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

// Bold the parts of the description that match query words.
function highlight(desc, query) {
  const safe = escapeHtml(desc);
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
  if (!words.length) return safe;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return safe.replace(re, "<mark>$1</mark>");
}

// Extra detail (when-to-use + related keys) — only shown on the active row (CSS).
function extraHtml(cmd) {
  const parts = [];
  if (cmd.use) parts.push(`<span class="use">${escapeHtml(cmd.use)}</span>`);
  if (cmd.also) parts.push(`<span class="also">also&nbsp; ${escapeHtml(cmd.also)}</span>`);
  return parts.length ? `<span class="extra">${parts.join("")}</span>` : "";
}

function rowHtml(cmd, i, query) {
  const desc = query ? highlight(cmd.desc, query) : escapeHtml(cmd.desc);
  const badge = `<span class="badge badge-${cmd.domain.toLowerCase()}">${escapeHtml(cmd.domain)}</span>`;
  const meta = [cmd.cat, cmd.mode].filter(Boolean).map(escapeHtml).join(" · ");
  return `
    <li class="row" data-i="${i}">
      <span class="keys">${escapeHtml(cmd.keys)}</span>
      <span class="body">
        <span class="desc">${desc}</span>
        <span class="meta">${badge} ${meta}</span>
        ${extraHtml(cmd)}
      </span>
    </li>`;
}

function sectionHtml(title) {
  return `<li class="section">${escapeHtml(title)}</li>`;
}

// Render the All / Vim / CLI filter chips.
function renderChips() {
  const chips = [{ label: "All", value: null }, ...DOMAINS.map((d) => ({ label: d, value: d }))];
  $chips.innerHTML = chips
    .map(
      (c) =>
        `<button class="chip${c.value === domain ? " active" : ""}" data-domain="${c.value ?? ""}">${c.label}</button>`
    )
    .join("");
}

function render() {
  const query = $q.value.trim();
  current = [];
  let html = "";

  renderChips();

  if (!query) {
    // Browse mode: most-used first, then the full list grouped by category.
    const freq = topUsed(usage, 6, domain);
    if (freq.length) {
      html += sectionHtml("Frequent");
      for (const { cmd } of freq) {
        html += rowHtml(cmd, current.length, "");
        current.push(cmd);
      }
    }
    for (const grp of groupedByCategory(domain)) {
      // Show the domain in the header only when browsing across all domains.
      html += sectionHtml(domain ? grp.cat : `${grp.domain} · ${grp.cat}`);
      for (const cmd of grp.items) {
        html += rowHtml(cmd, current.length, "");
        current.push(cmd);
      }
    }
  } else {
    for (const { cmd } of search(query, { usage, domain })) {
      html += rowHtml(cmd, current.length, query);
      current.push(cmd);
    }
  }

  $results.innerHTML = html;
  active = 0;
  const rows = $results.querySelectorAll(".row");
  if (rows.length) rows[0].classList.add("active");
}

function setActive(i) {
  const rows = [...$results.querySelectorAll(".row")];
  if (!rows.length) return;
  active = (i + rows.length) % rows.length;
  rows.forEach((r, idx) => r.classList.toggle("active", idx === active));
  rows[active].scrollIntoView({ block: "nearest" });
}

// The primary keystrokes (before any "  (or …)" annotation).
function primaryKeys(keys) {
  return keys.split(/\s{2,}|\s*\(/)[0].trim();
}

async function copyActive() {
  const item = current[active];
  if (!item) return;
  const keys = primaryKeys(item.cmd.keys);
  bumpUsage(item.cmd.keys);
  try {
    await navigator.clipboard.writeText(keys);
    showToast(`copied  ${keys}`);
  } catch {
    showToast(keys);
  }
}

// Read the active command aloud (TTS). Uses the macOS `say` command via Rust,
// which is reliable in the app's WebView; falls back to the Web Speech API
// when running in a plain browser.
function speakActive() {
  const item = current[active];
  if (!item) return;
  bumpUsage(item.cmd.keys);
  const text = `${item.cmd.desc}. Press ${spell(item.cmd.keys)}`;
  if (invoke) {
    invoke("speak", { text, voice: cfg.voice || null }).catch(() => {});
  } else if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}

// Turn raw keystrokes into something a screen reader / TTS says sensibly.
function spell(keys) {
  return primaryKeys(keys)
    .replace(/Ctrl-/g, "control ")
    .replace(/\$/g, " dollar sign")
    .replace(/\^/g, " caret")
    .replace(/:/g, "colon ")
    .replace(/\//g, "slash ");
}

let toastTimer;
function showToast(text) {
  $toast.textContent = text;
  $toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (($toast.hidden = true)), 1100);
}

// ── events ──
$q.addEventListener("input", render);

$q.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      setActive(active + 1);
      break;
    case "ArrowUp":
      e.preventDefault();
      setActive(active - 1);
      break;
    case "Enter":
      e.preventDefault();
      if (e.metaKey) speakActive();
      else copyActive();
      break;
    case "Escape":
      e.preventDefault();
      if (settingsOpen()) {
        closeSettings();
      } else if ($q.value) {
        $q.value = "";
        render();
      } else {
        hideWindow();
      }
      break;
    case "w":
      if (e.metaKey) {
        e.preventDefault();
        hideWindow();
      }
      break;
  }
});

$results.addEventListener("click", (e) => {
  const row = e.target.closest(".row");
  if (!row) return;
  active = Number(row.dataset.i);
  copyActive();
});

// Filter chips: All / Vim / CLI.
$chips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  domain = chip.dataset.domain || null;
  render();
  $q.focus();
});

// Speak your question: record + transcribe on-device via the Rust `transcribe`
// command (Swift SFSpeechRecognizer helper). Falls back to macOS Dictation if
// the helper isn't available (e.g. running in a plain browser, or denied).
let listening = false;
async function startDictation() {
  if (!invoke) {
    $q.focus();
    showToast("press fn fn to dictate");
    return;
  }
  if (listening) return;
  listening = true;
  $mic.classList.add("listening");
  showToast("listening…");
  try {
    const text = await invoke("transcribe");
    if (text) {
      $q.value = text;
      render();
    } else {
      showToast("didn't catch that");
    }
  } catch {
    $q.focus();
    showToast("voice unavailable — press fn fn");
  } finally {
    listening = false;
    $mic.classList.remove("listening");
    $q.focus();
  }
}
$mic.addEventListener("click", startDictation);

$speak.addEventListener("click", speakActive);

// ── settings ──
// Below this tint the frosted-glass vibrancy is turned off so the popup can go
// fully transparent (the OS frost is otherwise a floor the tint can't get under).
const VIBRANCY_MIN = 0.08;

function applyOpacity(v) {
  document.documentElement.style.setProperty("--note-alpha", String(v));
}

function applyVibrancy(v) {
  if (invoke) invoke("set_vibrancy", { on: Number(v) > VIBRANCY_MIN }).catch(() => {});
}

function settingsOpen() {
  return !$settings.hidden;
}

async function openSettings() {
  // Populate the form from current config.
  document.getElementById("set-hotkey").value = cfg.hotkey;
  document.getElementById("set-edge").value = cfg.edge;
  document.getElementById("set-opacity").value = cfg.opacity;

  // Fill the voice picker (macOS `say` voices) once.
  const $voice = document.getElementById("set-voice");
  if (invoke && $voice.options.length <= 1) {
    try {
      const voices = await invoke("list_voices");
      for (const name of voices) {
        const o = document.createElement("option");
        o.value = name;
        o.textContent = name;
        $voice.appendChild(o);
      }
    } catch {
      /* no voices available */
    }
  }
  $voice.value = cfg.voice || "";

  $results.hidden = true;
  $settings.hidden = false;
}

function closeSettings() {
  $settings.hidden = true;
  $results.hidden = false;
  $q.focus();
}

async function saveSettings() {
  const next = {
    hotkey: document.getElementById("set-hotkey").value.trim() || "cmd+ctrl+h",
    edge: document.getElementById("set-edge").value,
    opacity: parseFloat(document.getElementById("set-opacity").value),
    voice: document.getElementById("set-voice").value,
  };
  if (invoke) {
    try {
      await invoke("set_config", { config: next });
    } catch (e) {
      showToast(`${e}`.includes("hotkey") ? "invalid hotkey" : "couldn't save");
      return;
    }
  }
  cfg = next;
  applyOpacity(cfg.opacity);
  applyVibrancy(cfg.opacity);
  closeSettings();
  showToast("settings saved");
}

$gear.addEventListener("click", () => (settingsOpen() ? closeSettings() : openSettings()));
document.getElementById("set-save").addEventListener("click", saveSettings);
document.getElementById("set-close").addEventListener("click", closeSettings);
// Live preview while dragging the opacity slider; toggle vibrancy on release.
document.getElementById("set-opacity").addEventListener("input", (e) => applyOpacity(e.target.value));
document.getElementById("set-opacity").addEventListener("change", (e) => applyVibrancy(e.target.value));

// Load persisted settings from Rust at startup.
async function initConfig() {
  if (!invoke) return;
  try {
    cfg = await invoke("get_config");
    applyOpacity(cfg.opacity);
    applyVibrancy(cfg.opacity);
  } catch {
    /* keep defaults */
  }
}

// Re-focus the input every time the popup is shown.
window.addEventListener("focus", () => {
  $q.focus();
  $q.select();
});

render();
$q.focus();
initConfig();
