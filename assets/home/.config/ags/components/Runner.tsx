// The runner's content: a text entry above a filtered application list, in
// the wofi/dmenu mould. Alt+F3 pops the surface; the user types to narrow
// the list, Up/Down navigate, Enter launches the highlighted app (or falls
// back to executing the raw text via Hyprland when nothing matches), and
// Escape dismisses.
//
// The layer-shell surface that hosts it lives in desktop/Desktop.tsx and is
// presence-gated by runnerOpen; that surface owns keymode EXCLUSIVE so the
// entry can receive keys. Runner itself takes no props.

import { createComputed, createEffect, createState, With } from "ags";
import { Gtk } from "ags/gtk4";
import Gdk from "gi://Gdk?version=4.0";
import AstalApps from "gi://AstalApps";
import AstalHyprland from "gi://AstalHyprland";
import { runnerOpen, setRunnerOpen } from "../common/runner";

// Cap the visible list so a broad query (or an empty one) doesn't unfold into
// a screen-tall menu — dmenu's terse ceiling, not wofi's scroller.
const MAX_RESULTS = 10;

const hyprland = AstalHyprland.get_default();
// One Apps instance is enough — it caches its scan of desktop entries and
// exposes fuzzy_query synchronously, so the runner can keep result assembly
// inside a reactive computed instead of async plumbing.
const apps = new AstalApps.Apps();

export default function Runner() {
  let entry: Gtk.Entry | null = null;
  const [query, setQuery] = createState("");
  const [selected, setSelected] = createState(0);

  const results = createComputed(() =>
    apps.fuzzy_query(query().trim()).slice(0, MAX_RESULTS),
  );

  // A single computed marries results and the selected index so the row list
  // and its highlight rebuild atomically — otherwise the highlight can lag one
  // frame behind a fresh query and briefly point at a stale row.
  const view = createComputed(() => {
    const rs = results();
    const sel = selected();
    return { rs, sel: rs.length === 0 ? 0 : Math.min(sel, rs.length - 1) };
  });

  function submit() {
    const rs = results();
    const sel = selected();
    const chosen = rs[Math.min(sel, rs.length - 1)];
    const raw = query().trim();
    setRunnerOpen(false);
    // Dispatch via Hyprland's `exec` (double-forks and detaches) so the
    // launched app doesn't end up in ags's systemd cgroup and get SIGKILL'd
    // on `systemctl restart ags`. AstalApps.launch() doesn't detach.
    if (chosen) {
      const cmd = (chosen.executable || "").replace(/\s%[fFuU]/g, "").trim();
      if (cmd) hyprland.dispatch("exec", cmd);
    } else if (raw) {
      hyprland.dispatch("exec", raw);
    }
  }

  function wire(self: Gtk.Entry) {
    entry = self;
    self.connect("activate", submit);
    self.connect("changed", () => {
      setQuery(self.text ?? "");
      setSelected(0);
    });

    // The entry swallows arrow keys by default (caret navigation); intercept
    // them via a key controller so Up/Down move the selection instead.
    const keys = new Gtk.EventControllerKey();
    keys.connect("key-pressed", (_c, keyval) => {
      if (keyval === Gdk.KEY_Escape) {
        setRunnerOpen(false);
        return true;
      }
      if (keyval === Gdk.KEY_Down) {
        setSelected((i) => {
          const max = results().length - 1;
          return max < 0 ? 0 : Math.min(max, i + 1);
        });
        return true;
      }
      if (keyval === Gdk.KEY_Up) {
        setSelected((i) => Math.max(0, i - 1));
        return true;
      }
      return false;
    });
    self.add_controller(keys);
  }

  // On open, hand focus to the entry so the user can type immediately. On
  // close, clear the field and reset selection so the next open starts fresh.
  createEffect(() => {
    if (runnerOpen()) {
      entry?.grab_focus();
    } else {
      entry?.set_text("");
      setQuery("");
      setSelected(0);
    }
  });

  return (
    <box
      class="runner-wrap"
      orientation={Gtk.Orientation.VERTICAL}
      spacing={0}
    >
      <entry
        class="runner-input"
        hexpand
        hasFrame={false}
        placeholderText="Run…"
        $={wire}
      />
      <With value={view}>
        {(d) => {
          if (d.rs.length === 0) return <box />;
          return (
            <box
              class="runner-list"
              orientation={Gtk.Orientation.VERTICAL}
              spacing={0}
            >
              {d.rs.map((a, i) => (
                <box
                  class={`runner-row ${i === d.sel ? "selected" : ""}`}
                  spacing={10}
                >
                  <image
                    class="runner-icon"
                    iconName={a.iconName || "application-x-executable"}
                    pixelSize={24}
                  />
                  <box
                    orientation={Gtk.Orientation.VERTICAL}
                    hexpand
                    spacing={0}
                  >
                    <label class="runner-name" label={a.name} xalign={0} />
                    <label
                      class="runner-desc"
                      label={a.description || a.executable || ""}
                      xalign={0}
                      ellipsize={3}
                      maxWidthChars={60}
                    />
                  </box>
                </box>
              ))}
            </box>
          );
        }}
      </With>
    </box>
  );
}
