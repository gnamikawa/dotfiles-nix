// Alt-hold floating-window dimmer.
//
// While the Alt-hold window-menu overlay is up, every floating window
// currently visible on some monitor fades to a barely-visible opacity
// AND turns pointer-transparent, so clicks fall through to the tiled
// window beneath. The one exception is the focused window: if focus
// lands on a floating one it stays at full opacity and stays clickable,
// so the user always has a legible escape hatch to click on. Tiled
// windows are never touched — the dimmer only reaches into floating
// clients.
//
// The dim rides on Hyprland's per-window `opacity_inactive` prop, NOT
// `opacity`. Hyprland's presentation code (Window.cpp: `applyAlpha`)
// consults `alpha` when the window is focused and `alphaInactive` when
// it isn't — and this dimmer explicitly wants "focused stays bright,
// everyone else fades" — so overriding `opacity_inactive` on every
// visible floating window lets Hyprland's own focus routing do the
// switch. No opacity re-apply on focus changes is needed as a result;
// the currently-focused floating renders through `alpha` (untouched
// default 1.0) and every unfocused one renders through the 0.15 we set.
//
// The pointer-transparency piece rides on Hyprland's `no_focus` prop:
// v0.55.4's `vectorToWindowUnified` (Compositor.cpp) filters out any
// window with `no_focus` set, so pointer events skip past it to the
// window underneath. When a later Hyprland version wires setprop into
// the ipc socket directly, this can move off the Lua binding without
// changing the outward semantics.
//
// After each setprop batch, we warp the cursor to its own current
// position via `hl.dsp.cursor.move`. Hyprland's `setprop` doesn't
// invalidate the already-latched pointer-focused surface, so a click
// or drag started BEFORE the peek can still land on the (now
// `no_focus`) floating window even though a fresh hit-test would skip
// it. `cursor.move` internally calls `simulateMouseMovement`, which
// re-runs the hit-test and slides pointer focus onto whatever is now
// legally underneath the cursor. Warping to the current position keeps
// the visible cursor still.
//
// `enable()` / `disable()` are the whole surface. `app.tsx` calls them
// from the same IPC handlers that open and close the window-menu, so
// the dim rides alongside the overlay for the exact lifetime of the
// Alt-hold.
//
// Recovery is best-effort: the set of addresses touched by the last
// `enable()` is remembered so `disable()` can restore each one, but if
// AGS restarts mid-hold or a window closes while dimmed there is
// currently no self-heal — the affected window keeps the low opacity
// and stays click-through until the user re-fires and releases the
// Alt-hold once more. Live with it; the interaction is measured in
// seconds.

import AstalHyprland from "gi://AstalHyprland";
import {
  buildMoveCursor,
  buildSetProp,
  sendBatch,
} from "../../common/hypr-dispatch";

const DIMMED_OPACITY = "0.15";
const FULL_OPACITY = "1.0";

const hyprland = AstalHyprland.get_default();

let active = false;
let focusSubscriptionId: number | null = null;
const touchedAddresses = new Set<string>();

/**
 * Collect the ids of every workspace currently active on some monitor.
 *
 * Floating windows on any of these workspaces are on-screen and
 * eligible for the dim; floating windows tucked into an inactive
 * workspace stay untouched (they aren't visible so dimming them buys
 * nothing and lingers as a bug when the user switches back to that
 * workspace).
 */
function visibleWorkspaceIds(): Set<number> {
  const ids = new Set<number>();
  for (const monitor of hyprland.monitors) {
    const ws = monitor.activeWorkspace;
    if (ws) ids.add(ws.id);
  }
  return ids;
}

/**
 * Return the addresses of every floating client currently on-screen.
 *
 * "On-screen" here means the client's workspace is the active workspace
 * of some monitor. Pinned clients are floating by definition and share
 * this treatment.
 */
function visibleFloatingAddresses(): string[] {
  const visible = visibleWorkspaceIds();
  return hyprland.clients
    .filter((c) => c.floating && c.workspace && visible.has(c.workspace.id))
    .map((c) => c.address);
}

/**
 * Apply the dim + pointer-passthrough to every visible floating client,
 * sparing the one that currently holds focus from the passthrough.
 *
 * The opacity dim uses `opacity_inactive`, so Hyprland automatically
 * renders the focused floating (if any) at its normal alpha without any
 * per-focus re-apply from us — see the file header for why. The
 * `no_focus` flag, on the other hand, must track focus: the focused
 * floating window stays clickable so the user has a legible surface to
 * operate on.
 */
function applyPassthroughFlags(): void {
  const focused = hyprland.focusedClient;
  const focusedAddress = focused?.address;
  const addresses = visibleFloatingAddresses();

  const batch: string[] = [];
  for (const address of addresses) {
    touchedAddresses.add(address);
    batch.push(buildSetProp(address, "opacity_inactive", DIMMED_OPACITY));
    const isFocused = address === focusedAddress;
    batch.push(buildSetProp(address, "no_focus", isFocused ? "false" : "true"));
  }
  appendPointerRefresh(batch);
  sendBatch(batch);
}

/**
 * Append a same-position cursor warp so the pointer-focused surface is
 * re-evaluated against the just-changed `no_focus` set.
 *
 * The batch is a no-op if nothing else has been queued (nothing to
 * refresh against) or if Astal can't currently report the cursor
 * position — the visible cursor never jumps.
 */
function appendPointerRefresh(batch: string[]): void {
  if (batch.length === 0) return;
  const pos = hyprland.cursorPosition;
  if (!pos) return;
  batch.push(buildMoveCursor(pos.x, pos.y));
}

/**
 * Restore every client the dimmer touched during this Alt-hold back to
 * full opacity and normal pointer input.
 *
 * Uses `touchedAddresses` rather than re-scanning the current visible
 * set, so a window that moved off-screen between enable and disable is
 * still restored.
 */
function revertAll(): void {
  if (touchedAddresses.size === 0) return;
  const batch: string[] = [];
  for (const address of touchedAddresses) {
    batch.push(buildSetProp(address, "opacity_inactive", FULL_OPACITY));
    batch.push(buildSetProp(address, "no_focus", "false"));
  }
  appendPointerRefresh(batch);
  sendBatch(batch);
  touchedAddresses.clear();
}

/**
 * Start dimming visible floating windows and routing pointer events
 * past them to the tiled window underneath.
 *
 * Idempotent: repeat calls short-circuit. Subscribes to focus changes
 * so the focused floating window (if any) always stays at full opacity
 * and stays clickable as focus moves.
 */
export function enableFloatingDimmer(): void {
  if (active) return;
  active = true;

  applyPassthroughFlags();

  focusSubscriptionId = hyprland.connect("notify::focused-client", () => {
    if (!active) return;
    // Re-apply from scratch: cheap on the tiny scale of floating windows
    // per workspace, and correctly handles both "focus moved onto a
    // floating window" and "focus moved off one" without tracking
    // per-address previous state.
    applyPassthroughFlags();
  });
}

/**
 * Stop dimming, restore every touched window to full opacity, and
 * clear the pointer-passthrough flag on each.
 *
 * Idempotent: safe to call when the dimmer wasn't active. Disconnects
 * the focus subscription installed by {@link enableFloatingDimmer}.
 */
export function disableFloatingDimmer(): void {
  if (!active) return;
  active = false;

  if (focusSubscriptionId !== null) {
    hyprland.disconnect(focusSubscriptionId);
    focusSubscriptionId = null;
  }

  revertAll();
}
