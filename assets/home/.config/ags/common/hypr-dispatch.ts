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
  Gio.Subprocess.new(
    ["hyprctl", "--batch", joined],
    Gio.SubprocessFlags.NONE,
  );
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
 * @param address - Client address in `0x…` form, as reported by
 *   {@link addressOf}.
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

/**
 * Format an address argument for the compositor's window-selector strings.
 *
 * Every window-scoped dispatcher takes the address in the same `address:0x…`
 * shape. Astal's `Client.address` occasionally omits the `0x` prefix and
 * Hyprland silently rejects the resulting selector (dispatch returns `ok`
 * with no effect), so the prefix is added defensively here rather than
 * relying on every caller to normalise first.
 *
 * @param address - Client address in either `0x…` or bare-hex form.
 */
function windowSelector(address: string): string {
  const normalised = address.startsWith("0x") ? address : `0x${address}`;
  return `"address:${normalised}"`;
}

/**
 * Build the Lua expression that sets a client's floating state to a
 * specific value.
 *
 * `hl.dsp.window.float` accepts `action = "on" | "off" | "toggle"`;
 * the explicit on/off forms are idempotent, so callers can dispatch
 * the desired state without first reading `client.floating`. Astal's
 * cached client state can lag behind the compositor after our own
 * batches flip the state — reading `client.floating` and guarding a
 * toggle against it silently drops the dispatch on the stale side,
 * which is what left the PiP recall tiled on the first invocation.
 *
 * @param address - Client address in `0x…` form.
 * @param floating - Desired floating state; `true` floats, `false` tiles.
 */
export function buildSetFloating(address: string, floating: boolean): string {
  const action = floating ? "on" : "off";
  return `hl.dsp.window.float({ window = ${windowSelector(address)}, action = "${action}" })`;
}

/**
 * Build the Lua expression that sets a client's pinned state to a
 * specific value.
 *
 * Same idempotent on/off semantics as {@link buildSetFloating} — safe
 * to dispatch without first reading `client.pinned`.
 *
 * @param address - Client address in `0x…` form.
 * @param pinned - Desired pinned state; `true` pins, `false` unpins.
 */
export function buildSetPinned(address: string, pinned: boolean): string {
  const action = pinned ? "on" : "off";
  return `hl.dsp.window.pin({ window = ${windowSelector(address)}, action = "${action}" })`;
}

/**
 * Build the Lua expression that moves a client to an absolute pixel
 * position in global compositor coordinates.
 *
 * The window must already be floating — tiled windows ignore absolute
 * placement. `x` and `y` are GLOBAL coordinates: to place on a specific
 * monitor at monitor-relative (mx, my), pass (monitor.x + mx,
 * monitor.y + my). `relative = false` is explicit so a stray Hyprland
 * default flip doesn't silently invert the meaning.
 *
 * @param address - Client address in `0x…` form.
 * @param x - Global pixel column of the window's top-left.
 * @param y - Global pixel row of the window's top-left.
 */
export function buildMoveWindowExact(
  address: string,
  x: number,
  y: number,
): string {
  return `hl.dsp.window.move({ window = ${windowSelector(address)}, x = ${x}, y = ${y}, relative = false })`;
}

/**
 * Build the Lua expression that resizes a client to an absolute pixel
 * size.
 *
 * The `x` and `y` names in the dispatch payload are Hyprland's own for
 * width and height respectively — misleading, but that is the argument
 * shape `hl.window.resize` accepts.
 *
 * @param address - Client address in `0x…` form.
 * @param width - Target pixel width.
 * @param height - Target pixel height.
 */
export function buildResizeWindow(
  address: string,
  width: number,
  height: number,
): string {
  return `hl.dsp.window.resize({ window = ${windowSelector(address)}, x = ${width}, y = ${height} })`;
}

/**
 * Build the Lua expression that warps the cursor to an absolute
 * position.
 *
 * `hl.dsp.cursor.move` warps to the given pixel then internally fires
 * `simulateMouseMovement` — so passing the current cursor position is
 * a zero-visible-motion "poke" that forces Hyprland to re-run its
 * pointer hit-test. Callers use that side effect after a `no_focus`
 * flip to make the pointer-focused surface catch up with the new
 * routing (`no_focus` alone only changes future hit-tests, not the
 * already-latched pointer target).
 *
 * @param x - Global pixel column.
 * @param y - Global pixel row.
 */
export function buildMoveCursor(x: number, y: number): string {
  return `hl.dsp.cursor.move({ x = ${x}, y = ${y} })`;
}

/**
 * Build the Lua expression that overrides a per-window property.
 *
 * Property names are Hyprland's snake_case set (e.g. `opacity`,
 * `no_focus`); see `Configuring/Using-hyprctl/#setprop` for the full
 * list. Values are stringified verbatim — Hyprland parses them per
 * property type.
 *
 * There is no `hyprctl setprop` in this repo's Lua-only compositor
 * setup, so the Lua binding is the only entrypoint.
 *
 * @param address - Client address in `0x…` form.
 * @param prop - Property name (snake_case, per Hyprland).
 * @param value - Stringified value.
 */
export function buildSetProp(
  address: string,
  prop: string,
  value: string,
): string {
  return `hl.dsp.window.set_prop({ window = ${windowSelector(address)}, prop = "${prop}", value = "${value}" })`;
}

/**
 * Build the Lua expression that moves a client to another workspace
 * without shifting the user's focus.
 *
 * Used to relocate a window across monitors: pass the target monitor's
 * `active_workspace` id and the compositor sends the window there while
 * the user's active workspace stays where it was.
 *
 * @param address - Client address in `0x…` form.
 * @param workspaceId - Numeric workspace id from Astal's `Workspace.id`.
 */
export function buildMoveWindowToWorkspaceSilent(
  address: string,
  workspaceId: number,
): string {
  return `hl.dsp.window.move({ window = ${windowSelector(address)}, workspace = ${workspaceId}, silent = true })`;
}
