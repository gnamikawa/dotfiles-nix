// PROTOTYPE — keyboard-driven lifecycle simulator for issue 73.

import { initialState, reduce, type Event, type State } from "./machine"
import Gio from "gi://Gio"

let state = initialState
let nextMonitor = 1

function dispatch(event: Event) {
  state = reduce(state, event)
  render()
}

function render() {
  print("\x1b[2J\x1b[H\x1b[1mAGS session-lock prototype\x1b[0m")
  print(JSON.stringify(state, null, 2))
  print("")
  print("\x1b[1ma\x1b[0m acquire   \x1b[1ml\x1b[0m acquired   \x1b[1mf\x1b[0m acquisition failed")
  print("\x1b[1m+\x1b[0m add monitor   \x1b[1m-\x1b[0m remove monitor")
  print("\x1b[1ms\x1b[0m submit   \x1b[1mw\x1b[0m wrong password   \x1b[1my\x1b[0m auth succeeds")
  print("\x1b[1mu\x1b[0m unlock signal   \x1b[1mc\x1b[0m roundtrip complete   \x1b[1mk\x1b[0m process death")
  print("\x1b[1mr\x1b[0m reset   \x1b[1mq\x1b[0m quit")
}

function eventFor(key: string): Event | null {
  switch (key) {
    case "a": return { type: "acquire" }
    case "l": return { type: "acquired" }
    case "f": return { type: "acquisitionFailed" }
    case "+": return { type: "monitorAdded", monitor: `monitor-${nextMonitor++}` }
    case "-": return state.monitors.length
      ? { type: "monitorRemoved", monitor: state.monitors.at(-1)! }
      : null
    case "s": return { type: "submit" }
    case "w": return { type: "authenticationFailed", attempt: state.attempt }
    case "y": return { type: "authenticationSucceeded", attempt: state.attempt }
    case "u": return { type: "unlockSignalled" }
    case "c": return { type: "unlockRoundtripCompleted" }
    case "k": return { type: "processDied" }
    default: return null
  }
}

const stdin = new Gio.DataInputStream({
  base_stream: new Gio.UnixInputStream({ fd: 0, close_fd: false }),
})

render()
while (true) {
  const key = String.fromCharCode(stdin.read_byte(null))
  if (key === "q") break
  if (key === "r") {
    state = initialState
    render()
    continue
  }
  const event = eventFor(key)
  if (event) dispatch(event)
}
