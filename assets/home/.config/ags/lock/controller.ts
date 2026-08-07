// The session-lock-flavoured Controller: PAM behind the shared auth-machine,
// plus the compositor-lock lifecycle events that Gtk4SessionLock hands us
// (acquired, unlockSignalled, ...). The lifecycle bits are exposed as extra
// methods so main.tsx can drive them from Gtk4SessionLock's signal handlers.

import { createState } from "ags";
import { Gtk } from "ags/gtk4";
import Auth from "gi://AstalAuth";
import GLib from "gi://GLib";
import type { Controller } from "../common/controller";
import {
  acceptsPasswordInput,
  initialState,
  reduce,
  type Event,
  type Phase,
  type State,
} from "../common/auth-machine";

const FAULT_MS = 2000;

export type LockController = Controller & {
  acquire: () => boolean;
  acquired: () => void;
  acquisitionFailed: () => boolean;
  unlockSignalled: () => boolean;
  unlockRoundtripCompleted: () => boolean;
};

export function createLockController(unlock: () => void): LockController {
  let state: State = initialState;
  const [phase, setPhase] = createState<Phase>(state.phase);
  const [password, setPassword] = createState("");
  const [fault, setFault] = createState("");
  const [shake, setShake] = createState(0);
  const entries = new Set<Gtk.Entry>();
  let synchronising = false;
  let faultTimer = 0;

  function dispatch(event: Event): boolean {
    const previous = state;
    state = reduce(state, event);
    if (state !== previous) setPhase(state.phase);
    return state !== previous;
  }

  function writePassword(value: string) {
    setPassword(value);
    synchronising = true;
    for (const entry of entries) {
      if (entry.text !== value) entry.text = value;
    }
    synchronising = false;
  }

  function restoreFocus() {
    // Sensitivity changes propagate through bindings before the next main-loop
    // turn. Focusing sooner repeats the startup bug: grab_focus() is asked of
    // an entry GTK still considers insensitive.
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      // Give every toplevel an internal focus target. The compositor decides
      // which monitor's lock surface receives keyboard events.
      for (const entry of entries) {
        entry.grab_focus();
      }
      return GLib.SOURCE_REMOVE;
    });
  }

  function clearFault() {
    if (faultTimer) {
      GLib.source_remove(faultTimer);
      faultTimer = 0;
    }
    setFault("");
  }

  function showFailure(message: string) {
    clearFault();
    setFault(message);
    setShake(shake() === 0 ? 1 : 0);
    writePassword("");
    faultTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, FAULT_MS, () => {
      faultTimer = 0;
      setFault("");
      return GLib.SOURCE_REMOVE;
    });
  }

  function submit() {
    // Blank attempts and every attempt made while PAM is already running are
    // inert. The transition is the lock around the asynchronous call, so two
    // monitor windows cannot race one another into overlapping PAM requests.
    if (!password() || !dispatch({ type: "submit" })) return;

    const attempt = state.attempt;
    let secret = password();
    clearFault();
    writePassword("");

    Auth.Pam.authenticate(secret, (_, task) => {
      // GJS strings are immutable; dropping the last JS reference is the
      // strongest disposal available after PAM has consumed it.
      secret = "";
      try {
        Auth.Pam.authenticate_finish(task);
        // This accepted transition is the only application event that calls
        // unlock. A late callback after compositor-initiated unlock is ignored.
        if (dispatch({ type: "authenticationSucceeded", attempt })) unlock();
      } catch (error) {
        console.error(`authentication: ${error}`);
        if (dispatch({ type: "authenticationFailed", attempt })) {
          showFailure("authentication failed");
          restoreFocus();
        }
      }
    });
  }

  function register(entry: Gtk.Entry) {
    entries.add(entry);
    entry.text = password();
    entry.connect("destroy", () => entries.delete(entry));
  }

  function update(entry: Gtk.Entry) {
    if (synchronising) return;
    if (!acceptsPasswordInput(state)) {
      synchronising = true;
      entry.text = password();
      synchronising = false;
      return;
    }
    writePassword(entry.text);
    if (entry.text.length > 0) clearFault();
  }

  function forgetSecret() {
    clearFault();
    writePassword("");
  }

  return {
    phase,
    password,
    fault,
    shake,
    register,
    update,
    submit,
    focus: restoreFocus,
    acquire: () => dispatch({ type: "acquire" }),
    acquired: () => {
      if (dispatch({ type: "acquired" })) restoreFocus();
    },
    acquisitionFailed: () => dispatch({ type: "acquisitionFailed" }),
    unlockSignalled: () => {
      forgetSecret();
      return dispatch({ type: "unlockSignalled" });
    },
    unlockRoundtripCompleted: () =>
      dispatch({ type: "unlockRoundtripCompleted" }),
  };
}
