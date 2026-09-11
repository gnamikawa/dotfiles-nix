import { describe, expect, test } from "vitest";

import {
  type PipSnapshot,
  selectPromotionCandidate,
} from "../../assets/home/.config/ags/services/window-orchestrator/policies/firefox-pip-placement.ts";

const PRIMARY_ID = 1;
const SAT_ID = 2;

/**
 * Build a PipSnapshot with sensible defaults; only spell out the fields
 * that matter for the test at hand.
 */
function pip(
  overrides: Partial<PipSnapshot> & { address: string },
): PipSnapshot {
  return {
    floating: false,
    monitorId: PRIMARY_ID,
    workspaceId: 1,
    ...overrides,
  };
}

describe("selectPromotionCandidate", () => {
  test("no pips → null", () => {
    expect(selectPromotionCandidate([], null, PRIMARY_ID)).toBeNull();
  });

  test("only a floating pip → picks it, nothing to demote", () => {
    const p = pip({ address: "0xa", floating: true });
    const result = selectPromotionCandidate([p], null, PRIMARY_ID);
    expect(result).toEqual({ candidate: p, demote: null });
  });

  test("only a tiled satellite → picks it, nothing floating to demote", () => {
    const p = pip({ address: "0xa", monitorId: SAT_ID });
    const result = selectPromotionCandidate([p], null, PRIMARY_ID);
    expect(result).toEqual({ candidate: p, demote: null });
  });

  test("floating + tiled satellite, no focus → floating wins as candidate, no self-swap", () => {
    const floating = pip({ address: "0xa", floating: true });
    const tiled = pip({ address: "0xb", monitorId: SAT_ID });
    const result = selectPromotionCandidate(
      [floating, tiled],
      null,
      PRIMARY_ID,
    );
    expect(result).toEqual({ candidate: floating, demote: null });
  });

  test("floating + tiled satellite, satellite focused → satellite promotes, floating demotes", () => {
    const floating = pip({ address: "0xa", floating: true });
    const tiled = pip({ address: "0xb", monitorId: SAT_ID });
    const result = selectPromotionCandidate(
      [floating, tiled],
      tiled.address,
      PRIMARY_ID,
    );
    expect(result).toEqual({ candidate: tiled, demote: floating });
  });

  test("focused pip IS the floating pip → no demote (no self-swap)", () => {
    const floating = pip({ address: "0xa", floating: true });
    const tiled = pip({ address: "0xb", monitorId: SAT_ID });
    const result = selectPromotionCandidate(
      [floating, tiled],
      floating.address,
      PRIMARY_ID,
    );
    expect(result).toEqual({ candidate: floating, demote: null });
  });

  test("tiled-on-primary beats tiled-on-satellite when neither focused nor floating", () => {
    const onPrimary = pip({ address: "0xa" });
    const onSat = pip({ address: "0xb", monitorId: SAT_ID });
    const result = selectPromotionCandidate(
      [onSat, onPrimary],
      null,
      PRIMARY_ID,
    );
    expect(result?.candidate).toBe(onPrimary);
    expect(result?.demote).toBeNull();
  });

  test("floating beats tiled-on-primary when nothing focused", () => {
    const floating = pip({ address: "0xa", floating: true });
    const onPrimary = pip({ address: "0xb" });
    const result = selectPromotionCandidate(
      [onPrimary, floating],
      null,
      PRIMARY_ID,
    );
    expect(result?.candidate).toBe(floating);
    expect(result?.demote).toBeNull();
  });

  test("focused address that is not a pip drops through to the next tier", () => {
    const floating = pip({ address: "0xa", floating: true });
    const result = selectPromotionCandidate(
      [floating],
      "0xnotapip",
      PRIMARY_ID,
    );
    expect(result?.candidate).toBe(floating);
  });

  test("multiple satellites, no focus and no floating → deterministic first-found pick", () => {
    const first = pip({ address: "0xa", monitorId: SAT_ID });
    const second = pip({ address: "0xb", monitorId: SAT_ID });
    const result = selectPromotionCandidate([first, second], null, PRIMARY_ID);
    expect(result?.candidate).toBe(first);
  });

  test("focused satellite while a tiled-on-primary is available → focus still wins", () => {
    const onPrimary = pip({ address: "0xa" });
    const onSat = pip({ address: "0xb", monitorId: SAT_ID });
    const result = selectPromotionCandidate(
      [onPrimary, onSat],
      onSat.address,
      PRIMARY_ID,
    );
    expect(result?.candidate).toBe(onSat);
  });
});
