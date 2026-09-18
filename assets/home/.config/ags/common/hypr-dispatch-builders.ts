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
 * Build a same-batch tail that restores the focused client and cursor
 * position to what they were before the batch ran.
 *
 * Purpose: several Hyprland dispatchers (notably `hl.dsp.window.move`
 * with `workspace = N, silent = true` when the target ends up on a
 * different monitor) warp the cursor and shift focus onto the moved
 * window as a side effect. Appending this tail to the SAME `hyprctl
 * --batch` call runs the restore atomically with the batch, so the
 * compositor never renders an interim frame with focus/cursor on the
 * disturbed window.
 *
 * The `no_focus` clear before the focus dispatch mirrors `focusWindow`
 * in `hypr-dispatch.ts` — the floating-dimmer may have set `no_focus`
 * on the target while the peek was up, and Hyprland refuses to focus
 * any window with that flag. The clear is idempotent on untouched
 * clients, so the extra dispatch is safe.
 *
 * @param focusedAddress - The address focus should return to, or null
 *   to skip the focus restore (nothing was focused before the batch).
 * @param cursor - The cursor position to warp back to, or null to skip
 *   (cursor was unreported before the batch).
 */
export function buildRestoreTail(
  focusedAddress: string | null,
  cursor: { x: number; y: number } | null,
): string[] {
  const tail: string[] = [];
  if (focusedAddress !== null) {
    tail.push(buildSetProp(focusedAddress, "no_focus", "false"));
    tail.push(buildFocus(focusedAddress));
  }
  if (cursor !== null) {
    tail.push(buildMoveCursor(cursor.x, cursor.y));
  }
  return tail;
}

/**
 * Build the Lua expression that focuses a client by address.
 *
 * Pairs with a `no_focus` clear (see `focusWindow` in `hypr-dispatch.ts`)
 * when the caller can't be sure the target didn't get `no_focus = true`
 * from the floating-dimmer; batches that already reset focus themselves
 * (like the cycle restore tail) prepend the clear separately.
 *
 * @param address - Client address in `0x…` form.
 */
export function buildFocus(address: string): string {
  return `hl.dsp.focus({ window = ${windowSelector(address)} })`;
}

/**
 * Build the Lua expression that toggles a client's fullscreen mode.
 *
 * Two modes exist in Hyprland: `fullscreen` (borderless, covers the
 * whole monitor including exclusive layers) and `maximized` (respects
 * reserved zones). Passing `on = true` sets `fullscreen` explicitly —
 * `set` without a mode defaults to `maximized`, which the Firefox PiP
 * `suppress_event = "maximize"` window rule blocks anyway. `off`
 * restores whatever pose the window held before the mode was set.
 *
 * @param address - Client address in `0x…` form.
 * @param on - `true` sets borderless fullscreen; `false` restores.
 */
export function buildSetFullscreen(address: string, on: boolean): string {
  if (on) {
    return `hl.dsp.window.fullscreen({ window = ${windowSelector(address)}, action = "set", mode = "fullscreen" })`;
  }
  return `hl.dsp.window.fullscreen({ window = ${windowSelector(address)}, action = "unset" })`;
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
 * without switching the user's active workspace.
 *
 * Used to relocate a window across monitors: pass the target monitor's
 * `active_workspace` id and the compositor sends the window there while
 * the user's active workspace stays where it was.
 *
 * `silent` is a misnomer — it stops the user's active workspace from
 * flipping, but when the target ends up on a DIFFERENT MONITOR from
 * the cursor, Hyprland still warps the cursor onto the moved window
 * and shifts keyboard focus to it. Callers that need cursor/focus to
 * stay put must append {@link buildRestoreTail} to the same batch.
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
