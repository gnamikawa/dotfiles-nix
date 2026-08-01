// The pathfinder bar: numbered Hyprland workspaces, and deliberately nothing
// else. It grows in place as later surface tickets settle the final bar.

import { createBinding, For, onCleanup } from "ags"
import app from "ags/gtk4/app"
import Astal from "gi://Astal?version=4.0"
import AstalHyprland from "gi://AstalHyprland"
import Gdk from "gi://Gdk?version=4.0"
import { space } from "geistdesign"

const hyprland = AstalHyprland.get_default()

function Workspaces({ connector }: { connector: string }) {
  const workspaces = createBinding(hyprland, "workspaces")((all) =>
    all
      .filter((workspace) => workspace.id > 0 && workspace.monitor?.name === connector)
      .sort((a, b) => a.id - b.id),
  )
  const focused = createBinding(hyprland, "focusedWorkspace")

  return (
    <box class="workspaces" spacing={parseInt(space.base)}>
      <For each={workspaces}>
        {(workspace) => (
          <button
            class={focused((current) =>
              current?.id === workspace.id ? "workspace active" : "workspace",
            )}
            cursor="pointer"
            tooltipText={`Workspace ${workspace.name}`}
            onClicked={() => workspace.focus()}
          >
            <label class="text-button-14" label={workspace.name} />
          </button>
        )}
      </For>
    </box>
  )
}

export default function Bar({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window
  const connector = gdkmonitor.connector
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  onCleanup(() => window.destroy())

  return (
    <window
      $={(self) => (window = self)}
      visible
      class="bar"
      namespace="ags-bar"
      name={`bar-${connector}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <box class="bar-content">
        <Workspaces connector={connector} />
      </box>
    </window>
  )
}
