import { describe, expect, test } from "vitest";

import {
  BAR_HEIGHT,
  INSET,
  type MonitorSnapshot,
  PIP_HEIGHT,
  PIP_WIDTH,
  type PipSnapshot,
  buildResetBatch,
} from "../../assets/home/.config/ags/services/window-orchestrator/policies/firefox-pip-placement.ts";

const PRIMARY: MonitorSnapshot = {
  id: 1,
  x: 0,
  y: 0,
  width: 1920,
  activeWorkspaceId: 10,
};

const SATELLITE: MonitorSnapshot = {
  id: 2,
  x: 1920,
  y: 0,
  width: 2560,
  activeWorkspaceId: 20,
};

/**
 * Build a PipSnapshot with sensible defaults; only spell out the fields
 * that matter for the test at hand.
 */
function pip(
  overrides: Partial<PipSnapshot> & { address: string },
): PipSnapshot {
  return {
    floating: false,
    monitorId: PRIMARY.id,
    workspaceId: PRIMARY.activeWorkspaceId,
    ...overrides,
  };
}

describe("buildResetBatch", () => {
  test("candidate already floating on primary → single re-snap batch, no demotion", () => {
    const candidate = pip({
      address: "0xa",
      floating: true,
      workspaceId: PRIMARY.activeWorkspaceId,
    });
    const batch = buildResetBatch(
      { candidate, demote: null },
      PRIMARY,
      SATELLITE,
    );

    // Every dispatch in the batch targets the same window.
    expect(batch.every((line) => line.includes(candidate.address))).toBe(true);

    // Floating stays on, workspace is already the target so no move,
    // resize + move-exact + pin land in order. Rounding is owned by the
    // compositor rule in hypr/rules.lua, so no setprop shows up here.
    const expectedX = PRIMARY.x + PRIMARY.width - PIP_WIDTH - INSET;
    const expectedY = PRIMARY.y + BAR_HEIGHT + INSET;
    expect(batch).toEqual([
      expect.stringContaining(`action = "on"`),
      expect.stringContaining(
        `hl.dsp.window.resize({ window = "address:0xa", x = ${PIP_WIDTH}, y = ${PIP_HEIGHT} })`,
      ),
      expect.stringContaining(
        `hl.dsp.window.move({ window = "address:0xa", x = ${expectedX}, y = ${expectedY}, relative = false })`,
      ),
      expect.stringContaining(`hl.dsp.window.pin`),
    ]);
    expect(batch.some((line) => line.includes(`prop = "rounding"`))).toBe(
      false,
    );
  });

  test("candidate on different workspace than target → workspace-move dispatch is inserted", () => {
    const candidate = pip({
      address: "0xa",
      floating: false,
      workspaceId: SATELLITE.activeWorkspaceId, // not on primary's active ws
    });
    const batch = buildResetBatch(
      { candidate, demote: null },
      PRIMARY,
      SATELLITE,
    );

    // First float-on, then move-to-workspace, then resize/move/pin.
    expect(batch[0]).toContain(`hl.dsp.window.float`);
    expect(batch[0]).toContain(`action = "on"`);
    expect(batch[1]).toContain(
      `hl.dsp.window.move({ window = "address:0xa", workspace = ${PRIMARY.activeWorkspaceId}, silent = true })`,
    );
  });

  test("focused satellite promotes, previous floating demotes into satellite tile", () => {
    const promoted = pip({
      address: "0xnew",
      floating: false,
      monitorId: SATELLITE.id,
      workspaceId: SATELLITE.activeWorkspaceId,
    });
    const demoted = pip({
      address: "0xold",
      floating: true,
      monitorId: PRIMARY.id,
      workspaceId: PRIMARY.activeWorkspaceId,
    });

    const batch = buildResetBatch(
      { candidate: promoted, demote: demoted },
      PRIMARY,
      SATELLITE,
    );

    // Promotion of the new window comes first; demotion of the old floater
    // appears after in the same batch so Hyprland runs them in order.
    const firstPromotedIdx = batch.findIndex((l) =>
      l.includes(promoted.address),
    );
    const firstDemotedIdx = batch.findIndex((l) => l.includes(demoted.address));
    expect(firstPromotedIdx).toBeGreaterThanOrEqual(0);
    expect(firstDemotedIdx).toBeGreaterThan(firstPromotedIdx);

    // Promotion floats-on + moves to primary corner.
    expect(batch[0]).toContain(promoted.address);
    expect(batch[0]).toContain(`action = "on"`);

    // Demotion floats-off (tiled satellite), moves to satellite workspace,
    // and unpins. Rounding rides on the compositor rule keyed on `float`
    // so no `setprop rounding` shows up in either half of the batch.
    const demotedLines = batch.filter((l) => l.includes(demoted.address));
    expect(demotedLines[0]).toContain(`hl.dsp.window.float`);
    expect(demotedLines[0]).toContain(`action = "off"`);
    expect(
      demotedLines.some((l) =>
        l.includes(`workspace = ${SATELLITE.activeWorkspaceId}`),
      ),
    ).toBe(true);
    expect(
      demotedLines.some(
        (l) => l.includes(`hl.dsp.window.pin`) && l.includes(`action = "off"`),
      ),
    ).toBe(true);
    expect(batch.some((l) => l.includes(`prop = "rounding"`))).toBe(false);
  });

  test("no satellite → demoted PiP falls back to cascade-floating on primary", () => {
    const promoted = pip({
      address: "0xnew",
      floating: false,
      workspaceId: PRIMARY.activeWorkspaceId,
    });
    const demoted = pip({
      address: "0xold",
      floating: true,
      workspaceId: PRIMARY.activeWorkspaceId,
    });

    const batch = buildResetBatch(
      { candidate: promoted, demote: demoted },
      PRIMARY,
      null,
    );

    const demotedLines = batch.filter((l) => l.includes(demoted.address));

    // Cascade fallback keeps the demoted window floating; the compositor
    // rule keeps the rounded radius via the `float = true` match.
    expect(demotedLines[0]).toContain(`action = "on"`);
    // Cascade lands offset from the corner (pipsOnPrimary = 1 → one step in).
    expect(demotedLines.some((l) => l.includes(`hl.dsp.window.move`))).toBe(
      true,
    );
    expect(batch.some((l) => l.includes(`prop = "rounding"`))).toBe(false);
  });
});
