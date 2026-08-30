// Entry point of the greetd greeter (ADR-0008, issue #38).
//
// This file is NOT the desktop shell's entry — that is app.ts one directory up,
// and `ags run` reaches only ever for app.{js,ts,jsx,tsx} in the directory it
// is pointed at (cli/cmd/run.go), so everything in here is inert in the user
// session even though modules/assets.nix symlinks the whole tree into
// ~/.config/ags. The greeter is reached the other way: `ags bundle` takes this
// path explicitly and produces the executable packages/greeter.nix installs.
//
// So this half of the tree moves only on a system rebuild, and that is the
// point — /home/genzo is drwx------, the greeter runs as uid 988, and a
// live-editable login screen would make a .tsx typo a full lockout.

import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import Auth from "../components/auth/Auth";
import { findPrimaryMonitor } from "../common/monitors";
import { createGreeterController } from "./controller";
import css from "../components/auth/style.css";

app.start({
  instanceName: "greeter",
  css,
  /**
   * GTK-app entry: mount the greeter's warm-wash surface on the primary
   * output and hand the shared `Auth` panel a greetd-flavoured
   * controller.
   */
  main() {
    // The warm wash is a radial centred on the screen, so repeating it across
    // a multi-head desktop would read as several lamps rather than one. The
    // rest of the seat stays dark, and the surface lands on the compositor's
    // logical primary — system-nix's hardware.primaryMonitor pins that output
    // to 0x0 in greetd's Hyprland (modules/greeter.nix), and findPrimaryMonitor
    // filters by geometry so GDK's driver-dependent enumeration order cannot
    // put the warm surface on the wrong seat.
    const monitor = findPrimaryMonitor();
    const controller = createGreeterController(() => app.quit());

    return (
      <window
        visible
        namespace="greeter"
        gdkmonitor={monitor}
        layer={Astal.Layer.OVERLAY}
        exclusivity={Astal.Exclusivity.IGNORE}
        // The screen is the whole session: nothing else may take the keyboard.
        keymode={Astal.Keymode.EXCLUSIVE}
        anchor={
          Astal.WindowAnchor.TOP |
          Astal.WindowAnchor.BOTTOM |
          Astal.WindowAnchor.LEFT |
          Astal.WindowAnchor.RIGHT
        }
        application={app}
      >
        {/* greetd hands the seat over only once the greeter process is gone,
            so a started session is this process's cue to exit. The controller
            calls the onAuthenticated callback above on a successful login. */}
        <Auth controller={controller} />
      </window>
    );
  },
});
