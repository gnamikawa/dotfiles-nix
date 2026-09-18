import { describe, expect, test } from "vitest";

import {
  buildFocus,
  buildRestoreTail,
} from "../../assets/home/.config/ags/common/hypr-dispatch-builders.ts";

describe("buildFocus", () => {
  test("emits an hl.dsp.focus with the address prefixed", () => {
    expect(buildFocus("0xdeadbeef")).toBe(
      'hl.dsp.focus({ window = "address:0xdeadbeef" })',
    );
  });

  test("defensively adds an 0x prefix when Astal returns bare hex", () => {
    expect(buildFocus("deadbeef")).toBe(
      'hl.dsp.focus({ window = "address:0xdeadbeef" })',
    );
  });
});

describe("buildRestoreTail", () => {
  test("both null → empty tail", () => {
    expect(buildRestoreTail(null, null)).toEqual([]);
  });

  test("focused only → set-prop no_focus false + focus dispatch", () => {
    const tail = buildRestoreTail("0xdeadbeef", null);
    expect(tail).toEqual([
      expect.stringContaining(`prop = "no_focus"`),
      expect.stringContaining(`hl.dsp.focus`),
    ]);
    expect(tail[0]).toContain(`address:0xdeadbeef`);
    expect(tail[0]).toContain(`value = "false"`);
    expect(tail[1]).toBe('hl.dsp.focus({ window = "address:0xdeadbeef" })');
  });

  test("cursor only → single cursor.move dispatch", () => {
    const tail = buildRestoreTail(null, { x: 100, y: 200 });
    expect(tail).toEqual(["hl.dsp.cursor.move({ x = 100, y = 200 })"]);
  });

  test("both → set-prop, focus, cursor.move — in that order", () => {
    const tail = buildRestoreTail("0xabcd", { x: 500, y: 600 });
    expect(tail).toHaveLength(3);
    expect(tail[0]).toContain(`prop = "no_focus"`);
    expect(tail[0]).toContain(`address:0xabcd`);
    expect(tail[1]).toBe('hl.dsp.focus({ window = "address:0xabcd" })');
    expect(tail[2]).toBe("hl.dsp.cursor.move({ x = 500, y = 600 })");
  });
});
