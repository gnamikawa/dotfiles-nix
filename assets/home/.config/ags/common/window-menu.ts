// The window-menu overlay's open/closed signal plus the cycling primitive
// both the overlay and the Hyprland Tab binds share, so the visible list and
// the keypress-driven focus advance can't drift out of sync.
//
// Hyprland's alt-hold binds toggle the open state via `ags request
// window-menu-open` / `ags request window-menu-close`, and its Tab binds
// advance the focus via `ags request window-menu-next` / `ags request
// window-menu-prev`. The IPC wiring lives in app.tsx (requestHandler) and
// hypr/binds.conf.
//
// The peek is scoped to the FOCUSED MONITOR's active workspace, not to
// the focused client's own workspace. Two reasons:
//
//   - When focus lands on a pinned floating window (Firefox PiP corner),
//     the client's `workspace` briefly reports whatever workspace the
//     window was originally pinned to; using it as the peek's anchor
//     would cycle through the wrong workspace's clients on the very
//     next Tab.
//   - Pinned windows have to be enumerated separately anyway — they
//     live on the monitor's currently-visible workspace regardless of
//     their own `workspace` field, and would otherwise drop out of the
//     peek exactly when they matter most (they're always on top of the
//     stack).
//
// Sort order is spatial (top-to-bottom, then left-to-right), tie-broken by
// address for stability. `layoutmsg cyclenext` walks the layout tree, which
// doesn't match what the overlay renders — driving both from the same sorted
// list is what keeps Tab/Shift-Tab walking down/up the visible rows.
//
// The surface that consumes windowMenuOpen lives in desktop/Desktop.tsx and
// its content in components/WindowMenu.tsx.

import { createState } from "ags";
import AstalHyprland from "gi://AstalHyprland";
import { focusWindow } from "./hypr-dispatch";

const [state, set] = createState(false);
export const windowMenuOpen = state;
export const setWindowMenuOpen = set;

const hyprland = AstalHyprland.get_default();

/**
 * Normalise a Hyprland client address to the `0x…` form.
 *
 * Hyprland's `address` property comes back without the 0x prefix on some
 * builds and with it on others; `focuswindow` wants the 0x form, so callers
 * dispatch through this rather than reading `client.address` directly.
 *
 * @param client - Any AstalHyprland client with an address.
 * @returns Address with a guaranteed `0x` prefix.
 */
export function addressOf(client: AstalHyprland.Client): string {
  const address = client.address ?? "";
  return address.startsWith("0x") ? address : `0x${address}`;
}

/**
 * List every client the Alt-hold peek should show, in display order.
 *
 * Anchored on the focused monitor's currently-active workspace, plus
 * pinned clients on that same monitor — so a Firefox PiP corner or
 * any other `pin`-toggled floating stays in the peek across workspace
 * switches even when its own `workspace` field is momentarily behind.
 *
 * Sorted top-to-bottom, then left-to-right, tie-broken by address so
 * the order is stable frame-to-frame — necessary because the visible
 * list and the Tab/Shift-Tab cycling both consume this ordering.
 *
 * @returns Clients on the peek's workspace, sorted spatially with a
 *   stable tiebreak. Empty when no monitor is focused.
 */
export function peekClients(): AstalHyprland.Client[] {
  const monitor = hyprland.focusedMonitor;
  const workspace = monitor?.activeWorkspace;
  if (!monitor || !workspace) return [];

  const wsId = workspace.id;
  const monId = monitor.id;
  const seen = new Set<string>();

  return hyprland
    .get_clients()
    .filter((c) => {
      // Regular tiled/floating windows on this workspace, plus pinned
      // clients on this monitor (their own `workspace` id can lag
      // right after a workspace switch — see the file header).
      const belongs =
        c.workspace?.id === wsId || (c.pinned && c.monitor?.id === monId);
      if (!belongs) return false;
      // A pinned client on the current workspace could match both
      // predicates; dedupe by address so it appears once in the list.
      if (seen.has(c.address)) return false;
      seen.add(c.address);
      return true;
    })
    .sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.address < b.address ? -1 : 1;
    });
}

/**
 * Advance the focused client by one step through the peek's visible order.
 *
 * Shared by the overlay's own key handlers and Hyprland's Tab binds so the
 * visible highlight and the compositor's focus can't drift apart. If
 * focus is currently outside the peek's list (e.g. on a client that
 * just moved to another workspace), the cycle starts at the top so
 * Tab still advances rather than dead-ending.
 *
 * @param direction - `+1` walks down the list, `-1` walks up; wraps at
 *   either end.
 */
export function cycleWindowMenu(direction: 1 | -1): void {
  const list = peekClients();
  if (list.length === 0) return;
  const current = hyprland.get_focused_client();
  const currentIdx = list.findIndex((c) => c.address === current?.address);
  const from = currentIdx < 0 ? 0 : currentIdx;
  const next = list[(from + direction + list.length) % list.length];
  focusWindow(addressOf(next));
}
