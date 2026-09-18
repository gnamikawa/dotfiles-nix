import { describe, expect, test } from "vitest";

import {
  BAR_HEIGHT,
  INSET,
  type MonitorSnapshot,
  PIP_HEIGHT,
  PIP_WIDTH,
  type PipSnapshot,
  computeCycle,
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
 * that matter for the test at hand. Defaults produce a tiled Secondary
 * on the satellite output.
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
 * Build a Primary PiP — floating, on the primary output, at the exact
 * docked pose and canonical shape. Callers can override any single
 * field to test drift (e.g. an off-by-one Stray).
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

describe("computeCycle — noop and single-arm cases", () => {
  test("no pips → noop", () => {
    expect(computeCycle([], PRIMARY, SATELLITE, null, null)).toEqual({
      kind: "noop",
    });
  });

  test("only a Primary, no Secondary, satellite present → demotePrimary", () => {
    const p = primaryPip({ address: "0xa" });
    expect(computeCycle([p], PRIMARY, SATELLITE, null, null)).toEqual({
      kind: "demotePrimary",
      pip: p,
    });
  });

  test("only a Primary, no Secondary, satellite absent → fullscreenPrimary", () => {
    const p = primaryPip({ address: "0xa" });
    expect(computeCycle([p], PRIMARY, null, null, null)).toEqual({
      kind: "fullscreenPrimary",
      pip: p,
    });
  });

  test("no Primary, one Secondary → promoteSecondary", () => {
    const s = pip({ address: "0xa" });
    expect(computeCycle([s], PRIMARY, SATELLITE, null, null)).toEqual({
      kind: "promoteSecondary",
      pip: s,
    });
  });

  test("Primary + Secondary → swap", () => {
    const p = primaryPip({ address: "0xa" });
    const s = pip({ address: "0xb" });
    expect(computeCycle([p, s], PRIMARY, SATELLITE, null, null)).toEqual({
      kind: "swap",
      promote: s,
      demote: p,
    });
  });
});

describe("computeCycle — Stray arms", () => {
  test("one Stray, empty corner → sweep docks stray to corner", () => {
    const stray = pip({
      address: "0xa",
      floating: true,
      monitorId: PRIMARY.id,
      x: 200,
      y: 200,
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
    });
    expect(computeCycle([stray], PRIMARY, SATELLITE, null, null)).toEqual({
      kind: "sweep",
      dock: stray,
      tile: [],
    });
  });

  test("Stray + Primary → sweep tiles stray, primary untouched", () => {
    const primary = primaryPip({ address: "0xa" });
    const stray = pip({
      address: "0xb",
      floating: true,
      monitorId: PRIMARY.id,
      x: 300,
      y: 300,
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
    });
    expect(
      computeCycle([primary, stray], PRIMARY, SATELLITE, null, null),
    ).toEqual({
      kind: "sweep",
      dock: null,
      tile: [stray],
    });
  });

  test("multiple Strays, empty corner → dock best, tile the rest", () => {
    const upperLeft = pip({
      address: "0xa",
      floating: true,
      monitorId: PRIMARY.id,
      x: 100,
      y: 100,
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
    });
    const lowerRight = pip({
      address: "0xb",
      floating: true,
      monitorId: PRIMARY.id,
      x: 800,
      y: 500,
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
    });
    const cycle = computeCycle(
      [lowerRight, upperLeft],
      PRIMARY,
      SATELLITE,
      null,
      null,
    );
    expect(cycle.kind).toBe("sweep");
    if (cycle.kind !== "sweep") return;
    expect(cycle.dock).toBe(upperLeft);
    expect(cycle.tile).toEqual([lowerRight]);
  });

  test("a Primary drifted one pixel is treated as a Stray", () => {
    // Floating + on primary + canonical shape, but off-by-one x — the
    // exact-pose check rejects it. Empty corner → sweep docks it back.
    const drifted = pip({
      address: "0xa",
      floating: true,
      monitorId: PRIMARY.id,
      x: CORNER_X + 1,
      y: CORNER_Y,
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
    });
    const cycle = computeCycle([drifted], PRIMARY, SATELLITE, null, null);
    expect(cycle).toEqual({ kind: "sweep", dock: drifted, tile: [] });
  });
});

describe("computeCycle — Fullscreen arm", () => {
  test("Fullscreen PiP exists, no Primary → unfullscreen, no displaced", () => {
    const fs = pip({ address: "0xa", fullscreen: true });
    expect(computeCycle([fs], PRIMARY, SATELLITE, null, null)).toEqual({
      kind: "unfullscreen",
      pip: fs,
      displaced: null,
    });
  });

  test("Fullscreen PiP + Primary → unfullscreen displaces Primary", () => {
    const fs = pip({ address: "0xa", fullscreen: true });
    const primary = primaryPip({ address: "0xb" });
    expect(computeCycle([fs, primary], PRIMARY, SATELLITE, null, null)).toEqual(
      {
        kind: "unfullscreen",
        pip: fs,
        displaced: primary,
      },
    );
  });

  test("Fullscreen wins even when Strays exist", () => {
    const fs = pip({ address: "0xa", fullscreen: true });
    const stray = pip({
      address: "0xb",
      floating: true,
      monitorId: PRIMARY.id,
      x: 100,
      y: 100,
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
    });
    const cycle = computeCycle([fs, stray], PRIMARY, SATELLITE, null, null);
    expect(cycle.kind).toBe("unfullscreen");
  });
});

describe("computeCycle — pickBest priority tiers", () => {
  test("focused Secondary wins over an unfocused tiled first-in-order", () => {
    const first = pip({
      address: "0xa",
      monitorId: SATELLITE.id,
      x: SATELLITE.x,
      y: SATELLITE.y,
    });
    const second = pip({
      address: "0xb",
      monitorId: SATELLITE.id,
      x: SATELLITE.x + 800,
      y: SATELLITE.y,
    });
    const cycle = computeCycle(
      [first, second],
      PRIMARY,
      SATELLITE,
      second.address,
      null,
    );
    expect(cycle.kind).toBe("promoteSecondary");
    if (cycle.kind !== "promoteSecondary") return;
    expect(cycle.pip).toBe(second);
  });

  test("cursor over a Secondary wins over the tiled first-in-order (no focus)", () => {
    const first = pip({
      address: "0xa",
      monitorId: SATELLITE.id,
      x: SATELLITE.x,
      y: SATELLITE.y,
      width: 800,
      height: 720,
    });
    const second = pip({
      address: "0xb",
      monitorId: SATELLITE.id,
      x: SATELLITE.x + 800,
      y: SATELLITE.y,
      width: 800,
      height: 720,
    });
    const cycle = computeCycle([first, second], PRIMARY, SATELLITE, null, {
      x: SATELLITE.x + 1000,
      y: SATELLITE.y + 200,
    });
    expect(cycle.kind).toBe("promoteSecondary");
    if (cycle.kind !== "promoteSecondary") return;
    expect(cycle.pip).toBe(second);
  });

  test("no focus, no hover → L→R T→B: top row's leftmost wins", () => {
    const bottomLeft = pip({
      address: "0xa",
      monitorId: SATELLITE.id,
      x: SATELLITE.x,
      y: SATELLITE.y + 720,
    });
    const topLeft = pip({
      address: "0xb",
      monitorId: SATELLITE.id,
      x: SATELLITE.x,
      y: SATELLITE.y,
    });
    const topRight = pip({
      address: "0xc",
      monitorId: SATELLITE.id,
      x: SATELLITE.x + 800,
      y: SATELLITE.y,
    });
    const cycle = computeCycle(
      [bottomLeft, topRight, topLeft],
      PRIMARY,
      SATELLITE,
      null,
      null,
    );
    expect(cycle.kind).toBe("promoteSecondary");
    if (cycle.kind !== "promoteSecondary") return;
    expect(cycle.pip).toBe(topLeft);
  });

  test("focused non-pip drops through — hovered wins next", () => {
    const first = pip({
      address: "0xa",
      monitorId: SATELLITE.id,
      x: SATELLITE.x,
      y: SATELLITE.y,
      width: 800,
      height: 720,
    });
    const second = pip({
      address: "0xb",
      monitorId: SATELLITE.id,
      x: SATELLITE.x + 800,
      y: SATELLITE.y,
      width: 800,
      height: 720,
    });
    const cycle = computeCycle(
      [first, second],
      PRIMARY,
      SATELLITE,
      "0xnotapip",
      { x: SATELLITE.x + 900, y: SATELLITE.y + 100 },
    );
    expect(cycle.kind).toBe("promoteSecondary");
    if (cycle.kind !== "promoteSecondary") return;
    expect(cycle.pip).toBe(second);
  });
});
