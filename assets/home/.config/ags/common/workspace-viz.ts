// The monitor-plate HUD's open/closed signal. Two triggers combine:
//
//   1. A transient blink on every focused-workspace change — the surface pops
//      for HIDE_MS and hides itself. The compositor's switch caused it, so no
//      user-facing trigger is involved.
//   2. Alt-hold (altTabOpen). The plate carries the active-workspace name for
//      each screen, so during peek the user sees where each output currently
//      is at a glance.
//
// The subscription is set up once at module load — the state is a singleton.
// The surface that consumes workspaceVizOpen lives in desktop/Desktop.tsx.
// (Name kept as `workspaceVizOpen` for continuity — the earlier ws-viz
// surface was folded into MonitorId; the signal it drove did not need to
// change.)

import { createComputed, createState } from "ags";
import AstalHyprland from "gi://AstalHyprland";
import GLib from "gi://GLib?version=2.0";
import { altTabOpen } from "./alt-tab";

const HIDE_MS = 900;

const hyprland = AstalHyprland.get_default();
const [transient, setTransient] = createState(false);

let timerId = 0;

hyprland.connect("notify::focused-workspace", () => {
  setTransient(true);
  if (timerId !== 0) GLib.source_remove(timerId);
  timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, HIDE_MS, () => {
    setTransient(false);
    timerId = 0;
    return GLib.SOURCE_REMOVE;
  });
});

export const workspaceVizOpen = createComputed(
  () => transient() || altTabOpen(),
);
