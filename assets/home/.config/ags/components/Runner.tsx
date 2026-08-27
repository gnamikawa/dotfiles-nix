// The runner's content: a text entry that dispatches its text through
// Hyprland's exec dispatcher on Enter, and closes on Enter or Escape. The
// dmenu_run replacement: Alt+F3 pops this surface, the user types a command,
// Enter runs it and dismisses.
//
// The layer-shell surface that hosts it lives in desktop/Desktop.tsx and is
// presence-gated by runnerOpen; that surface owns keymode EXCLUSIVE so the
// entry can receive keys. Runner itself takes no props.

import { createEffect } from "ags";
import { Gtk } from "ags/gtk4";
import Gdk from "gi://Gdk?version=4.0";
import AstalHyprland from "gi://AstalHyprland";
import { runnerOpen, setRunnerOpen } from "../common/runner";

const hyprland = AstalHyprland.get_default();

export default function Runner() {
  let entry: Gtk.Entry | null = null;

  function wire(self: Gtk.Entry) {
    entry = self;

    self.connect("activate", () => {
      const value = self.text.trim();
      self.set_text("");
      setRunnerOpen(false);
      if (value) {
        hyprland.dispatch("exec", value);
      }
    });

    const keys = new Gtk.EventControllerKey();
    keys.connect("key-pressed", (_c, keyval) => {
      if (keyval === Gdk.KEY_Escape) {
        self.set_text("");
        setRunnerOpen(false);
        return true;
      }
      return false;
    });
    self.add_controller(keys);
  }

  // On open, hand focus to the entry so the user can type immediately. On
  // close, clear the field so the next open starts blank.
  createEffect(() => {
    if (runnerOpen()) {
      entry?.grab_focus();
    } else {
      entry?.set_text("");
    }
  });

  return (
    <box class="runner-wrap">
      <entry
        class="runner-input"
        hexpand
        placeholderText="Run…"
        $={wire}
      />
    </box>
  );
}
