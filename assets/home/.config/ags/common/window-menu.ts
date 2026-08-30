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
 * List every client on a workspace in the peek's display order.
 *
 * Sorted top-to-bottom, then left-to-right, tie-broken by address so the
 * order is stable frame-to-frame — necessary because the visible list and
 * the Tab/Shift-Tab cycling both consume this ordering.
 *
 * @param wsId - Hyprland workspace id, as reported by
 *   `client.workspace?.id`.
 * @returns Clients on the workspace, sorted spatially with a stable
 *   tiebreak.
 */
export function sortedClientsOnWorkspace(
  wsId: number,
): AstalHyprland.Client[] {
  return hyprland
    .get_clients()
    .filter((c) => c.workspace?.id === wsId)
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
 * visible highlight and the compositor's focus can't drift apart.
 *
 * @param direction - `+1` walks down the list, `-1` walks up; wraps at
 *   either end.
 */
export function cycleWindowMenu(direction: 1 | -1): void {
  const current = hyprland.get_focused_client();
  const wsId = current?.workspace?.id;
  if (wsId == null) return;
  const list = sortedClientsOnWorkspace(wsId);
  if (list.length === 0) return;
  const currentIdx = list.findIndex((c) => c.address === current?.address);
  const from = currentIdx < 0 ? 0 : currentIdx;
  const next = list[(from + direction + list.length) % list.length];
  focusWindow(addressOf(next));
}
