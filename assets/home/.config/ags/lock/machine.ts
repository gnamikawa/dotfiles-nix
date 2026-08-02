// The security-relevant lifecycle of the production session lock. GTK and PAM
// effects live in controller.ts; keeping the transition rules here makes it
// explicit which events are allowed to advance or release the lock.

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
