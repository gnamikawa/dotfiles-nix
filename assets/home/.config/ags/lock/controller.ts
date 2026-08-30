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

/**
 * Build a Controller wired to `AstalAuth.Pam` and the Wayland
 * `ext-session-lock-v1` compositor handshake.
 *
 * The extra methods on the returned {@link LockController}
 * (`acquire`, `acquired`, `unlockSignalled`, …) let `main.tsx` drive
 * the async lifecycle events that only apply to the lock context.
 *
 * @param unlock - Called once when the machine reaches `unlocking` via
 *   a successful login; typically wired to `sessionLock.unlock()`.
 * @returns The Controller with lock-lifecycle extensions.
 */
export function createLockController(unlock: () => void): LockController {
  let state: State = initialState;
  const [phase, setPhase] = createState<Phase>(state.phase);
  const [password, setPassword] = createState("");
  const [fault, setFault] = createState("");
  const [shake, setShake] = createState(0);
  const entries = new Set<Gtk.Entry>();
  let synchronising = false;
  let faultTimer = 0;

  /**
   * Fold an event into the shared auth-machine and mirror the resulting
   * phase into the exported accessor.
   *
   * @param event - The state-machine event to dispatch.
   * @returns `true` when the state actually changed.
   */
  function dispatch(event: Event): boolean {
    const previous = state;
    state = reduce(state, event);
    if (state !== previous) setPhase(state.phase);
    return state !== previous;
  }

  /**
   * Set the canonical password value and mirror it into every attached
   * entry, guarding against the mirror re-firing `update`.
   *
   * @param value - The new password text.
   */
  function writePassword(value: string) {
    setPassword(value);
    synchronising = true;
    for (const entry of entries) {
      if (entry.text !== value) entry.text = value;
    }
    synchronising = false;
  }

  /**
   * Return keyboard focus to every attached entry on the next idle turn.
   *
   * Every toplevel is given an internal focus target because Hyprland
   * transfers keyboard focus with the pointer — the compositor decides
   * which monitor's lock surface actually receives keys.
   */
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

  /**
   * Clear the fault message and cancel any pending auto-clear timer.
   */
  function clearFault() {
    if (faultTimer) {
      GLib.source_remove(faultTimer);
      faultTimer = 0;
    }
    setFault("");
  }

  /**
   * Show an authentication-failure message, retrigger the shake
   * animation, clear the password, and schedule an auto-clear after
   * `FAULT_MS`.
   *
   * @param message - Human-readable line to display on the fault slot.
   */
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

  /**
   * Kick off one PAM authentication attempt.
   *
   * Blank attempts and every attempt made while PAM is already running
   * are inert — the `submit` transition is the lock around the async
   * call, so two monitor windows cannot race one another into
   * overlapping PAM requests.
   */
  function submit() {
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

  /**
   * Attach a `Gtk.Entry` so it participates in password mirroring, seed
   * it with the current password, and detach on destroy.
   *
   * @param entry - The entry to bind.
   */
  function register(entry: Gtk.Entry) {
    entries.add(entry);
    entry.text = password();
    entry.connect("destroy", () => entries.delete(entry));
  }

  /**
   * Handle a text change from an attached entry.
   *
   * Ignores the change when it originates from our own mirror
   * ({@link writePassword}), and when the machine does not currently
   * accept input rolls the entry back so a stray keystroke can't
   * clobber the canonical value.
   *
   * @param entry - The entry whose `text` just changed.
   */
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

  /**
   * Wipe the last-typed password and any lingering fault.
   *
   * Called on `unlockSignalled` so a compositor-initiated unlock does
   * not leave the secret sitting in memory or a stale fault visible on
   * the next lock.
   */
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
