// Entry point of the AGS v3 desktop shell (ADR-0008).
//
// Deliberately opens no windows: this is the wiring proof for issue #33 —
// the package, the systemd unit, and the asset symlink are correct when this
// starts and stays up. Surfaces arrive one at a time, each replacing its
// incumbent as it lands; the bar is first (issue #34).
//
// Restart after editing: systemctl --user restart ags

import app from "ags/gtk4/app"

app.start({
  main() {},
})
