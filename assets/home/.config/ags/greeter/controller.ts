// The greeter-flavoured Controller: greetd's PAM conversation behind the
// shared auth-machine, wired to the shared Auth panel through common/controller.

import { createState } from "ags";
import { Gtk } from "ags/gtk4";
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
import { login } from "./session";

const FAULT_MS = 2000;

/**
 * Build a Controller wired to greetd's PAM conversation.
 *
 * Mounts the shared auth-machine and translates its events into greetd
 * requests. The machine is effectively synchronous on mount — the
 * greeter has no compositor handshake — so it walks straight from `idle`
 * through `acquiring` to `locked` before returning.
 *
 * @param onAuthenticated - Called once when the machine reaches
 *   `unlocking` via a successful login. The greeter must exit for
 *   greetd to hand the seat over.
 * @returns The Controller consumed by the shared `Auth` panel.
 */
export function createGreeterController(
  onAuthenticated: () => void,
): Controller {
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
   * @returns `true` when the state actually changed, `false` when the
   *   reducer ignored the event.
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
   * @param value - The new password text (usually `""` after a submit).
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
   * Return keyboard focus to the password entries on the next idle turn.
   *
   * Deferred to idle because sensitivity/state changes propagate through
   * bindings before the next main-loop turn — focusing sooner reproduces
   * the AGS startup bug where `grab_focus` is asked of an entry GTK still
   * considers insensitive.
   */
  function restoreFocus() {
    // Sensitivity/state changes propagate through bindings before the next
    // main-loop turn. Focusing sooner reproduces the AGS startup bug:
    // grab_focus is asked of an entry GTK still considers insensitive.
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      for (const entry of entries) {
        entry.grab_focus();
      }
      return GLib.SOURCE_REMOVE;
    });
  }

  /**
   * Clear the fault message and cancel any pending auto-clear timer.
   *
   * Called both on user keystroke (any typed character clears the shown
   * failure) and at the start of a new attempt so a fresh failure gets
   * its own full window.
   */
  function clearFault() {
    if (faultTimer) {
      GLib.source_remove(faultTimer);
      faultTimer = 0;
    }
    setFault("");
  }

  /**
   * Show an authentication-failure message, kick the shake animation,
   * clear the password, and schedule an auto-clear after `FAULT_MS`.
   *
   * @param message - Human-readable line to display on the fault slot.
   */
  function showFailure(message: string) {
    // clear first: a second wrong password gets its own full two seconds
    // rather than inheriting whatever was left of the first one's
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
   * Kick off one login attempt against greetd.
   *
   * Blank attempts and every attempt made while a login is already in
   * flight are inert — the `submit` transition is the lock around the
   * asynchronous call. Two Enter presses cannot race the greetd
   * protocol, which holds a single session under configuration at a
   * time and would cancel the first attempt when a second
   * `CreateSession` arrived (see `session.ts`).
   */
  function submit() {
    if (!password() || !dispatch({ type: "submit" })) return;

    const attempt = state.attempt;
    let secret = password();
    clearFault();
    writePassword("");

    login(secret)
      .then(() => {
        // GJS strings are immutable; dropping the last JS reference is the
        // strongest disposal available after greetd has consumed it.
        secret = "";
        if (dispatch({ type: "authenticationSucceeded", attempt })) {
          onAuthenticated();
        }
      })
      .catch((message: string) => {
        secret = "";
        if (dispatch({ type: "authenticationFailed", attempt })) {
          showFailure(message);
          restoreFocus();
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
   * accept input (an attempt is in flight) rolls the entry back to the
   * canonical value so a stray keystroke can't clobber it.
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

  // The greeter's window mount is effectively synchronous — no compositor
  // handshake, no async lock acquisition — so the machine moves from idle
  // through acquiring to locked at construction time.
  dispatch({ type: "acquire" });
  dispatch({ type: "acquired" });

  return {
    phase,
    password,
    fault,
    shake,
    register,
    update,
    submit,
    focus: restoreFocus,
  };
}
