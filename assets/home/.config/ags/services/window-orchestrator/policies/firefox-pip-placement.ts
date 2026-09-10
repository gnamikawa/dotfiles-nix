// Pure placement engine for Firefox Picture-in-Picture windows.
//
// Owns geometry, promotion-candidate selection, and dispatch-batch shape.
// No compositor bindings — the adapter in `firefox-pip.ts` snapshots
// live AstalHyprland state into the plain data structures below and
// hands them to these functions, which return batched Lua dispatch
// strings. The split keeps every decision unit-testable with plain-
// object inputs.

import {
  buildMoveWindowExact,
  buildMoveWindowToWorkspaceSilent,
  buildResizeWindow,
  buildSetFloating,
  buildSetPinned,
  buildSetProp,
} from "../../../common/hypr-dispatch-builders";

export const PIP_WIDTH = 426;
export const PIP_HEIGHT = 240;

// Corner radius stamped on floating PiP windows via `setprop rounding`.
// The compositor default is 0 (see hypr/hyprland.lua — decoration is
// left at Hyprland's defaults), so per-window rounding is the only knob
// that will visibly round just the PiP without touching every other
// window. The value persists across drags/monitor moves for the life of
// the window, so applying it once at placement is enough.
export const PIP_ROUNDING = 20;

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
export const BAR_HEIGHT = 41;
export const INSET = 41;

// Step by which each overflow PiP cascades down-and-left from the primary
// corner when no satellite exists. Matches the laptop fallback path.
export const CASCADE_STEP = 40;

/**
 * The minimum client shape the placement engine consumes.
 *
 * Snapshotted from `AstalHyprland.Client` by the adapter so this module
 * never touches the live GI binding — makes selection and batch shape
 * fully unit-testable.
 */
export interface PipSnapshot {
  address: string;
  floating: boolean;
  monitorId: number;
  workspaceId: number | null;
}

/**
 * The minimum monitor shape the placement engine consumes. Position and
 * width give corner geometry; the active workspace id is where a moved
 * PiP lands.
 */
export interface MonitorSnapshot {
  id: number;
  x: number;
  y: number;
  width: number;
  activeWorkspaceId: number;
}

export interface FloatingPlacement {
  kind: "floating";
  monitor: MonitorSnapshot;
  x: number;
  y: number;
}

export interface TiledPlacement {
  kind: "tiled";
  monitor: MonitorSnapshot;
}

export type Placement = FloatingPlacement | TiledPlacement;

/**
 * Compute the target monitor and placement mode for a PiP given the
 * primary monitor, how many PiPs already sit on it, and whether a
 * satellite monitor is available.
 *
 * Placement modes:
 *   floating — corner PiP on the primary; the app you actually watch,
 *     pinned so it stays visible across workspaces.
 *   tiled    — overflow PiPs on the satellite; Hyprland's layout engine
 *     splits the monitor between them so several stream perspectives fit
 *     without hand-placement.
 *
 * @param primary - The primary monitor snapshot.
 * @param pipsOnPrimary - Number of PiPs already on the primary
 *   (excluding the one about to be placed).
 * @param satellite - The satellite monitor snapshot, or null when the
 *   current host has no overflow output.
 */
export function placementFor(
  primary: MonitorSnapshot,
  pipsOnPrimary: number,
  satellite: MonitorSnapshot | null,
): Placement {
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
 * Build the ordered `hyprctl --batch` dispatches that move a PiP client
 * into the given placement.
 *
 * Ordering rationale — the compositor evaluates each step against the
 * window's live state after the previous one, so the steps must chain
 * cleanly rather than race:
 *   float toggle FIRST, on the current workspace, so the window is
 *     floating before it moves — moving a tiled window into another
 *     workspace inserts it into that workspace's tile tree, and toggling
 *     float after the insert leaves Hyprland's internal tile state
 *     inconsistent enough that the toggle can be silently dropped
 *     (this is what left "recall" tiled on primary).
 *   workspace move next, so the placement dispatches below apply on the
 *     target workspace.
 *   resize + move exact to the final geometry.
 *   pin last, and rounding last — both are per-window props that
 *     survive workspace moves, so applying them at the end is fine.
 *
 * Rounding is stamped in BOTH branches: the floating branch wants the
 * large radius; the tiled branch wants 0 back because the satellite
 * split reads better with square edges (matches the tiler's own idea of
 * where the window edges are).
 *
 * @param client - Snapshot of the PiP to move.
 * @param placement - Target monitor + placement mode.
 */
export function buildPlacementBatch(
  client: PipSnapshot,
  placement: Placement,
): string[] {
  const batch: string[] = [];
  const targetWorkspaceId = placement.monitor.activeWorkspaceId;
  const targetsFloating = placement.kind === "floating";

  batch.push(buildSetFloating(client.address, targetsFloating));

  if (client.workspaceId !== targetWorkspaceId) {
    batch.push(
      buildMoveWindowToWorkspaceSilent(client.address, targetWorkspaceId),
    );
  }

  if (placement.kind === "floating") {
    // Global coords because the move dispatcher speaks in compositor-global
    // space, not monitor-relative.
    const globalX = placement.monitor.x + placement.x;
    const globalY = placement.monitor.y + placement.y;

    batch.push(buildResizeWindow(client.address, PIP_WIDTH, PIP_HEIGHT));
    batch.push(buildMoveWindowExact(client.address, globalX, globalY));
    batch.push(buildSetPinned(client.address, true));
    batch.push(buildSetProp(client.address, "rounding", String(PIP_ROUNDING)));
  } else {
    // Tiled: let Hyprland's tiler split the satellite between however many
    // overflow PiPs are open, undo any residual pin, and clear rounding so
    // the tile edges read square.
    batch.push(buildSetPinned(client.address, false));
    batch.push(buildSetProp(client.address, "rounding", "0"));
  }

  return batch;
}

/**
 * Selection result for a promotion request. `demote` is the PiP that
 * was already floating and is about to lose its corner slot — null when
 * no swap is needed (candidate was already floating, or there was no
 * floating PiP to displace).
 */
export interface SelectionResult {
  candidate: PipSnapshot;
  demote: PipSnapshot | null;
}

/**
 * Pick which PiP should be promoted into the primary corner slot.
 *
 * Priority (highest first):
 *   1. Focused PiP on any monitor.
 *   2. A PiP that is already floating.
 *   3. A PiP tiled on the primary monitor.
 *   4. A PiP tiled on the satellite (overflow) monitor.
 *
 * When the chosen candidate is not the currently-floating PiP, the
 * currently-floating one is returned as `demote` so the caller can swap
 * them in one batch. Returns null when there are no PiPs at all.
 *
 * Rationale for the priority: focus is the strongest user signal — if
 * you tabbed to a PiP, that's the one you want up front. Absent a focus
 * signal, a re-snap of the corner PiP is idempotent and cheap. The
 * tiled tiers fall through in monitor-locality order because a primary
 * tile is one hop away from becoming the corner PiP; a satellite tile
 * is two.
 *
 * @param pips - Every PiP client currently mapped in the compositor.
 * @param focusedAddress - Address of the compositor's focused client,
 *   or null when nothing is focused. Non-PiP focus is treated the same
 *   as no focus (the focus tier drops through).
 * @param primaryId - Monitor id of the primary output.
 */
export function selectPromotionCandidate(
  pips: PipSnapshot[],
  focusedAddress: string | null,
  primaryId: number,
): SelectionResult | null {
  if (pips.length === 0) return null;

  const floating = pips.find((p) => p.floating) ?? null;
  const focused =
    focusedAddress != null
      ? pips.find((p) => p.address === focusedAddress) ?? null
      : null;
  const tiledOnPrimary = pips.find(
    (p) => !p.floating && p.monitorId === primaryId,
  );
  const tiledElsewhere = pips.find(
    (p) => !p.floating && p.monitorId !== primaryId,
  );

  const candidate =
    focused ?? floating ?? tiledOnPrimary ?? tiledElsewhere ?? pips[0];

  const demote =
    floating && floating.address !== candidate.address ? floating : null;

  return { candidate, demote };
}

/**
 * Build the batch that promotes `candidate` into the corner slot,
 * demoting a currently-floating PiP into overflow tiling in the same
 * batch when they are different windows.
 *
 * Ordering: the promotion batch runs before the demotion so the corner
 * ends up owned by the newly-focused window at the moment the user
 * looks at the screen; the demoted window's move into the satellite
 * completes a frame later. Both halves reuse
 * {@link buildPlacementBatch}, so the "float before workspace-move"
 * ordering that fixed the "recall stayed tiled" race applies to both
 * sides of the swap. The tiled branch clearing `rounding = 0` on the
 * demoted window is why the "corners stay rounded after demotion" bug
 * disappears — with the swap in place, demotion always runs that branch.
 *
 * The demoted PiP is routed through {@link placementFor} with
 * `pipsOnPrimary = 1` (the just-promoted candidate), matching exactly
 * what the initial-placement path picks for a second-arrival PiP: tiled
 * on satellite when one exists, cascade-floating on the primary
 * otherwise.
 *
 * @param selection - Candidate + optional demotion target from
 *   {@link selectPromotionCandidate}.
 * @param primary - Primary monitor snapshot.
 * @param satellite - Satellite monitor snapshot, or null.
 */
export function buildResetBatch(
  selection: SelectionResult,
  primary: MonitorSnapshot,
  satellite: MonitorSnapshot | null,
): string[] {
  const promote: FloatingPlacement = {
    kind: "floating",
    monitor: primary,
    x: primary.width - PIP_WIDTH - INSET,
    y: BAR_HEIGHT + INSET,
  };

  const batch = buildPlacementBatch(selection.candidate, promote);

  if (selection.demote) {
    const demotePlacement = placementFor(primary, 1, satellite);
    batch.push(...buildPlacementBatch(selection.demote, demotePlacement));
  }

  return batch;
}
