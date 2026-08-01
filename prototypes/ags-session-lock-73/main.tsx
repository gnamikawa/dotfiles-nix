// PROTOTYPE — real Gtk4SessionLock/AstalAuth substrate proof for issue 73.
// Deliberately plain: it answers lifecycle and security questions, not what
// the finished lock screen should look like.

import app from "ags/gtk4/app"
import { Gdk, Gtk } from "ags/gtk4"
import Auth from "gi://AstalAuth"
import SessionLock from "gi://Gtk4SessionLock?version=1.0"
import { initialState, reduce, type Event, type State } from "./machine"
import css from "./style.css"

type Surface = {
  window: Gtk.Window
  phase: Gtk.Label
  monitors: Gtk.Label
  error: Gtk.Label
  entry: Gtk.Entry
  submit: Gtk.Button
}

let state: State = initialState
const surfaces = new Map<Gdk.Monitor, Surface>()
const lock = SessionLock.Instance.new()

function monitorName(monitor: Gdk.Monitor): string {
  return monitor.connector ?? monitor.description ?? `monitor-${surfaces.size + 1}`
}

function render() {
  for (const surface of surfaces.values()) {
    surface.phase.label = `phase: ${state.phase}`
    surface.monitors.label = `monitors: ${state.monitors.join(", ")}`
    surface.error.label = state.error ?? ""
    surface.submit.sensitive = state.phase === "locked"
    surface.entry.sensitive = state.phase === "locked"
  }
}

function dispatch(event: Event): boolean {
  const previous = state
  state = reduce(state, event)
  print(`${event.type}: ${JSON.stringify(state)}`)
  render()
  return state !== previous
}

function authenticate(surface: Surface) {
  if (!dispatch({ type: "submit" })) return

  const attempt = state.attempt
  let password = surface.entry.text
  surface.entry.text = ""

  Auth.Pam.authenticate(password, (_, task) => {
    // GJS strings are immutable; dropping this reference is the strongest
    // disposal available here. This limitation is part of the verdict.
    password = ""
    try {
      Auth.Pam.authenticate_finish(task)
      if (dispatch({ type: "authenticationSucceeded", attempt })) lock.unlock()
    } catch (error) {
      printerr(`authentication: ${error}`)
      dispatch({ type: "authenticationFailed", attempt })
      surface.entry.grab_focus()
    }
  })
}

function createSurface(monitor: Gdk.Monitor): Surface {
  // A fresh Gtk.Window, never presented or realized before assignment. An
  // Astal.Window would be a layer-shell surface and is intentionally avoided.
  const window = new Gtk.Window({ application: app })
  const box = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
  })
  const title = new Gtk.Label({ label: "SESSION LOCK PROTOTYPE" })
  title.add_css_class("title")
  const phase = new Gtk.Label()
  const monitors = new Gtk.Label()
  const error = new Gtk.Label()
  error.add_css_class("error")
  const entry = new Gtk.Entry({
    visibility: false,
    placeholder_text: "Password",
    activates_default: true,
  })
  const submit = new Gtk.Button({ label: "Authenticate" })
  window.set_default_widget(submit)
  submit.connect("clicked", () => authenticate(surface))
  box.append(title)
  box.append(phase)
  box.append(monitors)
  box.append(error)
  box.append(entry)
  box.append(submit)
  window.set_child(box)

  const surface = { window, phase, monitors, error, entry, submit }
  return surface
}

lock.connect("monitor", (_, monitor: Gdk.Monitor) => {
  const surface = createSurface(monitor)
  const name = monitorName(monitor)
  surfaces.set(monitor, surface)
  dispatch({ type: "monitorAdded", monitor: name })
  surface.window.connect("destroy", () => {
    surfaces.delete(monitor)
    dispatch({ type: "monitorRemoved", monitor: name })
  })
  lock.assign_window_to_monitor(surface.window, monitor)
  surface.entry.grab_focus()
})

lock.connect("locked", () => dispatch({ type: "acquired" }))
lock.connect("failed", () => {
  dispatch({ type: "acquisitionFailed" })
  app.quit()
})
lock.connect("unlocked", () => {
  dispatch({ type: "compositorUnlocked" })
  app.quit()
})

app.start({
  instanceName: "ags-session-lock-prototype-73",
  css,
  main() {
    if (!SessionLock.is_supported()) {
      printerr("compositor does not support ext-session-lock-v1")
      app.quit()
      return
    }
    dispatch({ type: "acquire" })
    if (!lock.lock()) {
      // `failed` may already have fired synchronously; the reducer makes the
      // duplicate harmless.
      dispatch({ type: "acquisitionFailed" })
      app.quit()
    }
  },
})
