// Pure builders for Hyprland dispatch strings.
//
// The compositor's Lua config (ADR-0007) parses every socket dispatch
// message as Lua, so every verb needs a shaped helper that emits the
// exact call form Hyprland now expects. These builders return the raw
// Lua expression as a string; sending it lives in `hypr-dispatch.ts`
// (which imports Gio). Splitting the pure half out lets unit tests
// pull just the string shape without triggering the GI import.

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
