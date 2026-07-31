// Entry point of the greetd greeter (ADR-0008, issue #38).
//
// This file is NOT the desktop shell's entry — that is app.ts one directory up,
// and `ags run` reaches only ever for app.{js,ts,jsx,tsx} in the directory it
// is pointed at (cli/cmd/run.go), so everything in here is inert in the user
// session even though modules/assets.nix symlinks the whole tree into
// ~/.config/ags. The greeter is reached the other way: `ags bundle` takes this
// path explicitly and produces the executable packages/greeter.nix installs.
//
// main.tsx and not greeter.tsx: esbuild resolves imports case-insensitively,
// so an entry named after its own directory collides with the Greeter
// component beside it and the bundle fails to resolve either.
//
// So this half of the tree moves only on a system rebuild, and that is the
// point — /home/genzo is drwx------, the greeter runs as uid 988, and a
// live-editable login screen would make a .tsx typo a full lockout.

import app from "ags/gtk4/app"
import Astal from "gi://Astal?version=4.0"
import Greeter from "./Greeter"
import css from "./style.css"

app.start({
  instanceName: "greeter",
  css,
  main() {
    // One surface, on the first monitor. The warm wash is a radial centred on
    // the screen, so repeating it across a multi-head desktop would read as
    // several lamps rather than one; the rest of the seat stays dark.
    const monitor = app.get_monitors()[0]

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
            so a started session is this process's cue to exit. */}
        <Greeter onAuthenticated={() => app.quit()} />
      </window>
    )
  },
})
