// The workspace-viz's open/closed signal. Two triggers combine:
//
//   1. A transient blink on every focused-workspace change — the surface pops
//      for HIDE_MS and hides itself. The compositor's switch caused it, so no
//      user-facing trigger is involved.
//   2. Alt-hold (altTabOpen). The visualization lists which workspaces sit on
//      which monitors, so the user pressing Alt can immediately read the
//      mapping and pick a number.
//
// The subscription is set up once at module load — the state is a singleton.
// The surface that consumes workspaceVizOpen lives in desktop/Desktop.tsx.

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
