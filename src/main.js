import { search } from "./search.js";

const $q = document.getElementById("q");
const $results = document.getElementById("results");
const $toast = document.getElementById("toast");
const $mic = document.getElementById("mic");
const $speak = document.getElementById("speak");

let current = []; // current result set
let active = 0; // index of highlighted row

// Tauri's global API (enabled via withGlobalTauri). Guarded so the page
// also runs in a plain browser for quick iteration.
const invoke = window.__TAURI__?.core?.invoke;

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

function render() {
  const query = $q.value;
  current = search(query);
  active = 0;

  $results.innerHTML = current
    .map(({ cmd }, i) => {
      return `
        <li class="row${i === 0 ? " active" : ""}" data-i="${i}">
          <span class="keys">${escapeHtml(cmd.keys)}</span>
          <span class="body">
            <span class="desc">${highlight(cmd.desc, query)}</span>
            <span class="meta">${escapeHtml(cmd.mode)} · ${escapeHtml(cmd.cat)}</span>
          </span>
        </li>`;
    })
    .join("");
}

function setActive(i) {
  const rows = [...$results.querySelectorAll(".row")];
  if (!rows.length) return;
  active = (i + rows.length) % rows.length;
  rows.forEach((r, idx) => r.classList.toggle("active", idx === active));
  rows[active].scrollIntoView({ block: "nearest" });
}

async function copyActive() {
  const item = current[active];
  if (!item) return;
  // Take the primary keystrokes (before any "  (or …)" annotation).
  const keys = item.cmd.keys.split(/\s{2,}|\s*\(/)[0].trim();
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
  const text = `${item.cmd.desc}. Press ${spell(item.cmd.keys)}`;
  if (invoke) {
    invoke("speak", { text }).catch(() => {});
  } else if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}

// Turn raw keystrokes into something a screen reader / TTS says sensibly.
function spell(keys) {
  const primary = keys.split(/\s{2,}|\s*\(/)[0].trim();
  return primary
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
      if ($q.value) {
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

// The app's WebView (WKWebView) can't do in-browser speech recognition,
// so we lean on macOS system Dictation, which works in any text field.
$mic.addEventListener("click", () => {
  $q.focus();
  showToast("press fn fn to dictate");
});

$speak.addEventListener("click", speakActive);

// Re-focus the input every time the popup is shown.
window.addEventListener("focus", () => {
  $q.focus();
  $q.select();
});

render();
$q.focus();
