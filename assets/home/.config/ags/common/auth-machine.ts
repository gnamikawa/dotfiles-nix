// The auth-screen state machine, shared by the greeter and the session lock.
//
// The transitions the view cares about are the two the predicates below
// answer: is the password entry accepting input (locked), and is an attempt in
// flight (authenticating). The rest of the phases model each surface's own
// lifecycle — the greeter is effectively synchronous (window mount, then
// straight to locked), the session lock has to hand-shake with the compositor
// (acquiring → locked, unlocking → unlocked). Keeping every phase in one
// enum means both surfaces speak one vocabulary; each simply doesn't dispatch
// the events its context has no analogue for.
//
// The attempt counter is what a controller uses to ignore a late
// authentication callback belonging to a superseded attempt — a stale reply
// arriving after the user has already retried.

export type Phase =
  | "idle"
  | "acquiring"
  | "locked"
  | "authenticating"
  | "unlocking"
  | "unlocked"
  | "failed";

export type State = {
  phase: Phase;
  attempt: number;
};

export type Event =
  | { type: "acquire" }
  | { type: "acquired" }
  | { type: "acquisitionFailed" }
  | { type: "submit" }
  | { type: "authenticationFailed"; attempt: number }
  | { type: "authenticationSucceeded"; attempt: number }
  | { type: "unlockSignalled" }
  | { type: "unlockRoundtripCompleted" };

export const initialState: State = {
  phase: "idle",
  attempt: 0,
};

/**
 * Predicate: does the current state accept password keystrokes?
 *
 * Locked is the only phase in which the entry is unlocked for input; every
 * other phase either has no entry yet (idle, acquiring) or has an attempt
 * in flight and would clobber it (authenticating, unlocking, unlocked,
 * failed).
 *
 * @param state - Current machine state.
 * @returns True while the entry accepts input.
 */
export function acceptsPasswordInput(state: State): boolean {
  return state.phase === "locked";
}

/**
 * Predicate: is an authentication attempt currently in flight?
 *
 * The view uses this to switch the entry into its "checking…" affordance
 * and to gate the shake animation until the failure phase lands.
 *
 * @param phase - Current phase.
 * @returns True while an attempt is being verified.
 */
export function showsAuthenticationActivity(phase: Phase): boolean {
  return phase === "authenticating";
}

/**
 * Pure state-machine step: fold an event into the next state.
 *
 * Events that don't apply to the current phase are ignored (the same state
 * is returned) — this is how a late `authenticationFailed` from a
 * superseded attempt gets discarded when the user has already retried.
 *
 * @param state - Current machine state.
 * @param event - Event dispatched by the controller.
 * @returns The next state; the same reference when the event was ignored.
 */
export function reduce(state: State, event: Event): State {
  switch (event.type) {
    case "acquire":
      return state.phase === "idle" ? { ...state, phase: "acquiring" } : state;
    case "acquired":
      return state.phase === "acquiring"
        ? { ...state, phase: "locked" }
        : state;
    case "acquisitionFailed":
      return state.phase === "acquiring"
        ? { ...state, phase: "failed" }
        : state;
    case "submit":
      return state.phase === "locked"
        ? { ...state, phase: "authenticating", attempt: state.attempt + 1 }
        : state;
    case "authenticationFailed":
      return state.phase === "authenticating" && state.attempt === event.attempt
        ? { ...state, phase: "locked" }
        : state;
    case "authenticationSucceeded":
      return state.phase === "authenticating" && state.attempt === event.attempt
        ? { ...state, phase: "unlocking" }
        : state;
    case "unlockSignalled":
      return state.phase === "acquiring" ||
        state.phase === "locked" ||
        state.phase === "authenticating"
        ? { ...state, phase: "unlocking" }
        : state;
    case "unlockRoundtripCompleted":
      return state.phase === "unlocking"
        ? { ...state, phase: "unlocked" }
        : state;
  }
}
