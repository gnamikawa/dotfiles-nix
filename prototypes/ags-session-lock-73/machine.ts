// PROTOTYPE — throw this directory away after issue 73 is decided.
//
// Question: can one seat-wide state machine keep every session-lock window in
// sync while making acquisition, authentication, compositor unlock, and
// fail-closed process death explicit? I/O belongs to main.tsx and simulate.ts;
// this reducer is deliberately portable.

export type Phase =
  | "idle"
  | "acquiring"
  | "locked"
  | "authenticating"
  | "unlocked"
  | "failed"
  | "dead"

export type State = {
  phase: Phase
  monitors: readonly string[]
  attempt: number
  error: string | null
  recovery: string | null
}

export type Event =
  | { type: "acquire" }
  | { type: "acquired" }
  | { type: "acquisitionFailed" }
  | { type: "monitorAdded"; monitor: string }
  | { type: "monitorRemoved"; monitor: string }
  | { type: "submit" }
  | { type: "authenticationFailed"; attempt: number }
  | { type: "authenticationSucceeded"; attempt: number }
  | { type: "compositorUnlocked" }
  | { type: "processDied" }

export const initialState: State = {
  phase: "idle",
  monitors: [],
  attempt: 0,
  error: null,
  recovery: null,
}

export function reduce(state: State, event: Event): State {
  switch (event.type) {
    case "acquire":
      return state.phase === "idle"
        ? { ...state, phase: "acquiring", error: null }
        : state
    case "acquired":
      return state.phase === "acquiring" ? { ...state, phase: "locked" } : state
    case "acquisitionFailed":
      return state.phase === "acquiring"
        ? { ...state, phase: "failed", error: "could not acquire the compositor lock" }
        : state
    case "monitorAdded":
      return state.monitors.includes(event.monitor)
        ? state
        : { ...state, monitors: [...state.monitors, event.monitor] }
    case "monitorRemoved":
      return {
        ...state,
        monitors: state.monitors.filter((monitor) => monitor !== event.monitor),
      }
    case "submit":
      return state.phase === "locked"
        ? {
            ...state,
            phase: "authenticating",
            attempt: state.attempt + 1,
            error: null,
          }
        : state
    case "authenticationFailed":
      return state.phase === "authenticating" && state.attempt === event.attempt
        ? { ...state, phase: "locked", error: "authentication failed" }
        : state
    case "authenticationSucceeded":
      // The effect layer calls unlock only when this transition is accepted.
      return state.phase === "authenticating" && state.attempt === event.attempt
        ? { ...state, phase: "unlocked", error: null }
        : state
    case "compositorUnlocked":
      return state.phase === "locked" || state.phase === "authenticating"
        ? { ...state, phase: "unlocked", error: null }
        : state
    case "processDied":
      return state.phase === "locked" || state.phase === "authenticating"
        ? {
            ...state,
            phase: "dead",
            recovery:
              "fail-closed: switch to a TTY, authenticate, and terminate the Hyprland session",
          }
        : state
  }
}
