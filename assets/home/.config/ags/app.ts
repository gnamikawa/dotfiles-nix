// Entry point of the AGS v3 desktop shell (ADR-0008).
//
// Deliberately opens no windows: this is the wiring proof for issue #33 —
// the package, the systemd unit, and the asset symlink are correct when this
// starts and stays up. Surfaces arrive one at a time, each replacing its
// incumbent as it lands; the bar is first (issue #34).
//
// Restart after editing: systemctl --user restart ags

import app from "ags/gtk4/app"
import { space } from "geistdesign"

app.start({
  css: `${SRC}/style.css`,
  // Keeps the generated module live in this wiring proof and, with the flake
  // check, proves the tsconfig alias resolves in AGS's esbuild invocation.
  main() {
    void space
  },
})
