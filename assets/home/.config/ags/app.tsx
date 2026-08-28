// Entry point of the AGS v3 desktop shell (ADR-0008).
//
// One process owns every user-session surface. The desktop screen is the
// pathfinder; later screens and components join this same entry point as they
// replace their incumbents (ADR-0008, issue #34).
//
// Restart after editing: systemctl --user restart ags

import app from "ags/gtk4/app";
import Desktop from "./desktop/Desktop";
import { cycleAltTab, setAltTabOpen } from "./common/alt-tab";
import { setRunnerOpen } from "./common/runner";
import { setSystemMenuOpen } from "./common/system-menu";

app.start({
  css: `${SRC}/style.css`,
  gtkTheme: "Adwaita",
  // IPC bridge for the Hyprland alt-hold binds. See hypr/binds.conf for the
  // emitting side; the overlay itself is components/AltTab.tsx mounted from
  // desktop/Desktop.tsx.
  //
  // res() MUST be called on every branch — a handler that throws before
  // resolving leaves the DBus caller (ags request / Hyprland bind) hanging,
  // which strands the overlay in whatever state the throw interrupted.
  requestHandler(argv, res) {
    switch (argv[0]) {
      case "alt-tab-open":
        setAltTabOpen(true);
        res("open");
        return;
      case "alt-tab-close":
        setAltTabOpen(false);
        res("close");
        return;
      case "alt-tab-next":
        cycleAltTab(1);
        res("next");
        return;
      case "alt-tab-prev":
        cycleAltTab(-1);
        res("prev");
        return;
      case "runner-open":
        // The runner outlives Alt-hold: force the peek off so the two visibility
        // states don't stack, then flip the runner on. The bindrt Alt release
        // fires alt-tab-close afterwards and finds nothing to close.
        setAltTabOpen(false);
        setRunnerOpen(true);
        res("open");
        return;
      case "runner-close":
        setRunnerOpen(false);
        res("close");
        return;
      case "system-menu-open":
        // The two peeks are mutually exclusive — the shaded system menu
        // supersedes the alt-tab card, so drop the tab overlay before
        // showing the menu.
        setAltTabOpen(false);
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
