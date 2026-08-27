// The workspace visualization's content: one row per monitor, listing the
// workspaces on that monitor. The focused workspace is highlit so the user
// pressing Alt can see at a glance which numbered workspace lives on which
// output and pick the right one to jump to.
//
// Deliberately compact — small text, tight spacing, no monitor descriptions.
// The layer-shell surface that hosts it lives in desktop/Desktop.tsx and is
// presence-gated by workspaceVizOpen, so WorkspaceViz takes no props.

import { createBinding, createComputed, With } from "ags";
import { Gtk } from "ags/gtk4";
import AstalHyprland from "gi://AstalHyprland";

const hyprland = AstalHyprland.get_default();

const monitorsBinding = createBinding(hyprland, "monitors");
const workspacesBinding = createBinding(hyprland, "workspaces");
const focusedWorkspaceBinding = createBinding(hyprland, "focusedWorkspace");

interface Row {
  monitor: string;
  workspaces: { id: number; name: string }[];
}

export default function WorkspaceViz() {
  const view = createComputed(() => {
    const monitors = monitorsBinding();
    const workspaces = workspacesBinding();
    const focused = focusedWorkspaceBinding();

    const byMonitor = new Map<string, AstalHyprland.Workspace[]>();
    for (const ws of workspaces) {
      const mName = ws.monitor?.name;
      if (!mName) continue;
      if (!byMonitor.has(mName)) byMonitor.set(mName, []);
      byMonitor.get(mName)!.push(ws);
    }

    const rows: Row[] = monitors.map((m) => {
      const list = (byMonitor.get(m.name) ?? [])
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((ws) => ({ id: ws.id, name: ws.name || String(ws.id) }));
      return { monitor: m.name, workspaces: list };
    });

    return {
      rows,
      focusedId: focused?.id ?? null,
    };
  });

  return (
    <box class="ws-viz-wrap">
      <With value={view}>
        {(d) => (
          <box
            class="ws-viz-grid"
            orientation={Gtk.Orientation.VERTICAL}
            spacing={4}
          >
            {d.rows.map((row) => (
              <box class="ws-viz-row" spacing={8}>
                <label
                  class="ws-viz-monitor"
                  label={row.monitor}
                  xalign={0}
                />
                <box class="ws-viz-workspaces" spacing={4}>
                  {row.workspaces.map((ws) => (
                    <label
                      class={`ws-viz-ws ${
                        ws.id === d.focusedId ? "current" : ""
                      }`}
                      label={ws.name}
                    />
                  ))}
                </box>
              </box>
            ))}
          </box>
        )}
      </With>
    </box>
  );
}
