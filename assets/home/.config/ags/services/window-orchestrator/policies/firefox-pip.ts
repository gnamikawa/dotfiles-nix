// Firefox Picture-in-Picture placement policy.
//
// Every Firefox PiP window has the same class ("firefox") and title
// ("Picture-in-Picture"). The policy routes by "does the primary already
// hold a PiP?" — not by arrival count — so the invariant holds even when
// the user drags a PiP off the primary or closes the corner PiP first:
//   Primary has no PiP           → primary monitor, floating + pinned in
//                                  the top-right corner. This is the
//                                  stream you actually watch.
//   Primary already holds a PiP,
//   satellite present            → satellite monitor, tiled. Hyprland's
//                                  layout engine splits the whole monitor
//                                  between however many overflow PiPs are
//                                  open, which is what you want when
//                                  glancing between four co-streams.
//   Primary already holds a PiP,
//   no satellite                 → primary monitor, cascading floating
//                                  windows offset from the corner. Laptop
//                                  fallback.

import AstalHyprland from "gi://AstalHyprland";
import {
  buildMoveWindowExact,
  buildMoveWindowToWorkspaceSilent,
  buildResizeWindow,
  buildToggleFloating,
  buildTogglePinned,
  sendBatch,
} from "../../../common/hypr-dispatch";
import { loadConfig } from "../config";

const PIP_WIDTH = 426;
const PIP_HEIGHT = 240;

// Symmetric outer inset: the primary PiP sits INSET px from the right edge
// and INSET px below the ags-bar (which happens to be BAR_HEIGHT tall,
// same value on purpose so the corner reads square).
//
// Reading `monitor.reservedTop` looked correct on paper but returns 0 on
// AGS startup — the layer-shell surface hasn't reserved its exclusive
// zone yet at that point, and by the time our policy runs, Astal's
// cached snapshot is stale. Hardcoding the bar height (which is also
// the ags-bar's declared exclusive height) keeps the corner stable
// across restarts and re-mappings.
const BAR_HEIGHT = 41;
const INSET = 41;

// Step by which each overflow PiP cascades down-and-left from the primary
// corner when no satellite exists. Matches the laptop fallback path.
const CASCADE_STEP = 40;

const CLASS_MATCH = "firefox";
const TITLE_MATCH = "Picture-in-Picture";

const hyprland = AstalHyprland.get_default();
const config = loadConfig();

/**
 * Test whether a client is a Firefox Picture-in-Picture window.
 *
 * Uses `initialClass` / `initialTitle` (frozen at window creation) rather
 * than the live `class` / `title` — a PiP's live title can occasionally
 * change to include the video's own title, but the initial pair is
 * always the same pair Firefox stamps at creation.
 *
 * @param client - Astal-wrapped Hyprland client to test.
 */
function isPipClient(client: AstalHyprland.Client): boolean {
  return (
    client.initialClass === CLASS_MATCH && client.initialTitle === TITLE_MATCH
  );
}

/**
 * Locate the primary monitor by geometry.
 *
 * `hardware.primaryMonitor` (system-nix) pins the chosen output at
 * origin (0, 0), so the "primary" is whichever Astal monitor sits there.
 * Returns `undefined` on the theoretical "no monitors" case.
 */
function findPrimaryMonitor(): AstalHyprland.Monitor | undefined {
  return hyprland.monitors.find((m) => m.x === 0 && m.y === 0);
}

/**
 * Locate the satellite monitor named by this host's config, if any.
 *
 * Matches on the monitor's verbatim `hyprctl monitors` description
 * (same string Nix wrote to `window-orchestrator.json`). Returns
 * `undefined` when no satellite is configured or the described monitor
 * is not currently attached.
 */
function findSatelliteMonitor(): AstalHyprland.Monitor | undefined {
  const desc = config.monitors?.satellite;
  if (!desc) return undefined;
  return hyprland.monitors.find((m) => m.description === desc);
}

/**
 * Count Firefox PiPs currently on the primary monitor, excluding the
 * given address.
 *
 * The excluded address is the client we're about to place — passing it
 * in lets the caller ask "does the primary already hold a PiP other
 * than this new one?" without racing against whether Astal's client
 * list already includes the newcomer.
 *
 * Placement keys on this count (not the total across all monitors) so
 * the corner-PiP invariant survives the user dragging a PiP off the
 * primary onto the satellite by hand.
 *
 * @param excludeAddress - Address to leave out of the count.
 * @param primary - The primary monitor to filter clients against.
 */
function otherPipsOnPrimary(
  excludeAddress: string,
  primary: AstalHyprland.Monitor,
): number {
  return hyprland.clients.filter(
    (c) =>
      isPipClient(c) &&
      c.address !== excludeAddress &&
      c.monitor?.id === primary.id,
  ).length;
}

interface FloatingPlacement {
  kind: "floating";
  monitor: AstalHyprland.Monitor;
  x: number;
  y: number;
}

interface TiledPlacement {
  kind: "tiled";
  monitor: AstalHyprland.Monitor;
}

type Placement = FloatingPlacement | TiledPlacement;

/**
 * Compute the target monitor and placement mode for a PiP given the
 * primary monitor and how many PiPs it already holds.
 *
 * Placement modes:
 *   floating — corner PiP on the primary; the app you actually watch,
 *     pinned so it stays visible across workspaces.
 *   tiled    — overflow PiPs on the satellite; Hyprland's layout engine
 *     splits the monitor between them so several stream perspectives fit
 *     without hand-placement.
 *
 * @param primary - The primary monitor.
 * @param pipsOnPrimary - Number of PiPs already on the primary (excluding
 *   the client we're about to place).
 */
function placementFor(
  primary: AstalHyprland.Monitor,
  pipsOnPrimary: number,
): Placement {
  const satellite = findSatelliteMonitor();

  if (pipsOnPrimary === 0) {
    return {
      kind: "floating",
      monitor: primary,
      x: primary.width - PIP_WIDTH - INSET,
      y: BAR_HEIGHT + INSET,
    };
  }

  if (satellite) {
    return { kind: "tiled", monitor: satellite };
  }

  return {
    kind: "floating",
    monitor: primary,
    x: primary.width - PIP_WIDTH - INSET - pipsOnPrimary * CASCADE_STEP,
    y: BAR_HEIGHT + INSET + pipsOnPrimary * CASCADE_STEP,
  };
}

/**
 * Handle a newly-mapped client, applying the PiP policy if it matches.
 *
 * Called by the orchestrator's `index.ts` on every `client-added` signal.
 * No-ops for non-PiP clients.
 *
 * The dispatches are collected as Lua strings and fired as one
 * `hyprctl --batch` call so Hyprland runs them in the order the code
 * lists — otherwise each dispatch is its own async subprocess and can
 * arrive at the compositor out of order (workspace ends up wrong, pin
 * flip races with float toggle, etc.).
 *
 * @param client - The client the signal delivered.
 */
export function handle(client: AstalHyprland.Client): void {
  if (!isPipClient(client)) return;

  const primary = findPrimaryMonitor();
  if (!primary) {
    console.error("window-orchestrator: no primary monitor for PiP");
    return;
  }

  const placement = placementFor(
    primary,
    otherPipsOnPrimary(client.address, primary),
  );

  const targetWorkspace = placement.monitor.activeWorkspace;
  const batch: string[] = [];

  if (client.workspace?.id !== targetWorkspace.id) {
    batch.push(
      buildMoveWindowToWorkspaceSilent(client.address, targetWorkspace.id),
    );
  }

  if (placement.kind === "floating") {
    // Order: float first so the size/move dispatches apply to a floating
    // window; global coords because the move dispatcher speaks in
    // compositor-global space, not monitor-relative.
    const globalX = placement.monitor.x + placement.x;
    const globalY = placement.monitor.y + placement.y;

    if (!client.floating) batch.push(buildToggleFloating(client.address));
    batch.push(buildResizeWindow(client.address, PIP_WIDTH, PIP_HEIGHT));
    batch.push(buildMoveWindowExact(client.address, globalX, globalY));
    if (!client.pinned) batch.push(buildTogglePinned(client.address));
  } else {
    // Tiled: undo any float/pin Firefox or a residual rule may have left
    // on the window, then let Hyprland's tiler split the satellite monitor
    // between however many overflow PiPs are open.
    if (client.floating) batch.push(buildToggleFloating(client.address));
    if (client.pinned) batch.push(buildTogglePinned(client.address));
  }

  sendBatch(batch);
}
