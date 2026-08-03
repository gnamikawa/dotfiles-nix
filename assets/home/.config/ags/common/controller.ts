// The interface Screen consumes to drive the password entry and read the
// authentication state, decoupled from any specific backend (greetd, PAM) or
// window mechanism (layer-shell, Gtk4SessionLock). Concrete controllers under
// greeter/ and lock/ implement this shape.

import type { Accessor } from "ags"
import type { Gtk } from "ags/gtk4"
import type { Phase } from "./auth-machine"

export type Controller = {
  // View-facing state signals.
  phase: Accessor<Phase>
  password: Accessor<string>
  fault: Accessor<string>
  // Alternated between 0 and 1 to retrigger a CSS animation whose class would
  // otherwise land unchanged on a second failure in a row.
  shake: Accessor<number>

  // Password-entry lifecycle. register attaches an entry to the controller;
  // update handles a text-change from an attached entry, guarding the
  // in-flight authentication against overwrites.
  register: (entry: Gtk.Entry) => void
  update: (entry: Gtk.Entry) => void

  // User-driven actions.
  submit: () => void
  focus: () => void
}
