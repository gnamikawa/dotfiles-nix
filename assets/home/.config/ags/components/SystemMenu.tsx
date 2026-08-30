// The system-menu overlay's content: a card centred over the shaded screen
// listing each uncommon action alongside the Alt+Shift+<key> chord that
// invokes it. The layer-shell surface that hosts it lives in
// desktop/Desktop.tsx and is presence-gated by systemMenuOpen.
//
// The wrap fills the whole surface (hexpand+vexpand) and paints the scrim
// via `.system-menu-wrap`; the card is centred inside via halign/valign on
// its own box. Splitting scrim and centring cleanly is what keeps the shade
// visible on the whole screen, not just behind the card.
//
// This component owns no state and no key handling. The Hyprland binds
// (hypr/binds.lua) fire the actions directly — the menu is a legend, not an
// interactive picker.

import { Gtk } from "ags/gtk4";
import { VERBS } from "../common/system-menu";

/**
 * The system-menu overlay's content: a scrimmed card listing each
 * uncommon action with its Alt+Shift+<key> chord. The card is a legend;
 * the Hyprland binds in `hypr/binds.lua` fire the actions themselves.
 *
 * Takes no props — the layer-shell surface in `desktop/Desktop.tsx` owns
 * presence gating.
 */
export default function SystemMenu() {
  return (
    <box
      class="system-menu-wrap"
      hexpand
      vexpand
      halign={Gtk.Align.FILL}
      valign={Gtk.Align.FILL}
    >
      <box
        class="system-menu"
        orientation={Gtk.Orientation.VERTICAL}
        spacing={0}
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
      >
        <box class="system-menu-header" spacing={8}>
          <label
            class="system-menu-header-label"
            label="System"
            xalign={0}
            hexpand
          />
          <label
            class="system-menu-header-hint"
            label="hold Alt+Shift"
            xalign={1}
          />
        </box>
        {VERBS.map((verb) => (
          <box class="system-menu-row" spacing={12}>
            <box
              orientation={Gtk.Orientation.VERTICAL}
              hexpand
              spacing={0}
            >
              <label
                class="system-menu-label"
                label={verb.label}
                xalign={0}
              />
              <label
                class="system-menu-desc"
                label={verb.description}
                xalign={0}
              />
            </box>
            <label class="system-menu-chord" label={verb.chord} xalign={1} />
          </box>
        ))}
      </box>
    </box>
  );
}
