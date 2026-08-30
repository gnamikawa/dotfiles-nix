// Compositor dispatch helpers.
//
// Hyprland's Lua config (ADR-0007, hypr/hyprland.lua) evaluates every socket
// dispatch message as Lua, so the classic text form — `dispatch focuswindow
// address:0x123`, which is what astal's `hyprland.dispatch("focuswindow",
// "address:0x123")` writes — is now parsed as `hl.dispatch(focuswindow
// address:0x123)` and rejected as a Lua syntax error. Even `hyprctl dispatch`
// fails for the same reason, so the workaround is to send the typed Lua form
// the compositor now expects, one shaped helper per verb.
//
// argv is handed to Gio.Subprocess directly so the shell never re-parses the
// Lua string — no need to escape embedded quotes.

import Gio from "gi://Gio?version=2.0";

/**
 * Send a raw Lua expression to Hyprland's dispatch socket.
 *
 * Argv-form Gio.Subprocess so the shell never re-parses the Lua — no
 * escaping is needed for embedded quotes.
 *
 * @param luaCall - A Lua expression the compositor's `hl` table exposes.
 */
function send(luaCall: string): void {
  Gio.Subprocess.new(
    ["hyprctl", "dispatch", luaCall],
    Gio.SubprocessFlags.NONE,
  );
}

/**
 * Focus a specific client by Hyprland address (with the 0x prefix).
 *
 * @param address - Client address in `0x…` form, as reported by
 *   {@link addressOf}.
 */
export function focusWindow(address: string): void {
  send(`hl.dsp.focus({ window = "address:${address}" })`);
}

/**
 * Fire a shell command through the compositor.
 *
 * `[[…]]` is a Lua raw string, so nothing inside gets escape-processed —
 * safe for arbitrary launcher lines as long as they don't contain a literal
 * `]]` (never in practice).
 *
 * @param cmd - Shell command line to hand to the compositor's `exec_cmd`.
 */
export function execCmd(cmd: string): void {
  send(`hl.dsp.exec_cmd([[${cmd}]])`);
}
