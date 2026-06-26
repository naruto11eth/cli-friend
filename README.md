# CLI Friend

A tiny, always-on-top **menu-bar popup** that answers plain-English questions
about **Vim** keyboard shortcuts *and* **modern CLI tools** (fzf, zoxide,
ripgrep, fd, bat, yazi…). Type (or dictate) *"delete a line"* → `D` (or `d$`),
or *"search in files"* → `rg "pattern"` — instantly, fully offline.

```
 ⌨️ menu-bar icon
 ⌘⌃H →
 ┌──────────────────────────┐
 │ vim  ask… 🎤 🔊 ⚙️      │
 │ [All] [Vim] [CLI]        │
 ├──────────────────────────┤
 │ rg "pattern"   CLI·rg    │
 │  search file contents…   │
 │ dd             VIM·Edit  │
 │  delete a line           │
 └──────────────────────────┘
```

## What it does

- **Two domains, one box** — Vim shortcuts and CLI commands, each tagged with a
  **Vim / CLI badge**. Filter chips (`All · Vim · CLI`) scope when you want.
- **Action keyword at a glance** — every CLI entry carries a one-word chip
  (`search`, `find`, `jump`, `preview`, `kill`…) so you can tell what a command
  is for without reading the whole line. Keywords are searchable too.
- **Summon anywhere** with the global hotkey **⌘⌃H** (Cmd-Ctrl-H), or by
  clicking the menu-bar icon. Press it again — or click away, or hit `Esc` — to
  dismiss. No Dock icon; it lives in the menu bar only.
- **Ask in plain English** — `copy a line`, `replace all in file`, `find files`,
  `search history`, `jump directory`. A synonym/concept layer maps different
  wordings onto the same idea, plus typo tolerance.
- **Reverse lookup** — type the keys/command (`dd`, `ciw`, `rg`, `fd`) to see
  what they do.
- **Speak it** — 🎤 records and transcribes your question **on-device**
  (macOS Speech), no network. 🔊 or `⌘↵` reads the highlighted command aloud.
- **Browse** — empty query shows your **most-used** commands first, then the
  full list grouped by category. The highlighted row reveals a *when to use*
  hint and *see also* related keys.
- **Copy the keys** — `↵` Enter copies the highlighted command's keystrokes to
  your clipboard. `↑`/`↓` to move between results.
- **Settings (⚙)** — rebind the hotkey, pick the screen edge, set opacity, and
  choose a TTS voice. Saved to `config.json` in the app's config dir.
- **100% offline & private** — answers come from a curated local database
  (`src/vim-data.js`). No network, no API key.

## Run it

Prereqs: a recent **Rust** toolchain and **Node** + **pnpm** (already set up on
this machine).

```bash
pnpm install        # one time — installs the Tauri CLI
pnpm dev            # run in dev mode (hot, launches the app)
pnpm build          # produce a distributable .app / .dmg
pnpm test           # run the search-ranking tests (node --test, no deps)
```

After `pnpm build`, the app is at:

```
src-tauri/target/release/bundle/macos/Vim Helper.app
src-tauri/target/release/bundle/dmg/Vim Helper_0.1.0_aarch64.dmg
```

Drag the `.app` to `/Applications`. On first launch macOS may warn it's from an
unidentified developer (it's unsigned) — right-click → **Open** to allow it.
To launch it automatically: System Settings → General → Login Items → add it.

## Voice input

Click **🎤** and speak — a small Swift helper (`stt/vh-stt.swift`, using
`SFSpeechRecognizer`) records and transcribes your question **on-device**, then
drops the text into the search box. It's bundled as a Tauri sidecar
(`cli-friend-stt`) and compiled automatically on `pnpm build`.

- **First use** prompts once for Microphone + Speech Recognition permission.
- The WebView can't do in-browser speech recognition, so if the helper is
  unavailable the 🎤 falls back to **macOS Dictation** (`fn` `fn`).
- Read-aloud (🔊 / `⌘↵`) uses the macOS `say` command, voice configurable in ⚙.

## Customize

- **Add/edit commands:** `src/vim-data.js` (Vim) and `src/cli-data.js` (CLI) —
  each entry has `keys`, `desc`, `cat`, `tags` (search synonyms), optional
  `also`/`use` (and `mode` for Vim). The search picks up new lines automatically.
- **Add a whole new domain** (git, tmux, docker…): drop a `*-data.js` file and
  add one line to the `ENTRIES`/`DOMAINS` list in `src/search.js`.
- **Teach it new phrasings:** add a line to the `GROUPS` map in `src/search.js`
  (e.g. a new synonym for "delete") and the whole search understands it.
- **Hotkey / opacity / edge / voice:** the ⚙ settings panel (no recompile).
- **Window size / look:** `src-tauri/tauri.conf.json` (size) and
  `src/styles.css` (appearance).

## Project layout

```
src/                 frontend (static, no bundler)
  index.html
  styles.css
  main.js            UI: search, browse, keyboard nav, copy, TTS, settings
  search.js          offline synonym/concept search + fuzzy + frequency + domains
  vim-data.js        curated Vim command database   ← edit me
  cli-data.js        curated CLI cheatsheet (fzf/rg/fd/bat/zoxide/yazi)  ← edit me
src-tauri/           Rust backend
  src/lib.rs         tray, hotkey, window, config, TTS, transcribe
  tauri.conf.json    window + bundle config
stt/
  vh-stt.swift       on-device speech-to-text helper (sidecar)
  Info.plist         mic/speech usage strings embedded in the helper
scripts/
  build-stt.sh       compiles + signs the STT helper (run on build)
  generate-icon.cjs  regenerates the source app icon
```

## Tech

[Tauri 2](https://tauri.app) (Rust + system WebView) — a few MB binary instead
of a ~150 MB Electron app, with a native menu-bar icon and global hotkey.
