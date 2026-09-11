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
// The pure `buildX` helpers live in `hypr-dispatch-builders.ts` so unit
// tests can import them without pulling `gi://Gio` at import time. This
// module re-exports them alongside the impure `send`/`sendBatch`/higher-
// level dispatch functions, so existing callers keep a single import site.
//
// argv is handed to Gio.Subprocess directly so the shell never re-parses the
// Lua string — no need to escape embedded quotes.

import Gio from "gi://Gio?version=2.0";
import { buildSetProp } from "./hypr-dispatch-builders";

export {
  buildMoveCursor,
  buildMoveWindowExact,
  buildMoveWindowToWorkspaceSilent,
  buildResizeWindow,
  buildSetFloating,
  buildSetPinned,
  buildSetProp,
} from "./hypr-dispatch-builders";

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
 * Send several Lua dispatches as one ordered batch.
 *
 * Each individual `send()` spawns its own subprocess; those subprocesses
 * run concurrently, so a caller that fires resize + move + pin in code
 * order has no guarantee Hyprland executes them in that order. `hyprctl
 * --batch` accepts a `;`-joined list and runs them serially inside the
 * one compositor call, restoring the ordering the caller wrote.
 *
 * @param luaCalls - Lua expressions to dispatch, in intended order.
 */
export function sendBatch(luaCalls: string[]): void {
  if (luaCalls.length === 0) return;
  const joined = luaCalls.map((c) => `dispatch ${c}`).join(" ; ");
  Gio.Subprocess.new(["hyprctl", "--batch", joined], Gio.SubprocessFlags.NONE);
}

/**
 * Focus a specific client by Hyprland address (with the 0x prefix).
 *
 * Clears the target's `no_focus` prop in the same batch before the
 * focus dispatch: Hyprland's `FocusState` refuses to focus any window
 * with `no_focus` set ("Ignoring focus to nofocus window!"), which
 * silently swallowed keyboard-driven focus (Alt+Tab, click-to-focus
 * on a peek row) whenever the target was a floating window the
 * Alt-hold dimmer had just turned pointer-transparent. The clear is
 * idempotent — untouched windows already read `no_focus = false`, so
 * the extra dispatch is a no-op there.
 *
 * @param address - Client address in `0x…` form, as reported by Astal.
 */
export function focusWindow(address: string): void {
  sendBatch([
    buildSetProp(address, "no_focus", "false"),
    `hl.dsp.focus({ window = "address:${address}" })`,
  ]);
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
