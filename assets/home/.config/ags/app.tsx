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
  requestHandler(argv, res) {
    switch (argv[0]) {
      case "window-menu-open":
        // Symmetric with system-menu-open: the two peeks are mutually
        // exclusive, so opening this one drops the shaded menu. Also serves
        // as the "Shift released while Alt held" restore path — after the
        // system menu closes, this rehydrates the window-menu underneath.
        // The window-context router rides on the same Alt-hold — the two
        // peeks are siblings (top-of-screen list + per-window audio card),
        // not competitors, so they open and close together.
        setSystemMenuOpen(false);
        setWindowMenuOpen(true);
        setWindowContextOpen(true);
        res("open");
        return;
      case "window-menu-close":
        setWindowMenuOpen(false);
        setWindowContextOpen(false);
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
        // fires window-menu-close afterwards and finds nothing to close.
        setWindowMenuOpen(false);
        setWindowContextOpen(false);
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
        // before showing the menu.
        setWindowMenuOpen(false);
        setWindowContextOpen(false);
        setSystemMenuOpen(true);
        res("open");
        return;
      case "system-menu-close":
        setSystemMenuOpen(false);
        res("close");
        return;
      default:
        res(`unknown: ${argv.join(" ")}`);
    }
  },
  main: () => <Desktop />,
});
