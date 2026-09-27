import { describe, expect, test } from "vitest";

import {
  BAR_HEIGHT,
  INSET,
  type MonitorSnapshot,
  PIP_HEIGHT,
  PIP_WIDTH,
  type PipSnapshot,
  buildCycleBatch,
  buildPlacementBatch,
  placementFor,
} from "../../assets/home/.config/ags/services/window-orchestrator/policies/firefox-pip-placement.ts";

const PRIMARY: MonitorSnapshot = {
  id: 1,
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  activeWorkspaceId: 10,
};

const SATELLITE: MonitorSnapshot = {
  id: 2,
  x: 1920,
  y: 0,
  width: 2560,
  height: 1440,
  activeWorkspaceId: 20,
};

const CORNER_X = PRIMARY.width - PIP_WIDTH - INSET;
const CORNER_Y = BAR_HEIGHT + INSET;

/**
 * Build a PipSnapshot with sensible defaults; only spell out the fields
 * that matter for the test at hand.
 */
function pip(
  overrides: Partial<PipSnapshot> & { address: string },
): PipSnapshot {
  return {
    floating: false,
    monitorId: SATELLITE.id,
    workspaceId: SATELLITE.activeWorkspaceId,
    x: SATELLITE.x,
    y: SATELLITE.y,
    width: 800,
    height: 720,
    fullscreen: false,
    ...overrides,
  };
}

/**
 * Build a Primary PiP — floating, on primary, at the exact docked pose.
 */
function primaryPip(
  overrides: Partial<PipSnapshot> & { address: string },
): PipSnapshot {
  return {
    floating: true,
    monitorId: PRIMARY.id,
    workspaceId: PRIMARY.activeWorkspaceId,
    x: CORNER_X,
    y: CORNER_Y,
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    fullscreen: false,
    ...overrides,
  };
}

describe("buildCycleBatch — arm shapes", () => {
  test("noop → empty batch", () => {
    expect(buildCycleBatch({ kind: "noop" }, PRIMARY, SATELLITE)).toEqual([]);
  });

  test("fullscreenPrimary → single set-fullscreen dispatch", () => {
    const p = primaryPip({ address: "0xa" });
    const batch = buildCycleBatch(
      { kind: "fullscreenPrimary", pip: p },
      PRIMARY,
      null,
    );
    expect(batch).toEqual([
      expect.stringContaining(`hl.dsp.window.fullscreen`),
    ]);
    expect(batch[0]).toContain(`action = "set"`);
    expect(batch[0]).toContain(`mode = "fullscreen"`);
    expect(batch[0]).toContain(`address:0xa`);
  });

  test("demotePrimary → unpin first, then float off, workspace move to satellite", () => {
    // Hyprland's `pin` dispatch only accepts floating windows and warns
    // ("Window does not qualify to be pinned") on tiled ones — so the unpin
    // must fire BEFORE `float off`, while the window is still floating.
    const p = primaryPip({ address: "0xa" });
    const batch = buildCycleBatch(
      { kind: "demotePrimary", pip: p },
      PRIMARY,
      SATELLITE,
    );
    const unpinIdx = batch.findIndex(
      (l) => l.includes(`hl.dsp.window.pin`) && l.includes(`action = "off"`),
    );
    const floatOffIdx = batch.findIndex(
      (l) => l.includes(`hl.dsp.window.float`) && l.includes(`action = "off"`),
    );
    expect(unpinIdx).toBeGreaterThanOrEqual(0);
    expect(floatOffIdx).toBeGreaterThan(unpinIdx);
    expect(
      batch.some((l) =>
        l.includes(`workspace = ${SATELLITE.activeWorkspaceId}`),
      ),
    ).toBe(true);
  });

  test("promoteSecondary → float on, workspace move to primary, resize + move-exact + pin on", () => {
    const s = pip({ address: "0xa" });
    const batch = buildCycleBatch(
      { kind: "promoteSecondary", pip: s },
      PRIMARY,
      SATELLITE,
    );
    expect(batch[0]).toContain(`action = "on"`);
    expect(
      batch.some((l) => l.includes(`workspace = ${PRIMARY.activeWorkspaceId}`)),
    ).toBe(true);
    expect(
      batch.some((l) =>
        l.includes(
          `hl.dsp.window.resize({ window = "address:0xa", x = ${PIP_WIDTH}, y = ${PIP_HEIGHT} })`,
        ),
      ),
    ).toBe(true);
    expect(
      batch.some((l) =>
        l.includes(
          `hl.dsp.window.move({ window = "address:0xa", x = ${CORNER_X}, y = ${CORNER_Y}, relative = false })`,
        ),
      ),
    ).toBe(true);
    expect(
      batch.some(
        (l) => l.includes(`hl.dsp.window.pin`) && l.includes(`action = "on"`),
      ),
    ).toBe(true);
  });

  test("swap → promote's dispatches appear before demote's", () => {
    const promote = pip({ address: "0xnew" });
    const demote = primaryPip({ address: "0xold" });
    const batch = buildCycleBatch(
      { kind: "swap", promote, demote },
      PRIMARY,
      SATELLITE,
    );
    const firstPromote = batch.findIndex((l) => l.includes(promote.address));
    const firstDemote = batch.findIndex((l) => l.includes(demote.address));
    expect(firstPromote).toBeGreaterThanOrEqual(0);
    expect(firstDemote).toBeGreaterThan(firstPromote);
    // Demote lands as tiled on satellite: unpin, float off, workspace move
    // (unpin comes first so the pin dispatch fires while the window is
    // still floating — Hyprland warns on pin against tiled windows).
    const demoteLines = batch.filter((l) => l.includes(demote.address));
    expect(demoteLines[0]).toContain(`hl.dsp.window.pin`);
    expect(demoteLines[0]).toContain(`action = "off"`);
    expect(
      demoteLines.some((l) =>
        l.includes(`workspace = ${SATELLITE.activeWorkspaceId}`),
      ),
    ).toBe(true);
  });

  test("sweep with dock + tiles → tiles fire first, then dock", () => {
    const primaryDock = pip({
      address: "0xdock",
      floating: true,
      monitorId: PRIMARY.id,
      x: 200,
      y: 200,
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
    });
    const straySat = pip({
      address: "0xstray",
      floating: true,
      monitorId: SATELLITE.id,
      x: SATELLITE.x + 500,
      y: SATELLITE.y + 500,
    });
    const batch = buildCycleBatch(
      { kind: "sweep", dock: primaryDock, tile: [straySat] },
      PRIMARY,
      SATELLITE,
    );
    const firstStray = batch.findIndex((l) => l.includes(straySat.address));
    const firstDock = batch.findIndex((l) => l.includes(primaryDock.address));
    expect(firstStray).toBeGreaterThanOrEqual(0);
    expect(firstDock).toBeGreaterThan(firstStray);
  });

  test("sweep on satellite-absent host → tiles land on primary's active workspace", () => {
    const stray = pip({
      address: "0xa",
      floating: true,
      monitorId: PRIMARY.id,
      x: 200,
      y: 200,
    });
    const batch = buildCycleBatch(
      { kind: "sweep", dock: null, tile: [stray] },
      PRIMARY,
      null,
    );
    expect(batch[0]).toContain(`action = "off"`);
    expect(
      batch.some((l) => l.includes(`workspace = ${PRIMARY.activeWorkspaceId}`)),
    ).toBe(true);
  });

  test("unfullscreen with no displaced → unset then dock", () => {
    const fs = pip({ address: "0xa", fullscreen: true });
    const batch = buildCycleBatch(
      { kind: "unfullscreen", pip: fs, displaced: null },
      PRIMARY,
      SATELLITE,
    );
    expect(batch[0]).toContain(`hl.dsp.window.fullscreen`);
    expect(batch[0]).toContain(`action = "unset"`);
    expect(
      batch.some((l) =>
        l.includes(
          `hl.dsp.window.move({ window = "address:0xa", x = ${CORNER_X}, y = ${CORNER_Y}, relative = false })`,
        ),
      ),
    ).toBe(true);
    expect(batch.every((l) => l.includes(fs.address))).toBe(true);
  });

  test("unfullscreen with displaced → unset + dock target, then tile the displaced Primary", () => {
    const fs = pip({ address: "0xnew", fullscreen: true });
    const displaced = primaryPip({ address: "0xold" });
    const batch = buildCycleBatch(
      { kind: "unfullscreen", pip: fs, displaced },
      PRIMARY,
      SATELLITE,
    );
    const firstFs = batch.findIndex((l) => l.includes(fs.address));
    const firstDisplaced = batch.findIndex((l) =>
      l.includes(displaced.address),
    );
    expect(firstFs).toBeGreaterThanOrEqual(0);
    expect(firstDisplaced).toBeGreaterThan(firstFs);
    const displacedLines = batch.filter((l) => l.includes(displaced.address));
    // Displaced Primary tiles as Secondary on the satellite. Unpin fires
    // first, then `float off` — see the ordering rationale on
    // "demotePrimary".
    expect(displacedLines[0]).toContain(`hl.dsp.window.pin`);
    expect(displacedLines[0]).toContain(`action = "off"`);
    expect(
      displacedLines.some((l) =>
        l.includes(`workspace = ${SATELLITE.activeWorkspaceId}`),
      ),
    ).toBe(true);
  });
});

describe("initial placement (on client-added)", () => {
  test("first PiP with an empty corner → floating at corner", () => {
    const placement = placementFor(PRIMARY, 0, SATELLITE);
    expect(placement).toEqual({
      kind: "floating",
      monitor: PRIMARY,
      x: CORNER_X,
      y: CORNER_Y,
    });
  });

  test("second PiP with satellite present → tiled on satellite", () => {
    const placement = placementFor(PRIMARY, 1, SATELLITE);
    expect(placement).toEqual({ kind: "tiled", monitor: SATELLITE });
  });

  test("second PiP on satellite-absent host → cascade floating on primary", () => {
    const placement = placementFor(PRIMARY, 1, null);
    expect(placement.kind).toBe("floating");
    if (placement.kind !== "floating") return;
    expect(placement.x).toBeLessThan(CORNER_X);
    expect(placement.y).toBeGreaterThan(CORNER_Y);
  });

  test("floating placement batch emits float on, resize, move-exact, pin on", () => {
    const client = pip({
      address: "0xa",
      floating: false,
      workspaceId: PRIMARY.activeWorkspaceId,
    });
    const batch = buildPlacementBatch(client, {
      kind: "floating",
      monitor: PRIMARY,
      x: CORNER_X,
      y: CORNER_Y,
    });
    expect(batch[0]).toContain(`action = "on"`);
    expect(
      batch.some((l) =>
        l.includes(
          `hl.dsp.window.resize({ window = "address:0xa", x = ${PIP_WIDTH}, y = ${PIP_HEIGHT} })`,
        ),
      ),
    ).toBe(true);
    expect(
      batch.some((l) =>
        l.includes(
          `hl.dsp.window.move({ window = "address:0xa", x = ${CORNER_X}, y = ${CORNER_Y}, relative = false })`,
        ),
      ),
    ).toBe(true);
    expect(
      batch.some(
        (l) => l.includes(`hl.dsp.window.pin`) && l.includes(`action = "on"`),
      ),
    ).toBe(true);
  });

  test("tiled placement batch emits unpin, then float off, then workspace move", () => {
    // Unpin fires before `float off` so the pin dispatch runs against a
    // still-floating window — Hyprland warns on pin dispatches against
    // tiled windows.
    const client = pip({
      address: "0xa",
      floating: true,
      monitorId: PRIMARY.id,
      workspaceId: PRIMARY.activeWorkspaceId,
    });
    const batch = buildPlacementBatch(client, {
      kind: "tiled",
      monitor: SATELLITE,
    });
    const unpinIdx = batch.findIndex(
      (l) => l.includes(`hl.dsp.window.pin`) && l.includes(`action = "off"`),
    );
    const floatOffIdx = batch.findIndex(
      (l) => l.includes(`hl.dsp.window.float`) && l.includes(`action = "off"`),
    );
    expect(unpinIdx).toBeGreaterThanOrEqual(0);
    expect(floatOffIdx).toBeGreaterThan(unpinIdx);
    expect(
      batch.some((l) =>
        l.includes(`workspace = ${SATELLITE.activeWorkspaceId}`),
      ),
    ).toBe(true);
  });
});
