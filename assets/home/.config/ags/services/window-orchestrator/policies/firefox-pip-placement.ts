// Pure state machine for Firefox Picture-in-Picture placement.
//
// Owns the cycle: given a snapshot of every PiP, the primary monitor,
// the (optional) media output, and the user's focus/cursor, decides
// what the next Alt double-press should do. No compositor bindings —
// the adapter in `firefox-pip.ts` snapshots live AstalHyprland state
// into the plain structures below and dispatches the returned batch.
//
// The cycle recognises four PiP states:
//   Primary PiP    — floating, on the primary output, at the exact
//                    top-right docked pose (position + shape).
//   Secondary PiP  — tiled anywhere. Sits on the media output when one
//                    is attached; otherwise participates in the primary
//                    output's active workspace tree.
//   Stray PiP      — floating and not the Primary. Anywhere.
//   Fullscreen PiP — Hyprland fullscreen mode is set.
//
// The arms below apply in priority order — the first whose precondition
// matches fires and no others.

import {
  buildMoveWindowExact,
  buildMoveWindowToWorkspaceSilent,
  buildResizeWindow,
  buildSetFloating,
  buildSetFullscreen,
  buildSetPinned,
} from "../../../common/hypr-dispatch-builders";

export const PIP_WIDTH = 426;
export const PIP_HEIGHT = 240;

// Rounding is a Hyprland dynamic-effect window rule scoped to
// `float = true` (see hypr/rules.lua) — the compositor re-evaluates it
// every time a PiP's `float` flips, so a manual `win+F` toggle or a
// tiler-driven re-tile lands on the right radius without ags needing to
// observe the change. Nothing to stamp from here.

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
// corner when no satellite exists and a new PiP arrives while the corner
// is occupied. Matches the laptop fallback path in initial placement —
// the cycle state machine tiles overflow PiPs on the workspace instead,
// but the on-arrival path still cascades so the first extra PiP is
// visible immediately without a re-tile.
export const CASCADE_STEP = 40;

/**
 * The minimum client shape the cycle engine consumes.
 *
 * Snapshotted from `AstalHyprland.Client` by the adapter so this module
 * never touches the live GI binding — makes the whole engine unit-
 * testable with plain objects.
 */
export interface PipSnapshot {
  address: string;
  floating: boolean;
  monitorId: number;
  workspaceId: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  fullscreen: boolean;
}

/**
 * The minimum monitor shape the cycle engine consumes. Position and
 * dimensions give corner geometry; the active workspace id is where a
 * moved PiP lands.
 */
export interface MonitorSnapshot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  activeWorkspaceId: number;
}

/**
 * Global-coordinate cursor position, or null when the compositor has
 * not reported one yet.
 */
export interface CursorPosition {
  x: number;
  y: number;
}

/**
 * The action the next double-press should perform, tagged by arm.
 *
 * Kinds map one-to-one onto the state-machine arms in `computeCycle`:
 *   noop              — no PiPs, or every arm's precondition failed.
 *   unfullscreen      — a Fullscreen PiP exists; un-fullscreen it back
 *                       to the primary corner, demoting any current
 *                       Primary in the same batch.
 *   sweep             — Strays exist; tile them all as Secondaries, and
 *                       when the corner is empty dock the best Stray to
 *                       the corner in the same batch.
 *   demotePrimary     — Primary exists, no Secondary, satellite present;
 *                       demote the Primary to a satellite tile.
 *   fullscreenPrimary — Primary exists, no Secondary, satellite absent;
 *                       fullscreen the Primary.
 *   promoteSecondary  — Only Secondaries exist; promote the best to the
 *                       corner.
 *   swap              — Primary and Secondaries both exist; promote the
 *                       best Secondary, demote the current Primary.
 */
export type Cycle =
  | { kind: "noop" }
  | {
      kind: "unfullscreen";
      pip: PipSnapshot;
      displaced: PipSnapshot | null;
    }
  | {
      kind: "sweep";
      dock: PipSnapshot | null;
      tile: PipSnapshot[];
    }
  | { kind: "demotePrimary"; pip: PipSnapshot }
  | { kind: "fullscreenPrimary"; pip: PipSnapshot }
  | { kind: "promoteSecondary"; pip: PipSnapshot }
  | { kind: "swap"; promote: PipSnapshot; demote: PipSnapshot };

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
 * Compute the on-arrival placement for a new PiP: corner PiP on the
 * primary when the corner is empty; overflow tiled on the satellite
 * when one exists; cascade-floated on the primary otherwise.
 *
 * Called from `handle` on `client-added` — the cycle state machine
 * owns Alt-double-press behaviour but a fresh window still needs an
 * immediate placement rather than sitting where Hyprland dropped it.
 *
 * @param primary - Primary monitor snapshot.
 * @param pipsOnPrimary - Existing PiPs on the primary (excluding the
 *   newly-added one).
 * @param satellite - Media output snapshot, or null when absent.
 */
export function placementFor(
  primary: MonitorSnapshot,
  pipsOnPrimary: number,
  satellite: MonitorSnapshot | null,
): Placement {
  if (pipsOnPrimary === 0) {
    const corner = primaryCorner(primary);
    return { kind: "floating", monitor: primary, x: corner.x, y: corner.y };
  }

  if (satellite) {
    return { kind: "tiled", monitor: satellite };
  }

  const corner = primaryCorner(primary);
  return {
    kind: "floating",
    monitor: primary,
    x: corner.x - pipsOnPrimary * CASCADE_STEP,
    y: corner.y + pipsOnPrimary * CASCADE_STEP,
  };
}

/**
 * Dispatch batch that realises an on-arrival placement for one PiP.
 *
 * Same float-before-workspace-move ordering as the cycle batches — see
 * the rationale on {@link dockBatch}. Tile paths unpin BEFORE
 * `float off` — see {@link tileBatch}.
 *
 * @param client - Newly-mapped PiP snapshot.
 * @param placement - Where to put it, from {@link placementFor}.
 */
export function buildPlacementBatch(
  client: PipSnapshot,
  placement: Placement,
): string[] {
  const batch: string[] = [];
  const targetWorkspaceId = placement.monitor.activeWorkspaceId;
  const targetsFloating = placement.kind === "floating";

  if (!targetsFloating) {
    batch.push(buildSetPinned(client.address, false));
  }

  batch.push(buildSetFloating(client.address, targetsFloating));

  if (client.workspaceId !== targetWorkspaceId) {
    batch.push(
      buildMoveWindowToWorkspaceSilent(client.address, targetWorkspaceId),
    );
  }

  if (placement.kind === "floating") {
    batch.push(buildResizeWindow(client.address, PIP_WIDTH, PIP_HEIGHT));
    batch.push(buildMoveWindowExact(client.address, placement.x, placement.y));
    batch.push(buildSetPinned(client.address, true));
  }

  return batch;
}

/**
 * The exact top-right docked pose for the primary corner PiP.
 *
 * Returned as global coordinates so callers can compare against a
 * `PipSnapshot`'s live `x`/`y` directly.
 *
 * @param primary - The primary monitor snapshot.
 */
function primaryCorner(primary: MonitorSnapshot): {
  x: number;
  y: number;
} {
  return {
    x: primary.x + primary.width - PIP_WIDTH - INSET,
    y: primary.y + BAR_HEIGHT + INSET,
  };
}

/**
 * Test whether a PiP snapshot matches the Primary PiP definition:
 * floating, on the primary output, at the exact top-right docked pose,
 * at the canonical PiP shape.
 *
 * Exact-equality check by design — the compositor rounds our integer
 * inputs, so any pose the code produces round-trips cleanly. Anything
 * that comes back different is a real drift (user drag, wrong host
 * pose, etc.), which is exactly the Stray signal the cycle wants.
 *
 * @param pip - PiP snapshot to test.
 * @param primary - Primary monitor snapshot to compare against.
 */
function isPrimaryPose(pip: PipSnapshot, primary: MonitorSnapshot): boolean {
  if (!pip.floating) return false;
  if (pip.monitorId !== primary.id) return false;
  const corner = primaryCorner(primary);
  return (
    pip.x === corner.x &&
    pip.y === corner.y &&
    pip.width === PIP_WIDTH &&
    pip.height === PIP_HEIGHT
  );
}

/**
 * Test whether a global-coordinate point falls inside a PiP's rect.
 *
 * @param pip - PiP snapshot whose rect to test.
 * @param cursor - Point in global compositor coordinates.
 */
function rectContains(pip: PipSnapshot, cursor: CursorPosition): boolean {
  return (
    cursor.x >= pip.x &&
    cursor.x < pip.x + pip.width &&
    cursor.y >= pip.y &&
    cursor.y < pip.y + pip.height
  );
}

/**
 * Pick the best candidate from a non-empty pool under the priority
 * order Selected > Hovered > left-to-right, top-to-bottom.
 *
 * Selected is the compositor's focused client when it happens to be in
 * the pool. Hovered is the pool member whose rect contains the cursor.
 * The L→R, T→B fallback sorts by `(y, x)` and picks the first — which
 * gives a natural rotation across Hyprland's dwindle tile layout,
 * since the demoted PiP appears at the tail of the tile list and the
 * head advances past it on the next press.
 *
 * @param pool - Candidates, at least one.
 * @param focusedAddress - Compositor's focused client address, or null.
 * @param cursor - Cursor position, or null when unreported.
 */
function pickBest(
  pool: PipSnapshot[],
  focusedAddress: string | null,
  cursor: CursorPosition | null,
): PipSnapshot {
  const selected =
    focusedAddress !== null
      ? (pool.find((p) => p.address === focusedAddress) ?? null)
      : null;
  if (selected) return selected;

  const hovered = cursor
    ? (pool.find((p) => rectContains(p, cursor)) ?? null)
    : null;
  if (hovered) return hovered;

  return [...pool].sort((a, b) => a.y - b.y || a.x - b.x)[0]!;
}

/**
 * Decide which arm of the cycle to fire.
 *
 * Classification pass — every PiP is exactly one of:
 *   Fullscreen (fullscreen flag set),
 *   Primary    (floating + on primary + at docked pose),
 *   Stray      (floating, none of the above),
 *   Secondary  (tiled, none of the above).
 *
 * Arm priority (top first): unfullscreen > sweep > demotePrimary /
 * fullscreenPrimary > promoteSecondary > swap > noop.
 *
 * @param pips - Every Firefox PiP client currently mapped.
 * @param primary - Primary monitor snapshot.
 * @param satellite - Media output snapshot, or null when absent.
 * @param focusedAddress - Compositor's focused client address, or null.
 * @param cursor - Cursor position in global compositor coordinates, or
 *   null when unreported.
 */
export function computeCycle(
  pips: PipSnapshot[],
  primary: MonitorSnapshot,
  satellite: MonitorSnapshot | null,
  focusedAddress: string | null,
  cursor: CursorPosition | null,
): Cycle {
  const fullscreens = pips.filter((p) => p.fullscreen);
  const nonFullscreen = pips.filter((p) => !p.fullscreen);
  const primaryPip =
    nonFullscreen.find((p) => isPrimaryPose(p, primary)) ?? null;
  const strays = nonFullscreen.filter((p) => p.floating && p !== primaryPip);
  const secondaries = nonFullscreen.filter((p) => !p.floating);

  if (fullscreens.length > 0) {
    const pip = pickBest(fullscreens, focusedAddress, cursor);
    return { kind: "unfullscreen", pip, displaced: primaryPip };
  }

  if (strays.length > 0) {
    if (primaryPip === null) {
      const dock = pickBest(strays, focusedAddress, cursor);
      const tile = strays.filter((s) => s.address !== dock.address);
      return { kind: "sweep", dock, tile };
    }
    return { kind: "sweep", dock: null, tile: strays };
  }

  if (primaryPip !== null && secondaries.length === 0) {
    return satellite !== null
      ? { kind: "demotePrimary", pip: primaryPip }
      : { kind: "fullscreenPrimary", pip: primaryPip };
  }

  if (primaryPip === null && secondaries.length > 0) {
    const pip = pickBest(secondaries, focusedAddress, cursor);
    return { kind: "promoteSecondary", pip };
  }

  if (primaryPip !== null && secondaries.length > 0) {
    const promote = pickBest(secondaries, focusedAddress, cursor);
    return { kind: "swap", promote, demote: primaryPip };
  }

  return { kind: "noop" };
}

/**
 * Dispatch batch that promotes a PiP into the primary corner slot.
 *
 * Ordering matters — the compositor evaluates each step against the
 * window's live state after the previous one, so the steps must chain
 * cleanly:
 *   float toggle FIRST, on the current workspace, so the window is
 *     floating before it moves — moving a tiled window into another
 *     workspace inserts it into that workspace's tile tree, and toggling
 *     float after the insert leaves Hyprland's internal tile state
 *     inconsistent enough that the toggle can be silently dropped.
 *   workspace move next, so the placement dispatches below apply on the
 *     target workspace.
 *   resize + move exact to the final geometry.
 *   pin last — a per-window prop that survives workspace moves, so
 *     applying it at the end is fine.
 *
 * @param pip - PiP snapshot to dock.
 * @param primary - Primary monitor snapshot.
 */
function dockBatch(pip: PipSnapshot, primary: MonitorSnapshot): string[] {
  const batch: string[] = [];
  const corner = primaryCorner(primary);

  batch.push(buildSetFloating(pip.address, true));
  if (pip.workspaceId !== primary.activeWorkspaceId) {
    batch.push(
      buildMoveWindowToWorkspaceSilent(pip.address, primary.activeWorkspaceId),
    );
  }
  batch.push(buildResizeWindow(pip.address, PIP_WIDTH, PIP_HEIGHT));
  batch.push(buildMoveWindowExact(pip.address, corner.x, corner.y));
  batch.push(buildSetPinned(pip.address, true));
  return batch;
}

/**
 * Dispatch batch that tiles a PiP as a Secondary.
 *
 * On satellite-present hosts the PiP lands on the media output's
 * active workspace; on satellite-absent hosts it drops into the
 * primary output's active workspace tree. Unpins so the tiler owns it.
 *
 * Ordering matters: unpin FIRST, then `float off`. Hyprland's `pin`
 * dispatch only qualifies for floating windows and emits
 * `warning: Window does not qualify to be pinned` when it lands on a
 * tiled one. Since every caller of this function passes a currently-
 * floating PiP (strays, Primary being demoted), the unpin lands while
 * the window is still floating and dispatches cleanly.
 *
 * @param pip - PiP snapshot to tile.
 * @param primary - Primary monitor snapshot.
 * @param satellite - Media output snapshot, or null when absent.
 */
function tileBatch(
  pip: PipSnapshot,
  primary: MonitorSnapshot,
  satellite: MonitorSnapshot | null,
): string[] {
  const batch: string[] = [];
  const targetWorkspace =
    satellite !== null
      ? satellite.activeWorkspaceId
      : primary.activeWorkspaceId;

  batch.push(buildSetPinned(pip.address, false));
  batch.push(buildSetFloating(pip.address, false));
  if (pip.workspaceId !== targetWorkspace) {
    batch.push(buildMoveWindowToWorkspaceSilent(pip.address, targetWorkspace));
  }
  return batch;
}

/**
 * Build the ordered `hyprctl --batch` dispatches that realise a cycle.
 *
 * Every arm's ordering rationale — promotions before demotions on
 * swaps so the corner is correct at the frame the user sees, and the
 * per-window step order documented on `dockBatch`.
 *
 * @param cycle - Decision from {@link computeCycle}.
 * @param primary - Primary monitor snapshot.
 * @param satellite - Media output snapshot, or null when absent.
 */
export function buildCycleBatch(
  cycle: Cycle,
  primary: MonitorSnapshot,
  satellite: MonitorSnapshot | null,
): string[] {
  switch (cycle.kind) {
    case "noop":
      return [];

    case "unfullscreen": {
      const batch: string[] = [];
      batch.push(buildSetFullscreen(cycle.pip.address, false));
      batch.push(...dockBatch(cycle.pip, primary));
      if (cycle.displaced) {
        batch.push(...tileBatch(cycle.displaced, primary, satellite));
      }
      return batch;
    }

    case "sweep": {
      const batch: string[] = [];
      for (const stray of cycle.tile) {
        batch.push(...tileBatch(stray, primary, satellite));
      }
      if (cycle.dock) {
        batch.push(...dockBatch(cycle.dock, primary));
      }
      return batch;
    }

    case "demotePrimary":
      return tileBatch(cycle.pip, primary, satellite);

    case "fullscreenPrimary":
      return [buildSetFullscreen(cycle.pip.address, true)];

    case "promoteSecondary":
      return dockBatch(cycle.pip, primary);

    case "swap": {
      const batch: string[] = [];
      batch.push(...dockBatch(cycle.promote, primary));
      batch.push(...tileBatch(cycle.demote, primary, satellite));
      return batch;
    }
  }
}
