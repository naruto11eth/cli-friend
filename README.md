# Vim Helper

A tiny, always-on-top **menu-bar popup** that answers plain-English questions
about Vim keyboard shortcuts. Type (or dictate) something like *"delete to end
of line"* and it shows you the keys — `D` (or `d$`) — instantly, fully offline.

```
 ⌨️ menu-bar icon
 ⌘⌃H →
 ┌─────────────────────┐
 │ vim  ask… 🎤        │
 ├─────────────────────┤
 │  D (or d$)          │
 │   delete to the end │
 │   of the line       │
 └─────────────────────┘
```

## What it does

- **Summon anywhere** with the global hotkey **⌘⌃H** (Cmd-Ctrl-H), or by
  clicking the menu-bar icon. Press it again — or click away, or hit `Esc` — to
  dismiss. No Dock icon; it lives in the menu bar only.
- **Ask in plain English** — `copy a line`, `undo`, `replace all in file`,
  `jump to matching bracket`, `save and quit`.
- **Reverse lookup** — type the keys (`dd`, `ciw`, `:%s`) to see what they do.
- **Copy the keys** — `↵` Enter copies the highlighted command's keystrokes to
  your clipboard. `↑`/`↓` to move between results.
- **100% offline & private** — answers come from a curated local database
  (`src/vim-data.js`). No network, no API key.

## Run it

Prereqs: a recent **Rust** toolchain and **Node** + **pnpm** (already set up on
this machine).

```bash
pnpm install        # one time — installs the Tauri CLI
pnpm dev            # run in dev mode (hot, launches the app)
pnpm build          # produce a distributable .app / .dmg
```

After `pnpm build`, the app is at:

```
src-tauri/target/release/bundle/macos/Vim Helper.app
src-tauri/target/release/bundle/dmg/Vim Helper_0.1.0_aarch64.dmg
```

Drag the `.app` to `/Applications`. On first launch macOS may warn it's from an
unidentified developer (it's unsigned) — right-click → **Open** to allow it.
To launch it automatically: System Settings → General → Login Items → add it.

## Voice / dictation

The app's window uses macOS's `WKWebView`, which doesn't support in-browser
speech recognition — so voice uses **macOS system Dictation** instead, which
works in any text field:

1. Summon the popup (`⌘⌃H`) — the input is already focused.
2. Press the dictation key (default: **press `fn` twice**, or set a key in
   System Settings → Keyboard → Dictation).
3. Speak your question; it searches as the words appear.

The 🎤 button just focuses the field and reminds you of the shortcut.

## Customize

- **Add/edit commands:** `src/vim-data.js` — each entry has `keys`, `desc`,
  `mode`, `cat`, and `tags` (synonyms that make natural-language search hit).
  The search picks up new lines automatically.
- **Change the hotkey:** `src-tauri/src/lib.rs` → the `hotkey` line
  (`Modifiers::SUPER | Modifiers::CONTROL` + `Code::KeyH`).
- **Window size / look:** `src-tauri/tauri.conf.json` (size) and
  `src/styles.css` (appearance).

## Project layout

```
src/                 frontend (static, no bundler)
  index.html
  styles.css
  main.js            UI: input, results, keyboard nav, copy, dismiss
  search.js          offline token-scoring search
  vim-data.js        the curated command database  ← edit me
src-tauri/           Rust backend
  src/lib.rs         tray icon, global hotkey, window show/hide
  tauri.conf.json    window + bundle config
scripts/
  generate-icon.cjs  regenerates the source app icon
```

## Tech

[Tauri 2](https://tauri.app) (Rust + system WebView) — a few MB binary instead
of a ~150 MB Electron app, with a native menu-bar icon and global hotkey.
