// Firefox Picture-in-Picture placement policy — AstalHyprland adapter.
//
// Two entrypoints: `handle` runs on every `client-added` and gives a
// freshly-mapped PiP a sensible pose (corner if the corner is empty,
// satellite tile or cascade otherwise). `cyclePrimaryPip` fires on
// the Alt double-press and advances the full state-machine cycle
// (unfullscreen > sweep strays > demote/fullscreen > promote > swap).
//
// All decisions live in `firefox-pip-placement.ts` (pure, unit-
// testable). This module is the thin adapter that snapshots live
// AstalHyprland state into that pure module's inputs and dispatches
// the returned batch.

import AstalHyprland from "gi://AstalHyprland";
import { buildRestoreTail, sendBatch } from "../../../common/hypr-dispatch";
import { loadConfig } from "../config";
import {
  buildCycleBatch,
  buildPlacementBatch,
  computeCycle,
  placementFor,
  type CursorPosition,
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
    x: client.x,
    y: client.y,
    width: client.width,
    height: client.height,
    fullscreen: client.fullscreen !== AstalHyprland.Fullscreen.NONE,
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
    height: monitor.height,
    activeWorkspaceId: monitor.activeWorkspace.id,
  };
}

/**
 * Snapshot the compositor's cursor position, or null if unavailable.
 *
 * Astal exposes `cursor_position` as a `Position` object. Under rare
 * race conditions (very early startup) it can be missing; returning
 * null lets the cycle engine fall through the Hovered tier cleanly.
 */
function snapshotCursor(): CursorPosition | null {
  const pos = hyprland.cursor_position;
  if (!pos) return null;
  return { x: pos.x, y: pos.y };
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
 * @param excludeAddress - Address to leave out of the count.
 * @param primaryId - The primary monitor id to filter clients against.
 */
function otherPipsOnPrimary(excludeAddress: string, primaryId: number): number {
  return hyprland.clients.filter(
    (c) =>
      isPipClient(c) &&
      c.address !== excludeAddress &&
      c.monitor?.id === primaryId,
  ).length;
}

/**
 * Handle a newly-mapped client, applying the on-arrival PiP placement
 * if it matches.
 *
 * Called by the orchestrator's `index.ts` on every `client-added`
 * signal. No-ops for non-PiP clients.
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
 * Advance the PiP cycle one step.
 *
 * Called from `app.tsx` on a quick Alt double-press. Snapshots the
 * full compositor state (every PiP, both monitors, focus, cursor),
 * asks the pure state machine which arm to fire, and dispatches its
 * batch. A no-op when the cycle resolves to `noop`, so spamming the
 * key costs one hyprctl call per press.
 *
 * Appends a {@link buildRestoreTail} to the same batch: several
 * Hyprland dispatchers the cycle uses (notably `movetoworkspacesilent`
 * when the target ends up on a different monitor) warp the cursor and
 * shift focus onto the moved window as a side effect. The tail runs
 * atomically with the cycle so the user never sees the intermediate
 * state.
 */
export function cyclePrimaryPip(): void {
  const primary = findPrimaryMonitor();
  if (!primary) return;

  const primarySnap = snapshotMonitor(primary);
  const satellite = findSatelliteMonitor();
  const satelliteSnap = satellite ? snapshotMonitor(satellite) : null;

  const pips = hyprland.clients.filter(isPipClient).map(snapshotClient);
  const focusedAddress = hyprland.get_focused_client()?.address ?? null;
  const cursor = snapshotCursor();

  const cycle = computeCycle(
    pips,
    primarySnap,
    satelliteSnap,
    focusedAddress,
    cursor,
  );

  const batch = buildCycleBatch(cycle, primarySnap, satelliteSnap);
  if (batch.length === 0) return;
  sendBatch([...batch, ...buildRestoreTail(focusedAddress, cursor)]);
}
