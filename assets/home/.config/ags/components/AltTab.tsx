// The alt-tab overlay's content: the focused workspace's clients as a
// vertical list — index, icon, class, title — with the focused one highlit.
// The layer-shell surface that hosts it lives in desktop/Desktop.tsx and is
// presence-gated by altTabOpen, so AltTab itself takes no props and knows
// nothing about windows.
//
// Click a row to focus its client; releasing Alt drops the overlay via the
// alt-tab-close IPC. Keyboard focus is not captured — cycling still happens
// through Hyprland's own vim binds ($mod H/J/K/L).

import { createBinding, createComputed, With } from "ags";
import { Gtk } from "ags/gtk4";
import AstalHyprland from "gi://AstalHyprland";

const hyprland = AstalHyprland.get_default();

const focusedClient = createBinding(hyprland, "focusedClient");
const clients = createBinding(hyprland, "clients");

function attachClick(self: Gtk.Widget, cb: () => void) {
  const gesture = new Gtk.GestureClick();
  gesture.connect("released", () => cb());
  self.add_controller(gesture);
}

// Hyprland's `address` property comes back without the 0x prefix on some
// builds and with it on others; `focuswindow` wants the 0x form, so normalise
// before dispatching.
function addressOf(client: AstalHyprland.Client): string {
  const address = client.address ?? "";
  return address.startsWith("0x") ? address : `0x${address}`;
}

export default function AltTab() {
  // A single computed carries everything the view needs — the current
  // workspace's clients, its name, and which one is focused — so the row
  // list rebuilds atomically when the workspace changes rather than in two
  // out-of-order steps.
  const view = createComputed(() => {
    const current = focusedClient();
    const all = clients();
    if (!all || all.length === 0) return null;
    const wsId = current?.workspace?.id;
    if (wsId == null) return null;
    const wsClients = all.filter((c) => c.workspace?.id === wsId);
    if (wsClients.length === 0) return null;
    return {
      wsClients,
      currentAddress: current?.address ?? null,
      wsName: current?.workspace?.name ?? String(wsId),
    };
  });

  return (
    <box class="alt-tab-wrap">
      <With value={view}>
        {(d) => {
          if (d === null) return <box />;
          return (
            <box
              class="alt-tab"
              orientation={Gtk.Orientation.VERTICAL}
              spacing={0}
            >
              <box class="alt-tab-header" spacing={8}>
                <label
                  class="alt-tab-header-label"
                  label={`Workspace ${d.wsName}`}
                  xalign={0}
                />
                <label
                  class="alt-tab-header-count"
                  label={`${d.wsClients.length}`}
                  hexpand
                  xalign={1}
                />
              </box>
              {d.wsClients.map((client, index) => (
                <box
                  class={`alt-tab-row ${
                    client.address === d.currentAddress ? "current" : ""
                  }`}
                  spacing={10}
                  $={(self) =>
                    attachClick(self, () =>
                      hyprland.dispatch(
                        "focuswindow",
                        `address:${addressOf(client)}`,
                      ),
                    )
                  }
                >
                  <label class="alt-tab-index" label={`${index + 1}`} />
                  <image
                    class="alt-tab-icon"
                    iconName={(client.get_class() || "").toLowerCase()}
                    pixelSize={22}
                  />
                  <box
                    orientation={Gtk.Orientation.VERTICAL}
                    hexpand
                    spacing={0}
                  >
                    <label
                      class="alt-tab-class"
                      label={client.get_class() || "?"}
                      xalign={0}
                    />
                    <label
                      class="alt-tab-title"
                      label={client.get_title() || "(untitled)"}
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
