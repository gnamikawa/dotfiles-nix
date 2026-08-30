// The auth panel shared by the greeter and the lock screens. What is on
// screen — a clock, a status rail, two power verbs, and eight password dots —
// is the same in both contexts; only how the password is authenticated and how
// the window is hosted differ, and both of those live behind the Controller
// interface and each screen's own main.tsx.
//
// Three zones on a warm near-black wash — a centred clock, a bottom-left
// status rail, and bottom-right power verbs. The whole bottom band rests
// nearly invisible and lifts together when the pointer approaches; the clock
// is the one light source on the screen. Settled by prototype (issue #48);
// style.css carries the reasoning for the look and the timings.

import { createComputed, createState } from "ags";
import { createPoll } from "ags/time";
import { Gtk, Gdk } from "ags/gtk4";
import type { Controller } from "../../common/controller";
import { showsAuthenticationActivity } from "../../common/auth-machine";
import { VERBS, run } from "../../common/power";
import {
  host,
  kernel,
  nixosVersion,
  generation,
  uptime,
  battery,
} from "../../common/sysinfo";

// SRC is the entry file's directory (env.d.ts). Both packages lay their source
// out with `greeter/` (or `lock/`) as a sibling of `components/auth/`, so
// this relative path resolves the same way from either entry.
declare const SRC: string;
const ICON_BASE = `${SRC}/../components/auth/icons`;

// Height of the bottom band the rail and the verbs sit in, mirrored at the top.
const BAND = 200;

/**
 * Two-state "ghost / lit" phase used by the rail and the verbs to fade
 * together when a pointer approaches.
 *
 * The fast-drop-then-crawl shape lives entirely in the easing curve
 * (`style.css`) rather than in an intermediate state, so there is no knee
 * to land on and nothing to time here.
 *
 * @returns The phase accessor plus setter helpers.
 */
function createPhase() {
  const [phase, setPhase] = createState("ghost");
  return {
    phase,
    /** Transition to `"lit"`. */
    on: () => setPhase("lit"),
    /** Transition back to `"ghost"`. */
    off: () => setPhase("ghost"),
  };
}

/**
 * The auth-panel content shared by the greeter and the session lock.
 *
 * Screen layout is a centred clock with a bottom band that carries a
 * status rail (left) and two power verbs (right); the whole band lifts
 * from `"ghost"` to `"lit"` as the pointer approaches. Authentication
 * and window mechanics are delegated to `controller`, so the same panel
 * runs against greetd, PAM, layer-shell, and `Gtk4SessionLock`.
 *
 * @param props.controller - Controller carrying the auth machine.
 */
export default function Auth({ controller }: { controller: Controller }) {
  const time = createPoll("", 1000, () =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const date = createPoll("", 60000, () =>
    new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
  const up = createPoll("", 60000, uptime);
  const batt = createPoll(battery(), 60000, battery);
  const hasBattery = battery() !== null;

  // The verbs are reachable from the keyboard as well as the pointer: the
  // ghost/lit language is proximity-driven, and a surface that needs a mouse to
  // power the machine off would be a defect (CONTEXT.md, Keyboard-first).
  /**
   * Root-level key handler: F11 fires the hibernate verb, F12 fires the
   * power-off verb. Both must be reachable without a pointer.
   *
   * @param _e - Controller (unused).
   * @param keyval - Gdk key value from the key-pressed signal.
   */
  function onKey(_e: Gtk.EventControllerKey, keyval: number) {
    if (keyval === Gdk.KEY_F11) return run(VERBS[0].command);
    if (keyval === Gdk.KEY_F12) return run(VERBS[1].command);
  }

  /**
   * The hidden password entry. Grabs focus on map (not on ref) — an
   * unrooted grab returns false and leaves the surface focusless.
   */
  const PasswordEntry = () => (
    <entry
      $={controller.register}
      // On map, not in the ref callback: that one runs while the widget is
      // still loose, before it has been added to a parent, and grab_focus on
      // an unrooted widget fails and returns false. Nothing then takes the
      // focus back up — the surface stays focusless and swallows every
      // keystroke, which looks exactly like a screen that ignores the
      // keyboard. `map` is the first moment the entry is both rooted and on
      // screen.
      onMap={(self) => self.grab_focus()}
      visibility={false}
      hexpand
      onNotifyText={(self) => controller.update(self)}
      onActivate={controller.submit}
    />
  );

  /**
   * The eight password dots. Fill left-to-right with the password length,
   * flip to the shake class on fault (alternating `no0`/`no1` so the CSS
   * animation retriggers on back-to-back failures), and switch to the
   * `"authenticating"` variant while an attempt is in flight.
   */
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
            if (controller.fault()) return "dot";
            return controller.password().length > i ? "dot filled" : "dot";
          })}
        />
      ))}
    </box>
  );

  /**
   * The centre column: date, time, dots, an always-present fault slot,
   * and the hidden password entry — one stack whose height does not
   * change when a fault is revealed.
   */
  const Core = () => (
    <box
      class="core"
      orientation={Gtk.Orientation.VERTICAL}
      spacing={20}
      halign={Gtk.Align.CENTER}
    >
      <label class="date" label={date} />
      <label class="time" label={time} />
      <Dots />
      {/* Always occupies its space, coloured transparent when empty, so
          revealing a fault shifts nothing below it. */}
      <label
        class={createComputed(() =>
          controller.fault() ? "fault shown" : "fault",
        )}
        label={createComputed(
          () => controller.fault() || "authentication failed",
        )}
      />
      <PasswordEntry />
    </box>
  );

  // ---------- the rail: status only, ghosted until looked at ----------

  const rows: Array<[string, any]> = [
    ["host", host],
    ["system", `NixOS ${nixosVersion}`],
    ["kernel", kernel],
    ["generation", generation],
    ["uptime", up],
  ];
  // Whether the row exists is fixed for the life of the screen — a machine does
  // not grow a battery — so this is a static push, not a <With>. Building it
  // reactively appends it after its siblings and reorders the rail.
  if (hasBattery)
    rows.push(["battery", createComputed(() => `${batt()?.pct ?? 0}%`)]);

  /**
   * The bottom-left status rail: host / system / kernel / generation /
   * uptime (plus battery when the machine has one). Ghosts by default,
   * lifts to `"lit"` on pointer proximity.
   */
  const Rail = () => {
    const near = createPhase();
    return (
      <box
        class={createComputed(() => `rail ${near.phase()}`)}
        orientation={Gtk.Orientation.VERTICAL}
        valign={Gtk.Align.END}
      >
        <Gtk.EventControllerMotion onEnter={near.on} onLeave={near.off} />
        {rows.map(([key, value]) => (
          <box>
            {/* 11, not 10: "generation" is exactly 10 and would touch its value */}
            <label class="rail-key" label={key} xalign={0} widthChars={11} />
            <label class="rail-val" label={value} xalign={0} />
          </box>
        ))}
      </box>
    );
  };

  // ---------- the corner: verbs, ghosted the same way ----------

  // One name slot, to the left of a tight icon pair. The icons carry no text,
  // so they can sit next to each other; the slot is a fixed width, so naming
  // the hovered button moves nothing.
  /**
   * The bottom-right power verbs: a fixed-width name slot next to a tight
   * icon pair. Hovering an icon writes its label into the slot; the label
   * is left in place on leave and fades out, so the trail is of a name
   * rather than of an empty label.
   */
  const Verbs = () => {
    const near = createPhase();
    const slot = createPhase();
    const [name, setName] = createState("");
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
                  setName(v.label);
                  slot.on();
                }}
                onLeave={slot.off}
              />
              <Gtk.GestureClick onPressed={() => run(v.command)} />
              {/* Pre-rasterised PNGs: this GTK has no SVG loader, and a PNG
                  cannot be recoloured by CSS, so the icons are rendered at the
                  lit colour and dimmed by widget opacity instead. */}
              <image
                file={`${ICON_BASE}/${v.icon}.png`}
                pixelSize={16}
                valign={Gtk.Align.CENTER}
              />
            </box>
          ))}
        </box>
      </box>
    );
  };

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
  );
}
