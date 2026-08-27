// The workspaces bar's content: numbered Hyprland workspaces for one monitor,
// and deliberately nothing else. The layer-shell surface that hosts it lives
// in desktop/Desktop.tsx, so Bar takes only what it needs — the connector —
// and grows in place as later components land beside it.

import { createBinding, For } from "ags";
import AstalHyprland from "gi://AstalHyprland";
import { space } from "geistdesign";

const hyprland = AstalHyprland.get_default();

function Workspaces({ connector }: { connector: string }) {
  const workspaces = createBinding(
    hyprland,
    "workspaces",
  )((all) =>
    all
      .filter(
        (workspace) =>
          workspace.id > 0 && workspace.monitor?.name === connector,
      )
      .sort((a, b) => a.id - b.id),
  );
  const focused = createBinding(hyprland, "focusedWorkspace");

  return (
    <box class="workspaces" spacing={parseInt(space.base)}>
      <For each={workspaces}>
        {(workspace) => (
          <button
            class={focused((current) =>
              current?.id === workspace.id ? "workspace active" : "workspace",
            )}
            tooltipText={`Workspace ${workspace.name}`}
            onClicked={() => workspace.focus()}
          >
            <label class="text-button-14" label={workspace.name} />
          </button>
        )}
      </For>
    </box>
  );
}

export default function Bar({ connector }: { connector: string }) {
  return (
    <box class="bar-content">
      <Workspaces connector={connector} />
    </box>
  );
}
