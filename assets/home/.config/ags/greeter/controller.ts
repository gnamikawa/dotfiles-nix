// The greeter-flavoured Controller: greetd's PAM conversation behind the
// shared auth-machine, wired to the shared Screen through common/controller.

import { createState } from "ags"
import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import type { Controller } from "../common/controller"
import {
  acceptsPasswordInput,
  initialState,
  reduce,
  type Event,
  type Phase,
  type State,
} from "../common/auth-machine"
import { login } from "./session"

const FAULT_MS = 2000

export function createGreeterController(onAuthenticated: () => void): Controller {
  let state: State = initialState
  const [phase, setPhase] = createState<Phase>(state.phase)
  const [password, setPassword] = createState("")
  const [fault, setFault] = createState("")
  const [shake, setShake] = createState(0)
  const entries = new Set<Gtk.Entry>()
  let synchronising = false
  let faultTimer = 0

  function dispatch(event: Event): boolean {
    const previous = state
    state = reduce(state, event)
    if (state !== previous) setPhase(state.phase)
    return state !== previous
  }

  function writePassword(value: string) {
    setPassword(value)
    synchronising = true
    for (const entry of entries) {
      if (entry.text !== value) entry.text = value
    }
    synchronising = false
  }

  function restoreFocus() {
    // Sensitivity/state changes propagate through bindings before the next
    // main-loop turn. Focusing sooner reproduces the AGS startup bug:
    // grab_focus is asked of an entry GTK still considers insensitive.
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      for (const entry of entries) {
        entry.grab_focus()
      }
      return GLib.SOURCE_REMOVE
    })
  }

  function clearFault() {
    if (faultTimer) {
      GLib.source_remove(faultTimer)
      faultTimer = 0
    }
    setFault("")
  }

  function showFailure(message: string) {
    // clear first: a second wrong password gets its own full two seconds
    // rather than inheriting whatever was left of the first one's
    clearFault()
    setFault(message)
    setShake(shake() === 0 ? 1 : 0)
    writePassword("")
    faultTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, FAULT_MS, () => {
      faultTimer = 0
      setFault("")
      return GLib.SOURCE_REMOVE
    })
  }

  function submit() {
    // Blank attempts and every attempt made while a login is already in flight
    // are inert. The transition is the lock around the asynchronous call: two
    // Enter presses cannot race the greetd protocol, which holds a single
    // session under configuration at a time and would cancel the first attempt
    // when a second CreateSession arrived (session.ts).
    if (!password() || !dispatch({ type: "submit" })) return

    const attempt = state.attempt
    let secret = password()
    clearFault()
    writePassword("")

    login(secret)
      .then(() => {
        // GJS strings are immutable; dropping the last JS reference is the
        // strongest disposal available after greetd has consumed it.
        secret = ""
        if (dispatch({ type: "authenticationSucceeded", attempt })) {
          onAuthenticated()
        }
      })
      .catch((message: string) => {
        secret = ""
        if (dispatch({ type: "authenticationFailed", attempt })) {
          showFailure(message)
          restoreFocus()
        }
      })
  }

  function register(entry: Gtk.Entry) {
    entries.add(entry)
    entry.text = password()
    entry.connect("destroy", () => entries.delete(entry))
  }

  function update(entry: Gtk.Entry) {
    if (synchronising) return
    if (!acceptsPasswordInput(state)) {
      synchronising = true
      entry.text = password()
      synchronising = false
      return
    }
    writePassword(entry.text)
    if (entry.text.length > 0) clearFault()
  }

  // The greeter's window mount is effectively synchronous — no compositor
  // handshake, no async lock acquisition — so the machine moves from idle
  // through acquiring to locked at construction time.
  dispatch({ type: "acquire" })
  dispatch({ type: "acquired" })

  return {
    phase,
    password,
    fault,
    shake,
    register,
    update,
    submit,
    focus: restoreFocus,
  }
}
