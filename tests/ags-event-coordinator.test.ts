import assert from "node:assert/strict";
import test from "node:test";

import { createEventCoordinator } from "../assets/home/.config/ags/common/event-coordinator.ts";

test("coalesces a burst of debounced requests", async () => {
  let nextTimer = 0;
  const timers = new Map<number, () => void>();
  let runs = 0;
  const coordinator = createEventCoordinator({
    delayMs: 150,
    run: () => {
      runs += 1;
    },
    schedule: (_delayMs, callback) => {
      const id = ++nextTimer;
      timers.set(id, callback);
      return id;
    },
    cancel: (id) => timers.delete(id),
  });

  for (let i = 0; i < 40; i += 1) coordinator.requestDebounced();

  assert.equal(runs, 0);
  assert.equal(timers.size, 1);
  const callback = [...timers.values()][0];
  assert.ok(callback);
  callback();
  await Promise.resolve();
  assert.equal(runs, 1);
});

test("allows one run and coalesces overlap into one pending run", async () => {
  const completions: Array<() => void> = [];
  let active = 0;
  let maxActive = 0;
  let runs = 0;
  const coordinator = createEventCoordinator({
    delayMs: 150,
    run: () =>
      new Promise<void>((resolve) => {
        runs += 1;
        active += 1;
        maxActive = Math.max(maxActive, active);
        completions.push(() => {
          active -= 1;
          resolve();
        });
      }),
    schedule: () => {
      throw new Error("unexpected debounce timer");
    },
    cancel: () => {
      throw new Error("unexpected timer cancellation");
    },
  });

  coordinator.requestImmediate();
  coordinator.requestImmediate();
  coordinator.requestImmediate();
  coordinator.requestDebounced();
  assert.equal(runs, 1);

  completions.shift()?.();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(runs, 2);
  assert.equal(maxActive, 1);

  completions.shift()?.();
  await Promise.resolve();
  assert.equal(runs, 2);
});

test("an immediate request supersedes a title timer", async () => {
  let timer: (() => void) | null = null;
  let cancelled = 0;
  let runs = 0;
  const coordinator = createEventCoordinator({
    delayMs: 150,
    run: () => {
      runs += 1;
    },
    schedule: (_delayMs, callback) => {
      timer = callback;
      return 1;
    },
    cancel: () => {
      timer = null;
      cancelled += 1;
    },
  });

  coordinator.requestDebounced();
  coordinator.requestImmediate();
  assert.equal(runs, 1);
  assert.equal(cancelled, 1);
  assert.equal(timer, null);
  await Promise.resolve();
  assert.equal(runs, 1);
});

test("disposal cancels a pending debounced request", () => {
  let cancelled = 0;
  const coordinator = createEventCoordinator({
    delayMs: 150,
    run: () => {
      throw new Error("disposed coordinator ran");
    },
    schedule: () => 42,
    cancel: (id) => {
      assert.equal(id, 42);
      cancelled += 1;
    },
  });

  coordinator.requestDebounced();
  coordinator.dispose();
  coordinator.requestImmediate();
  coordinator.requestDebounced();

  assert.equal(cancelled, 1);
});
