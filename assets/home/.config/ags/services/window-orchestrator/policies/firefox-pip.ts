// Firefox Picture-in-Picture placement policy — AstalHyprland adapter.
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
//
// All geometry and batch-shape decisions live in
// `firefox-pip-placement.ts` (pure, unit-testable). This module is the
// thin adapter that snapshots live AstalHyprland state into that pure
// module's inputs and dispatches the returned batch.

import AstalHyprland from "gi://AstalHyprland";
import { sendBatch } from "../../../common/hypr-dispatch";
import { loadConfig } from "../config";
import {
  buildPlacementBatch,
  buildResetBatch,
  placementFor,
  selectPromotionCandidate,
  type MonitorSnapshot,
  type PipSnapshot,
} from "./firefox-pip-placement";

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
 * Snapshot an Astal client into the pure placement module's shape.
 *
 * Strips the live-binding surface down to the exact fields the pure
 * module consumes, so behaviour under test matches behaviour at runtime.
 *
 * @param client - Live Astal client.
 */
function snapshotClient(client: AstalHyprland.Client): PipSnapshot {
  return {
    address: client.address,
    floating: client.floating,
    monitorId: client.monitor?.id ?? -1,
    workspaceId: client.workspace?.id ?? null,
  };
}

/**
 * Snapshot an Astal monitor into the pure placement module's shape.
 *
 * @param monitor - Live Astal monitor.
 */
function snapshotMonitor(monitor: AstalHyprland.Monitor): MonitorSnapshot {
  return {
    id: monitor.id,
    x: monitor.x,
    y: monitor.y,
    width: monitor.width,
    activeWorkspaceId: monitor.activeWorkspace.id,
  };
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
 * @param primaryId - The primary monitor id to filter clients against.
 */
function otherPipsOnPrimary(
  excludeAddress: string,
  primaryId: number,
): number {
  return hyprland.clients.filter(
    (c) =>
      isPipClient(c) &&
      c.address !== excludeAddress &&
      c.monitor?.id === primaryId,
  ).length;
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

  const primarySnap = snapshotMonitor(primary);
  const satellite = findSatelliteMonitor();
  const satelliteSnap = satellite ? snapshotMonitor(satellite) : null;
  const placement = placementFor(
    primarySnap,
    otherPipsOnPrimary(client.address, primary.id),
    satelliteSnap,
  );

  sendBatch(buildPlacementBatch(snapshotClient(client), placement));
}

/**
 * Snap a PiP into the primary corner slot.
 *
 * Called from `app.tsx` on a quick Alt double-press. Selects a candidate
 * via {@link selectPromotionCandidate} (focused > already-floating >
 * tiled-on-primary > tiled-on-satellite), and if that pick displaces an
 * existing floating PiP, demotes it into overflow in the same batch. A
 * no-op when no PiP exists. Idempotent when the current corner PiP is
 * the selection, so spamming the reset costs nothing.
 */
export function resetPrimaryPip(): void {
  const primary = findPrimaryMonitor();
  if (!primary) return;

  const focusedAddress = hyprland.get_focused_client()?.address ?? null;
  const pips = hyprland.clients.filter(isPipClient).map(snapshotClient);

  const selection = selectPromotionCandidate(pips, focusedAddress, primary.id);
  if (!selection) return;

  const primarySnap = snapshotMonitor(primary);
  const satellite = findSatelliteMonitor();
  const satelliteSnap = satellite ? snapshotMonitor(satellite) : null;

  sendBatch(buildResetBatch(selection, primarySnap, satelliteSnap));
}
