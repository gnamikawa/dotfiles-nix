// The login screen: a clock, a password prompt, and nothing to choose.
//
// Three zones on a warm near-black wash — a centred clock, a bottom-left status
// rail, and bottom-right power verbs. The whole bottom band rests nearly
// invisible and lifts together when the pointer approaches; the clock is the
// one light source on the screen. Settled by prototype (issue #48); style.css
// carries the reasoning for the look and the timings.

import { createState, createComputed } from "ags"
import { createPoll } from "ags/time"
import { Gtk, Gdk } from "ags/gtk4"
import GLib from "gi://GLib"
import { host, kernel, nixosVersion, generation, uptime, battery } from "./sysinfo"
import { VERBS, run } from "./power"
import { login } from "./session"

// Set by the bundler to the directory the entry file was built from, which is
// the package's own share/ tree (cli/lib/esbuild.go). The icons ride along
// with it, so nothing here names a path outside the store.
declare const SRC: string

// Height of the bottom band the rail and the verbs sit in, mirrored at the top.
const BAND = 200

// How long a wrong password stays on screen before the surface forgets it.
// Long enough to read, short enough that walking back to the machine never
// shows a stale accusation.
const FAULT_MS = 2000

// Two states. The fast-drop-then-crawl shape lives entirely in the easing
// curve (see style.css) rather than in an intermediate state, so there is no
// knee to land on and nothing to time here.
//
// This still is not just a boolean: the name slot needs to keep its text while
// it fades out, so "which button" and "is it showing" have to be separate.
function createPhase() {
  const [phase, setPhase] = createState("ghost")
  return {
    phase,
    on: () => setPhase("lit"),
    off: () => setPhase("ghost"),
  }
}

export default function Greeter({ onAuthenticated }: { onAuthenticated: () => void }) {
  let entry: Gtk.Entry

  const [len, setLen] = createState(0)
  const [fault, setFault] = createState("")
  // A CSS animation only restarts when the class it hangs off changes, so a
  // second wrong password would land on the class already applied and sit
  // still. Alternating between two identical classes forces the change.
  const [shake, setShake] = createState(0)

  const time = createPoll("", 1000, () =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  )
  const date = createPoll("", 60000, () =>
    new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  )
  const up = createPoll("", 60000, uptime)
  const batt = createPoll(battery(), 60000, battery)
  const hasBattery = battery() !== null

  // The fault clears two ways — the timer below, or the first keystroke of the
  // next attempt — so whichever comes first has to cancel the other.
  let faultTimer = 0

  function clearFault() {
    if (faultTimer) {
      GLib.source_remove(faultTimer)
      faultTimer = 0
    }
    setFault("")
  }

  function fail(message: string) {
    // clear first: a second wrong password gets its own full two seconds
    // rather than inheriting whatever was left of the first one's
    clearFault()
    setFault(message)
    setShake(shake() === 0 ? 1 : 0)
    setLen(0)
    entry.set_text("")
    faultTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, FAULT_MS, () => {
      faultTimer = 0
      setFault("")
      return GLib.SOURCE_REMOVE
    })
  }

  // greetd holds one session under configuration at a time; a second submit
  // while login() is in flight makes the next CreateSession error, whose catch
  // cancels the *first* attempt mid-authentication (session.ts, the cancel in
  // login()). Drop the re-entry rather than race — two Enter presses is the
  // easiest way to trigger it and the last thing a login screen may punish.
  let busy = false

  function submit() {
    if (busy) return
    busy = true
    const password = entry.get_text()
    // Blank the field before the round trip so the dots do not sit filled
    // while greetd thinks; the entry is invisible, so only the dots move.
    setLen(0)
    entry.set_text("")
    login(password).then(onAuthenticated, fail).finally(() => {
      busy = false
    })
  }

  // The verbs are reachable from the keyboard as well as the pointer: the
  // ghost/lit language is proximity-driven, and a surface that needs a mouse to
  // power the machine off would be a defect (CONTEXT.md, Keyboard-first).
  function onKey(_e: Gtk.EventControllerKey, keyval: number) {
    if (keyval === Gdk.KEY_F11) return run(VERBS[0].command)
    if (keyval === Gdk.KEY_F12) return run(VERBS[1].command)
  }

  const PasswordEntry = () => (
    <entry
      $={(ref) => {
        entry = ref
      }}
      // On map, not in the ref callback above: that one runs while the widget
      // is still loose, before it has been added to a parent, and grab_focus
      // on an unrooted widget fails and returns false. Nothing then takes the
      // focus back up — the surface stays focusless and swallows every
      // keystroke, which looks exactly like a screen that ignores the
      // keyboard. `map` is the first moment the entry is both rooted and on
      // screen.
      onMap={(self) => {
        self.grab_focus()
      }}
      visibility={false}
      hexpand
      onNotifyText={({ text }) => {
        setLen(text.length)
        // > 0, so the blanking above does not cancel a timer just armed
        if (text.length > 0) clearFault()
      }}
      onActivate={submit}
    />
  )

  const Dots = () => (
    <box
      class={createComputed(() => (fault() ? `dots no${shake()}` : "dots"))}
      spacing={12}
      halign={Gtk.Align.CENTER}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <box class={createComputed(() => (fault() ? "dot bad" : len() > i ? "dot filled" : "dot"))} />
      ))}
    </box>
  )

  const Core = () => (
    <box class="core" orientation={Gtk.Orientation.VERTICAL} spacing={20} halign={Gtk.Align.CENTER}>
      <label class="date" label={date} />
      <label class="time" label={time} />
      <Dots />
      {/* Always occupies its space, coloured transparent when empty, so
          revealing a fault shifts nothing below it. */}
      <label
        class={createComputed(() => (fault() ? "fault shown" : "fault"))}
        label={createComputed(() => fault() || "authentication failed")}
      />
      <PasswordEntry />
    </box>
  )

  // ---------- the rail: status only, ghosted until looked at ----------

  const ROWS: Array<[string, any]> = [
    ["host", host],
    ["system", `NixOS ${nixosVersion}`],
    ["kernel", kernel],
    ["generation", generation],
    ["uptime", up],
  ]
  // Whether the row exists is fixed for the life of the screen — a machine does
  // not grow a battery — so this is a static push, not a <With>. Building it
  // reactively appends it after its siblings and reorders the rail.
  if (hasBattery) ROWS.push(["battery", createComputed(() => `${batt()?.pct ?? 0}%`)])

  const Rail = () => {
    const near = createPhase()
    return (
      <box
        class={createComputed(() => `rail ${near.phase()}`)}
        orientation={Gtk.Orientation.VERTICAL}
        valign={Gtk.Align.END}
      >
        <Gtk.EventControllerMotion onEnter={near.on} onLeave={near.off} />
        {ROWS.map(([key, value]) => (
          <box>
            {/* 11, not 10: "generation" is exactly 10 and would touch its value */}
            <label class="rail-key" label={key} xalign={0} widthChars={11} />
            <label class="rail-val" label={value} xalign={0} />
          </box>
        ))}
      </box>
    )
  }

  // ---------- the corner: verbs, ghosted the same way ----------

  // One name slot, to the left of a tight icon pair. The icons carry no text,
  // so they can sit next to each other; the slot is a fixed width, so naming
  // the hovered button moves nothing.
  const Verbs = () => {
    const near = createPhase()
    const slot = createPhase()
    const [name, setName] = createState("")
    return (
      <box class="rail" spacing={10} valign={Gtk.Align.END}>
        <Gtk.EventControllerMotion onEnter={near.on} onLeave={near.off} />
        {/* the text is not cleared on leave — it stays put and fades out, so
            the trail is of a name rather than of an empty label */}
        <label
          class={createComputed(() => `verb-label slot ${slot.phase()}`)}
          label={name}
          widthChars={10}
          xalign={1}
          valign={Gtk.Align.CENTER}
        />
        <box spacing={4}>
          {VERBS.map((v) => (
            <box class={createComputed(() => `verb ${near.phase()}`)}>
              <Gtk.EventControllerMotion
                onEnter={() => {
                  setName(v.label)
                  slot.on()
                }}
                onLeave={slot.off}
              />
              <Gtk.GestureClick onPressed={() => run(v.command)} />
              {/* Pre-rasterised PNGs: this GTK has no SVG loader, and a PNG
                  cannot be recoloured by CSS, so the icons are rendered at the
                  lit colour and dimmed by widget opacity instead. */}
              <image file={`${SRC}/icons/${v.icon}.png`} pixelSize={16} valign={Gtk.Align.CENTER} />
            </box>
          ))}
        </box>
      </box>
    )
  }

  // The bottom band is matched by an empty band of the same height at the top,
  // so the clock sits on the true centre of the screen rather than on the
  // centre of what the rail leaves over.
  return (
    <box class="warm" orientation={Gtk.Orientation.VERTICAL} hexpand vexpand>
      <Gtk.EventControllerKey onKeyPressed={onKey} />
      <box heightRequest={BAND} />
      <box vexpand halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} hexpand>
        <Core />
      </box>
      <box heightRequest={BAND}>
        <box hexpand halign={Gtk.Align.START} valign={Gtk.Align.END}>
          <Rail />
        </box>
        <box halign={Gtk.Align.END}>
          <Verbs />
        </box>
      </box>
    </box>
  )
}
