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
  | "failed"

export type State = {
  phase: Phase
  attempt: number
}

export type Event =
  | { type: "acquire" }
  | { type: "acquired" }
  | { type: "acquisitionFailed" }
  | { type: "submit" }
  | { type: "authenticationFailed"; attempt: number }
  | { type: "authenticationSucceeded"; attempt: number }
  | { type: "unlockSignalled" }
  | { type: "unlockRoundtripCompleted" }

export const initialState: State = {
  phase: "idle",
  attempt: 0,
}

export function acceptsPasswordInput(state: State): boolean {
  return state.phase === "locked"
}

export function showsAuthenticationActivity(phase: Phase): boolean {
  return phase === "authenticating"
}

export function reduce(state: State, event: Event): State {
  switch (event.type) {
    case "acquire":
      return state.phase === "idle" ? { ...state, phase: "acquiring" } : state
    case "acquired":
      return state.phase === "acquiring" ? { ...state, phase: "locked" } : state
    case "acquisitionFailed":
      return state.phase === "acquiring" ? { ...state, phase: "failed" } : state
    case "submit":
      return state.phase === "locked"
        ? { ...state, phase: "authenticating", attempt: state.attempt + 1 }
        : state
    case "authenticationFailed":
      return state.phase === "authenticating" && state.attempt === event.attempt
        ? { ...state, phase: "locked" }
        : state
    case "authenticationSucceeded":
      return state.phase === "authenticating" && state.attempt === event.attempt
        ? { ...state, phase: "unlocking" }
        : state
    case "unlockSignalled":
      return state.phase === "acquiring" ||
        state.phase === "locked" ||
        state.phase === "authenticating"
        ? { ...state, phase: "unlocking" }
        : state
    case "unlockRoundtripCompleted":
      return state.phase === "unlocking" ? { ...state, phase: "unlocked" } : state
  }
}
