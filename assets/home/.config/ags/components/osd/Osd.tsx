// The bottom-right transient OSD: a hardware-key readout for volume,
// brightness, mic mute, Bluetooth, and the combined radio toggle.
//
// Two physical metaphors (ADR-0009), chosen by kind (ADR-0011 — the shape
// changes with what's being shown rather than one skeleton holding both):
//   - Fader (volume, brightness): a slider position. No numeric readout
//     (ADR-0010) — the fill level itself is the state, exactly like a
//     physical volume knob doesn't print its own angle in degrees. Volume's
//     mute state overlays the same fader as a dimmed fill plus an "x" icon,
//     rather than becoming its own object.
//   - Toggle (mic, bluetooth, radio): a status LED beside a switch — lit
//     (green) when on, dim (gray) when off, encoded entirely in icon choice
//     and colour, again with no text.
//
// The surface that mounts this lives in desktop/Desktop.tsx, on the primary
// output only (volume/brightness/radios are host-wide, not per-monitor).
// Content arrives as a single snapshot per trigger from common/osd.ts —
// see that file for why this doesn't use a live Astal binding.

import { Gtk } from "ags/gtk4";
import { With, createEffect } from "ags";
import { lucideIcon } from "../../common/icons";
import { osdContent, OsdContent, OsdKind } from "../../common/osd";

const FADER_TRACK_PX = 64;

/**
 * Lucide icon basename for a content snapshot.
 *
 * Volume and the two radio-adjacent toggles swap glyph on state so the icon
 * itself carries the on/off encoding, not just the LED colour class.
 */
function iconFor(c: OsdContent): string {
  switch (c.kind) {
    case "volume":
      return c.on === false ? "volume-x" : "volume-2";
    case "brightness":
      return "sun";
    case "mic":
      return c.on ? "mic" : "mic-off";
    case "bluetooth":
      return c.on ? "bluetooth" : "bluetooth-off";
    case "radio":
      // Airplane icon when radios are off (literally "airplane mode"),
      // radio tower when on — matches the physical key's own glyph.
      return c.on ? "radio-tower" : "plane";
    default:
      return "circle";
  }
}

/** Fader kinds render a fill bar; the rest render a single status icon. */
function isFader(kind: OsdKind): boolean {
  return kind === "volume" || kind === "brightness";
}

export default function Osd() {
  let plate: Gtk.Box | null = null;
  // Same GTK dirty-region workaround as MonitorId.tsx: <With> disposes and
  // rebuilds this subtree on every trigger, and the redraw sometimes misses
  // the old widget's bounds (stale pixels from a wider/taller previous
  // render). Force a full redraw whenever content changes.
  createEffect(() => {
    osdContent();
    plate?.queue_draw();
  });

  return (
    <box
      $={(self) => (plate = self)}
      class="osd-plate"
      orientation={Gtk.Orientation.HORIZONTAL}
      spacing={8}
      valign={Gtk.Align.CENTER}
      halign={Gtk.Align.CENTER}
    >
      <With value={osdContent}>
        {(c) => {
          if (c === null) return <box />;
          const icon = iconFor(c);
          if (isFader(c.kind)) {
            const level = Math.max(0, Math.min(100, c.level ?? 0));
            const fillPx = Math.round((level / 100) * FADER_TRACK_PX);
            return (
              <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
                <image
                  class="osd-icon"
                  pixelSize={18}
                  $={(self) => self.set_from_gicon(lucideIcon(icon))}
                />
                <box class="osd-fader-track" valign={Gtk.Align.CENTER}>
                  <box
                    class={`osd-fader-fill ${c.on === false ? "muted" : ""}`}
                    widthRequest={fillPx}
                  />
                </box>
              </box>
            );
          }
          return (
            <image
              class={`osd-icon osd-toggle-icon ${c.on ? "on" : "off"}`}
              pixelSize={22}
              $={(self) => self.set_from_gicon(lucideIcon(icon))}
            />
          );
        }}
      </With>
    </box>
  );
}
