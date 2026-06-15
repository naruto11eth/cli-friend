use std::str::FromStr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// User-tunable settings, persisted to `<app config dir>/config.json`.
#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(default)]
struct Config {
    /// Summon hotkey, e.g. "cmd+ctrl+h".
    hotkey: String,
    /// Screen edge to dock against: "right" or "left".
    edge: String,
    /// Background tint alpha (0.0–1.0) — the frontend applies this.
    opacity: f64,
    /// Preferred macOS `say` voice for read-aloud ("" = system default).
    voice: String,
}

/// True while the STT helper is capturing audio — keeps the popup from
/// auto-hiding when focus shifts to the system mic-permission prompt.
struct Listening(AtomicBool);

impl Default for Config {
    fn default() -> Self {
        Self {
            hotkey: "cmd+ctrl+h".into(),
            edge: "right".into(),
            opacity: 0.26,
            voice: String::new(),
        }
    }
}

fn config_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    app.path().app_config_dir().ok().map(|d| d.join("config.json"))
}

fn load_config(app: &tauri::AppHandle) -> Config {
    if let Some(p) = config_path(app) {
        if let Ok(s) = std::fs::read_to_string(&p) {
            if let Ok(c) = serde_json::from_str::<Config>(&s) {
                return c;
            }
        }
    }
    Config::default()
}

fn save_config(app: &tauri::AppHandle, cfg: &Config) -> std::io::Result<()> {
    if let Some(p) = config_path(app) {
        if let Some(dir) = p.parent() {
            std::fs::create_dir_all(dir)?;
        }
        let json = serde_json::to_string_pretty(cfg).unwrap_or_else(|_| "{}".into());
        std::fs::write(p, json)?;
    }
    Ok(())
}

/// Parse one hotkey token into a key Code (letters, digits, space).
fn token_to_code(t: &str) -> Option<Code> {
    let name = match t {
        "space" => "Space".to_string(),
        s if s.len() == 1 && s.chars().next().unwrap().is_ascii_alphabetic() => {
            format!("Key{}", s.to_uppercase())
        }
        s if s.len() == 1 && s.chars().next().unwrap().is_ascii_digit() => format!("Digit{}", s),
        _ => return None,
    };
    Code::from_str(&name).ok()
}

/// Parse a hotkey string like "cmd+ctrl+h" into a Shortcut.
fn parse_hotkey(s: &str) -> Option<Shortcut> {
    let mut mods = Modifiers::empty();
    let mut code: Option<Code> = None;
    for raw in s.split('+') {
        let part = raw.trim().to_lowercase();
        match part.as_str() {
            "cmd" | "command" | "super" | "meta" | "win" => mods |= Modifiers::SUPER,
            "ctrl" | "control" => mods |= Modifiers::CONTROL,
            "alt" | "opt" | "option" => mods |= Modifiers::ALT,
            "shift" => mods |= Modifiers::SHIFT,
            other => {
                if let Some(c) = token_to_code(other) {
                    code = Some(c);
                }
            }
        }
    }
    code.map(|c| Shortcut::new(if mods.is_empty() { None } else { Some(mods) }, c))
}

/// The monitor the user is actively on: the one under the mouse cursor.
/// Falls back to the window's current monitor, then the primary.
fn active_monitor(win: &tauri::WebviewWindow) -> Option<tauri::window::Monitor> {
    if let Ok(cursor) = win.app_handle().cursor_position() {
        if let Ok(monitors) = win.available_monitors() {
            let (cx, cy) = (cursor.x as i32, cursor.y as i32);
            for m in monitors {
                let p = m.position();
                let s = m.size();
                if cx >= p.x
                    && cx < p.x + s.width as i32
                    && cy >= p.y
                    && cy < p.y + s.height as i32
                {
                    return Some(m);
                }
            }
        }
    }
    win.current_monitor()
        .ok()
        .flatten()
        .or_else(|| win.primary_monitor().ok().flatten())
}

/// Park the popup against the configured edge, vertically centered, on the
/// monitor the user is currently working on. Physical pixels throughout so it
/// is correct across mixed-DPI displays.
fn position_window(win: &tauri::WebviewWindow) {
    if let Some(monitor) = active_monitor(win) {
        let mpos = monitor.position();
        let msize = monitor.size();
        let wsize = win.outer_size().unwrap_or(tauri::PhysicalSize::new(760, 920));
        let margin = (24.0 * monitor.scale_factor()) as i32;

        let edge = win
            .app_handle()
            .try_state::<Mutex<Config>>()
            .and_then(|s| s.lock().ok().map(|c| c.edge.clone()))
            .unwrap_or_else(|| "right".into());

        let x = if edge == "left" {
            mpos.x + margin
        } else {
            mpos.x + msize.width as i32 - wsize.width as i32 - margin
        };
        let y = mpos.y + (msize.height as i32 - wsize.height as i32) / 2;
        let _ = win.set_position(tauri::PhysicalPosition::new(x, y));
    }
}

/// Show the popup if hidden, hide it if already visible.
fn toggle_window(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        match win.is_visible() {
            Ok(true) => {
                let _ = win.hide();
            }
            _ => {
                position_window(&win);
                let _ = win.show();
                let _ = win.set_focus();
            }
        }
    }
}

/// Invoked from the frontend (Escape / Cmd-W) to dismiss the popup.
#[tauri::command]
fn hide_main(window: tauri::Window) {
    let _ = window.hide();
}

/// Read text aloud (TTS) via the built-in macOS `say` command.
#[tauri::command]
fn speak(text: String, voice: Option<String>) {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("killall").arg("say").status();
        let mut cmd = std::process::Command::new("say");
        if let Some(v) = voice.as_deref() {
            if !v.is_empty() {
                cmd.arg("-v").arg(v);
            }
        }
        let _ = cmd.arg(text).spawn();
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (text, voice);
    }
}

/// Return the current settings.
#[tauri::command]
fn get_config(state: tauri::State<'_, Mutex<Config>>) -> Config {
    state.lock().unwrap().clone()
}

/// Persist new settings: re-register the hotkey, save to disk, update state.
#[tauri::command]
fn set_config(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<Config>>,
    config: Config,
) -> Result<(), String> {
    let shortcut = parse_hotkey(&config.hotkey).ok_or("invalid hotkey")?;
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();
    gs.register(shortcut).map_err(|e| e.to_string())?;
    save_config(&app, &config).map_err(|e| e.to_string())?;
    *state.lock().unwrap() = config;
    Ok(())
}

/// Record from the mic and return an on-device transcript, via the bundled
/// `vim-helper-stt` Swift helper. Blocks up to ~10s, so it runs off-thread.
#[tauri::command]
async fn transcribe(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(state) = app.try_state::<Listening>() {
        state.0.store(true, Ordering::SeqCst);
    }
    let result = tauri::async_runtime::spawn_blocking(|| {
        let dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.to_path_buf()))
            .ok_or("cannot locate app directory")?;
        let mut path = dir.join("vim-helper-stt");
        if !path.exists() {
            path = dir.join("vim-helper-stt-aarch64-apple-darwin");
        }
        if !path.exists() {
            return Err("speech helper not bundled".to_string());
        }
        let out = std::process::Command::new(&path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
        }
        Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
    })
    .await
    .map_err(|e| e.to_string())
    .and_then(|r| r);

    if let Some(state) = app.try_state::<Listening>() {
        state.0.store(false, Ordering::SeqCst);
    }
    result
}

/// Toggle the frosted-glass vibrancy. Turning it off lets the popup go fully
/// transparent (otherwise the OS frost is a floor the tint can't get under).
#[tauri::command]
fn set_vibrancy(window: tauri::WebviewWindow, on: bool) {
    #[cfg(target_os = "macos")]
    {
        use window_vibrancy::{
            apply_vibrancy, clear_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
        };
        // Always clear first so repeated calls can't stack effect views.
        let _ = clear_vibrancy(&window);
        if on {
            let _ = apply_vibrancy(
                &window,
                NSVisualEffectMaterial::HudWindow,
                Some(NSVisualEffectState::Active),
                Some(14.0),
            );
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (window, on);
    }
}

/// List installed macOS `say` voices for the settings picker.
#[tauri::command]
fn list_voices() -> Vec<String> {
    #[cfg(target_os = "macos")]
    {
        if let Ok(out) = std::process::Command::new("say").arg("-v").arg("?").output() {
            let s = String::from_utf8_lossy(&out.stdout);
            let mut v: Vec<String> = s
                .lines()
                .filter_map(|l| l.split("  ").next().map(|w| w.trim().to_string()))
                .filter(|w| !w.is_empty())
                .collect();
            v.dedup();
            return v;
        }
    }
    vec![]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    // Only one shortcut is ever registered (the summon hotkey),
                    // so any press just toggles the popup.
                    if event.state() == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            hide_main,
            speak,
            transcribe,
            get_config,
            set_config,
            set_vibrancy,
            list_voices
        ])
        .setup(|app| {
            // Menu-bar-only app: no Dock icon, no app menu bar entry.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Load settings and register the configured hotkey.
            let cfg = load_config(app.handle());
            if let Some(shortcut) = parse_hotkey(&cfg.hotkey) {
                let _ = app.global_shortcut().register(shortcut);
            }
            let hotkey_label = cfg.hotkey.clone();
            app.manage(Mutex::new(cfg));
            app.manage(Listening(AtomicBool::new(false)));

            // Build the menu-bar (tray) menu.
            let show = MenuItem::with_id(
                app,
                "show",
                format!("Show / Hide  ({hotkey_label})"),
                true,
                None::<&str>,
            )?;
            let quit = MenuItem::with_id(app, "quit", "Quit Vim Helper", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Vim Helper")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => toggle_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // Start hidden; the hotkey / tray summons it.
            // Frosted-glass vibrancy is applied by the frontend (set_vibrancy)
            // based on the saved opacity — kept in one place so layers can't stack.
            if let Some(win) = app.get_webview_window("main") {
                // Float above the active app and follow you across Spaces / fullscreen.
                let _ = win.set_visible_on_all_workspaces(true);
                let _ = win.hide();
            }
            Ok(())
        })
        .on_window_event(|window, event| match event {
            // Closing the window just hides it (the app keeps living in the menu bar).
            WindowEvent::CloseRequested { api, .. } => {
                let _ = window.hide();
                api.prevent_close();
            }
            // Behave like a real menu-bar popover: dismiss when it loses focus —
            // unless we're mid-transcription (the mic-permission prompt steals focus).
            WindowEvent::Focused(false) => {
                let listening = window
                    .app_handle()
                    .try_state::<Listening>()
                    .map(|s| s.0.load(Ordering::SeqCst))
                    .unwrap_or(false);
                if !listening {
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running Vim Helper");
}
