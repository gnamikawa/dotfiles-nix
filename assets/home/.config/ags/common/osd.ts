// The bottom-right transient OSD's open/closed signal and current content.
// Modeled on workspace-viz.ts's debounce-timer pattern: a trigger sets the
// state and (re)arms a hide-timer, so rapid repeated presses (holding a
// volume key) keep resetting the clock instead of flickering.
//
// Content is a snapshot taken once, right after the triggering hardware
// change lands — pushed by common/hardware.ts's verb handlers (wired from
// Hyprland's Fn-row/audio binds via `ags request <verb>`, see
// hosts/GEN-LPC/hyprland-outputs.nix and hypr/binds.lua), not re-derived
// here via a live Astal binding. The OSD only stays up HIDE_MS, so a live
// binding would add complexity (async GObject signals, race conditions
// against the just-fired change) for no visible benefit over a snapshot
// taken right after the change already landed.
//
// The surface that consumes osdOpen/osdContent lives in desktop/Desktop.tsx;
// its content in components/osd/Osd.tsx.

import { createComputed, createState } from "ags";
import GLib from "gi://GLib?version=2.0";

const HIDE_MS = 1500;

export type OsdKind = "volume" | "brightness" | "mic" | "bluetooth" | "radio";

export interface OsdContent {
  kind: OsdKind;
  /** Fader kinds (volume, brightness): fill level, 0-100. */
  level?: number;
  /** Toggle kinds (mic, bluetooth, radio) and volume's mute overlay. */
  on?: boolean;
}

const [transient, setTransient] = createState(false);
const [content, setContent] = createState<OsdContent | null>(null);

let timerId = 0;

/** Show the OSD with new content, (re)arming the auto-hide timer. */
export function showOsd(next: OsdContent): void {
  setContent(next);
  setTransient(true);
  if (timerId !== 0) GLib.source_remove(timerId);
  timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, HIDE_MS, () => {
    setTransient(false);
    timerId = 0;
    return GLib.SOURCE_REMOVE;
  });
}

export const osdOpen = createComputed(() => transient());
export { content as osdContent };
