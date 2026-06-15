use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

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

/// Park the popup against the right edge, vertically centered, on the monitor
/// the user is currently working on. All math is in physical pixels so it's
/// correct across mixed-DPI displays.
fn position_window(win: &tauri::WebviewWindow) {
    if let Some(monitor) = active_monitor(win) {
        let mpos = monitor.position();
        let msize = monitor.size();
        let wsize = win
            .outer_size()
            .unwrap_or(tauri::PhysicalSize::new(760, 920));
        let margin = (24.0 * monitor.scale_factor()) as i32;
        let x = mpos.x + msize.width as i32 - wsize.width as i32 - margin;
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
fn speak(text: String) {
    #[cfg(target_os = "macos")]
    {
        // Stop any in-progress speech, then speak. Best-effort; ignore failures.
        let _ = std::process::Command::new("killall").arg("say").status();
        let _ = std::process::Command::new("say").arg(text).spawn();
    }
    #[cfg(not(target_os = "macos"))]
    let _ = text;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Global summon hotkey: ⌘ (Cmd) + ⌃ (Ctrl) + H.
    // Avoids Alt/Option, which is unreliable on external keyboards under macOS.
    let hotkey = Shortcut::new(Some(Modifiers::SUPER | Modifiers::CONTROL), Code::KeyH);

    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, scut, event| {
                    if scut == &hotkey && event.state() == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![hide_main, speak])
        .setup(move |app| {
            // Menu-bar-only app: no Dock icon, no app menu bar entry.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Register the global hotkey.
            app.global_shortcut().register(hotkey)?;

            // Build the menu-bar (tray) menu.
            let show = MenuItem::with_id(app, "show", "Show / Hide  (⌘⌃H)", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Vim Helper", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Vim Helper — ⌘⌃H")
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
            if let Some(win) = app.get_webview_window("main") {
                // Frosted-glass background — you can see (a blurred) desktop through it.
                #[cfg(target_os = "macos")]
                {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
                    let _ = apply_vibrancy(
                        &win,
                        NSVisualEffectMaterial::HudWindow,
                        Some(NSVisualEffectState::Active),
                        Some(14.0),
                    );
                }
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
            // Behave like a real menu-bar popover: dismiss when it loses focus.
            WindowEvent::Focused(false) => {
                let _ = window.hide();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running Vim Helper");
}
