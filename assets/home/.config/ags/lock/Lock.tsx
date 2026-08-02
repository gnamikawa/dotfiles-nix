// The session lock deliberately speaks the greeter's visual language without
// sharing its greetd-specific authentication or its layer-shell window.

import { createComputed, createState } from "ags"
import { createPoll } from "ags/time"
import { Gdk, Gtk } from "ags/gtk4"
import { host, kernel, nixosVersion, generation, uptime, battery } from "../greeter/sysinfo"
import { VERBS, run } from "../greeter/power"
import type { LockController } from "./controller"
import { showsAuthenticationActivity } from "./machine"

const BAND = 200

// Set by the bundler to the entry file's directory. The shared greeter icons
// live beside it one directory up in the packaged source tree.
declare const SRC: string

function createPhase() {
  const [phase, setPhase] = createState("ghost")
  return {
    phase,
    on: () => setPhase("lit"),
    off: () => setPhase("ghost"),
  }
}

export default function Lock({ controller }: { controller: LockController }) {
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

  function onKey(_e: Gtk.EventControllerKey, keyval: number) {
    if (keyval === Gdk.KEY_F11) return run(VERBS[0].command)
    if (keyval === Gdk.KEY_F12) return run(VERBS[1].command)
  }

  const PasswordEntry = () => (
    <entry
      $={controller.register}
      onMap={(self) => self.grab_focus()}
      visibility={false}
      sensitive={createComputed(() => controller.phase() === "locked")}
      hexpand
      onNotifyText={(self) => controller.update(self)}
      onActivate={controller.submit}
    />
  )

  const Dots = () => (
    <box
      class={createComputed(() =>
        controller.fault()
          ? `dots no${controller.shake()}`
          : showsAuthenticationActivity(controller.phase())
            ? "dots authenticating"
            : "dots",
      )}
      spacing={12}
      halign={Gtk.Align.CENTER}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <box
          class={createComputed(() => {
            if (controller.fault()) return "dot"
            return controller.password().length > i ? "dot filled" : "dot"
          })}
        />
      ))}
    </box>
  )

  const Core = () => (
    <box class="core" orientation={Gtk.Orientation.VERTICAL} spacing={20} halign={Gtk.Align.CENTER}>
      <label class="date" label={date} />
      <label class="time" label={time} />
      <Dots />
      <label
        class={createComputed(() => (controller.fault() ? "fault shown" : "fault"))}
        label={createComputed(() => controller.fault() || "authentication failed")}
      />
      <PasswordEntry />
    </box>
  )

  const rows: Array<[string, any]> = [
    ["host", host],
    ["system", `NixOS ${nixosVersion}`],
    ["kernel", kernel],
    ["generation", generation],
    ["uptime", up],
  ]
  if (hasBattery) rows.push(["battery", createComputed(() => `${batt()?.pct ?? 0}%`)])

  const Rail = () => {
    const near = createPhase()
    return (
      <box
        class={createComputed(() => `rail ${near.phase()}`)}
        orientation={Gtk.Orientation.VERTICAL}
        valign={Gtk.Align.END}
      >
        <Gtk.EventControllerMotion onEnter={near.on} onLeave={near.off} />
        {rows.map(([key, value]) => (
          <box>
            <label class="rail-key" label={key} xalign={0} widthChars={11} />
            <label class="rail-val" label={value} xalign={0} />
          </box>
        ))}
      </box>
    )
  }

  const Verbs = () => {
    const near = createPhase()
    const slot = createPhase()
    const [name, setName] = createState("")
    return (
      <box class="rail" spacing={10} valign={Gtk.Align.END}>
        <Gtk.EventControllerMotion onEnter={near.on} onLeave={near.off} />
        <label
          class={createComputed(() => `verb-label slot ${slot.phase()}`)}
          label={name}
          widthChars={10}
          xalign={1}
          valign={Gtk.Align.CENTER}
        />
        <box spacing={4}>
          {VERBS.map((verb) => (
            <box class={createComputed(() => `verb ${near.phase()}`)}>
              <Gtk.EventControllerMotion
                onEnter={() => {
                  setName(verb.label)
                  slot.on()
                }}
                onLeave={slot.off}
              />
              <Gtk.GestureClick onPressed={() => run(verb.command)} />
              <image
                file={`${SRC}/../greeter/icons/${verb.icon}.png`}
                pixelSize={16}
                valign={Gtk.Align.CENTER}
              />
            </box>
          ))}
        </box>
      </box>
    )
  }

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
