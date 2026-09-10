// Entry point of the AGS v3 desktop shell (ADR-0008).
//
// One process owns every user-session surface. The desktop screen is the
// pathfinder; later screens and components join this same entry point as they
// replace their incumbents (ADR-0008, issue #34).
//
// Restart after editing: systemctl --user restart ags

import app from "ags/gtk4/app";
import Desktop from "./desktop/Desktop";
import { cycleWindowMenu, setWindowMenuOpen } from "./common/window-menu";
import {
  activateCursor,
  nudgeCursor,
  setWindowContextOpen,
} from "./common/window-context";
import { setRunnerOpen } from "./common/runner";
import { setSystemMenuOpen } from "./common/system-menu";
import { bumpLayoutTick } from "./common/workspace-viz";
import {
  resetPrimaryPip,
  startWindowOrchestrator,
} from "./services/window-orchestrator";
import {
  disableFloatingDimmer,
  enableFloatingDimmer,
} from "./services/floating-dimmer";

startWindowOrchestrator();

// Quick Alt double-press (press → release → press within this window)
// triggers `resetPrimaryPip` instead of re-opening the peek. Sized to be
// comfortably longer than a fast human double-tap (~200ms round-trip)
// but shorter than the "I meant to open the menu twice" beat, so a
// deliberate single-tap → wait → single-tap still opens the peek both
// times.
const ALT_DOUBLE_PRESS_MS = 350;
let lastAltPressAt = 0;

app.start({
  css: `${SRC}/style.css`,
  gtkTheme: "Adwaita",
  // IPC bridge for the Hyprland alt-hold binds. See hypr/binds.conf for the
  // emitting side; the overlay itself is components/WindowMenu.tsx mounted
  // from desktop/Desktop.tsx.
  //
  // res() MUST be called on every branch — a handler that throws before
  // resolving leaves the DBus caller (ags request / Hyprland bind) hanging,
  // which strands the overlay in whatever state the throw interrupted.
  /**
   * IPC bridge for the Hyprland alt-hold binds and every other verb the
   * `ags request` client fires. See `hypr/binds.conf` for the emitting side.
   *
   * `res()` must be called on every branch — a handler that throws before
   * resolving leaves the DBus caller hanging, which strands whichever
   * overlay the throw interrupted.
   *
   * @param argv - Argv from `ags request`; `argv[0]` is the verb name.
   * @param res - Reply callback, called exactly once per invocation.
   */
  requestHandler(argv, res) {
    switch (argv[0]) {
      case "window-menu-open": {
        // Quick Alt double-press (second press lands within
        // ALT_DOUBLE_PRESS_MS of the previous one) is repurposed as
        // "reset the primary PiP to its top-right corner" — the peek
        // stays down and the reset fires instead. Clearing the
        // timestamp afterwards means a third quick press starts a
        // fresh double-press window, not another reset immediately.
        const now = Date.now();
        if (now - lastAltPressAt < ALT_DOUBLE_PRESS_MS) {
          lastAltPressAt = 0;
          setSystemMenuOpen(false);
          setWindowMenuOpen(false);
          setWindowContextOpen(false);
          disableFloatingDimmer();
          resetPrimaryPip();
          res("reset");
          return;
        }
        lastAltPressAt = now;

        // Symmetric with system-menu-open: the two peeks are mutually
        // exclusive, so opening this one drops the shaded menu. Also serves
        // as the "Shift released while Alt held" restore path — after the
        // system menu closes, this rehydrates the window-menu underneath.
        // The window-context router rides on the same Alt-hold — the two
        // peeks are siblings (top-of-screen list + per-window audio card),
        // not competitors, so they open and close together. The floating
        // dimmer rides on the same Alt-hold too — see services/floating-dimmer.
        setSystemMenuOpen(false);
        setWindowMenuOpen(true);
        setWindowContextOpen(true);
        enableFloatingDimmer();
        res("open");
        return;
      }
      case "window-menu-close":
        setWindowMenuOpen(false);
        setWindowContextOpen(false);
        disableFloatingDimmer();
        res("close");
        return;
      case "window-menu-next":
        cycleWindowMenu(1);
        res("next");
        return;
      case "window-menu-prev":
        cycleWindowMenu(-1);
        res("prev");
        return;
      case "window-context-cursor-up":
        nudgeCursor(-1);
        res("up");
        return;
      case "window-context-cursor-down":
        nudgeCursor(1);
        res("down");
        return;
      case "window-context-activate":
        activateCursor();
        res("activate");
        return;
      case "runner-open":
        // The runner outlives Alt-hold: force the peek off so the two visibility
        // states don't stack, then flip the runner on. The bindrt Alt release
        // fires window-menu-close afterwards and finds nothing to close. The
        // dim rides with the peek and dies with it.
        setWindowMenuOpen(false);
        setWindowContextOpen(false);
        disableFloatingDimmer();
        setRunnerOpen(true);
        res("open");
        return;
      case "runner-close":
        setRunnerOpen(false);
        res("close");
        return;
      case "system-menu-open":
        // The two peeks are mutually exclusive — the shaded system menu
        // supersedes the window-menu card, so drop the window-menu overlay
        // and its floating dim before showing the menu. If the user then
        // releases Shift while still holding Alt, `window-menu-open` fires
        // again and rehydrates both.
        setWindowMenuOpen(false);
        setWindowContextOpen(false);
        disableFloatingDimmer();
        setSystemMenuOpen(true);
        res("open");
        return;
      case "system-menu-close":
        setSystemMenuOpen(false);
        res("close");
        return;
      case "workspace-layout-changed":
        // Hyprland emits no event for workspace-rule mutations, so the
        // dwindle↔monocle toggle in hypr/binds.lua pokes us after firing
        // `hl.workspace_rule` — bump the tick so MonitorId re-reads.
        bumpLayoutTick();
        res("ok");
        return;
      default:
        res(`unknown: ${argv.join(" ")}`);
    }
  },
  /** GTK-app entry: mounts the always-on desktop surfaces. */
  main: () => <Desktop />,
});
