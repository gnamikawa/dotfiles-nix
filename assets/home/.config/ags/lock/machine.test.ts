import {
  acceptsPasswordInput,
  initialState,
  reduce,
  showsAuthenticationActivity,
} from "./machine"

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const acquiring = reduce(initialState, { type: "acquire" })
const locked = reduce(acquiring, { type: "acquired" })
const authenticating = reduce(locked, { type: "submit" })

assert(acceptsPasswordInput(locked), "locked state must accept password input")
assert(
  !acceptsPasswordInput(authenticating),
  "authenticating state must reject password input",
)
assert(
  !showsAuthenticationActivity(locked.phase),
  "locked state must not show authentication activity",
)
assert(
  showsAuthenticationActivity(authenticating.phase),
  "authenticating state must show authentication activity",
)
