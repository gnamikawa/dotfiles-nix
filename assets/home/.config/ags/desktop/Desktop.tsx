// The desktop screen: the always-on session UI. It hosts the bar and every
// summoned surface today; later components (panel, notifications, control
// centre, …) settle in the same shell as they arrive (ADR-0008, issue #34).
//
// Surface mounting rules:
//   Bar             — primary output only. One clock per session.
//   AltTab          — every output; visible on Alt-hold, only on the focused
//                     workspace's monitor.
//   Runner          — every output; visible on Alt+F3, only on the focused
//                     workspace's monitor. Owns keyboard focus while up.
//   WorkspaceViz    — every output; blinks up on workspace change, only on
//                     the focused workspace's monitor.
// The leaf components stay just their content and know nothing about which
// monitor they are on.

import { createBinding, createComputed, For, onCleanup, This } from "ags";
import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import AstalHyprland from "gi://AstalHyprland";
import Bar from "../components/Bar";
import AltTab from "../components/AltTab";
import Runner from "../components/Runner";
import WorkspaceViz from "../components/WorkspaceViz";
import { findPrimaryMonitor } from "../common/monitors";
import { altTabOpen } from "../common/alt-tab";
import { runnerOpen } from "../common/runner";
import { workspaceVizOpen } from "../common/workspace-viz";

const hyprland = AstalHyprland.get_default();
const focusedWorkspace = createBinding(hyprland, "focusedWorkspace");

function BarSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
  // Anchored to the whole top edge (TOP + LEFT + RIGHT) so the bar spans the
  // output. The left half is the drag-down summon target — a swipe from the
  // top-left area will pop the Control-Center-style surface once it lands, so
  // the surface needs a full-width top edge to reach for.
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

  onCleanup(() => window.destroy());

  return connector ? (
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
      <Bar />
    </window>
  ) : (
    <></>
  );
}

// Exclusivity.IGNORE: the surface is a summoned interruption, not persistent
// chrome. marginTop clears the bar so the two don't overlap on Alt-hold.
//
// Visible only when altTabOpen is set AND the focused workspace lives on this
// output — that is what makes the peek follow focus rather than always
// showing on the pinned primary.
function AltTabSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
  const { TOP } = Astal.WindowAnchor;

  onCleanup(() => window.destroy());

  const visible = createComputed(
    () => altTabOpen() && focusedWorkspace()?.monitor?.name === connector,
  );

  return connector ? (
    <window
      $={(self) => (window = self)}
      visible={visible}
      class="alt-tab-window"
      namespace="ags-alt-tab"
      name={`alt-tab-${connector}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP}
      marginTop={80}
      application={app}
    >
      <AltTab />
    </window>
  ) : (
    <></>
  );
}

// Same follow-focus rule as AltTabSurface, but keymode EXCLUSIVE — the entry
// must receive keystrokes until the user submits or Escapes. The Runner
// component owns its own submit/dismiss wiring; this surface only decides
// where and when the layer-shell window shows up.
function RunnerSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
  const { TOP } = Astal.WindowAnchor;

  onCleanup(() => window.destroy());

  const visible = createComputed(
    () => runnerOpen() && focusedWorkspace()?.monitor?.name === connector,
  );

  return connector ? (
    <window
      $={(self) => (window = self)}
      visible={visible}
      class="runner-window"
      namespace="ags-runner"
      name={`runner-${connector}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      anchor={TOP}
      marginTop={80}
      application={app}
    >
      <Runner />
    </window>
  ) : (
    <></>
  );
}

// No anchor value — the layer-shell surface floats free, which the compositor
// renders centred by default. The visualization is small and transient, so
// centring keeps it out of the way of the workspace's contents.
function WorkspaceVizSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;

  onCleanup(() => window.destroy());

  const visible = createComputed(
    () =>
      workspaceVizOpen() && focusedWorkspace()?.monitor?.name === connector,
  );

  return connector ? (
    <window
      $={(self) => (window = self)}
      visible={visible}
      class="ws-viz-window"
      namespace="ags-ws-viz"
      name={`ws-viz-${connector}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.IGNORE}
      application={app}
    >
      <WorkspaceViz />
    </window>
  ) : (
    <></>
  );
}

export default function Desktop() {
  const monitors = createBinding(app, "monitors");
  // Wrap the primary monitor (or nothing, when none is live) as a single-item
  // array so <For> mounts one BarSurface on the pinned output; the summoned
  // surface loops iterate the full monitor set.
  const primary = monitors((all) => {
    const p = findPrimaryMonitor(all);
    return p ? [p] : [];
  });
  return (
    <>
      <For each={primary}>
        {(monitor: Gdk.Monitor) => (
          <This this={app}>
            <BarSurface gdkmonitor={monitor} />
          </This>
        )}
      </For>
      <For each={monitors}>
        {(monitor: Gdk.Monitor) => (
          <This this={app}>
            <AltTabSurface gdkmonitor={monitor} />
          </This>
        )}
      </For>
      <For each={monitors}>
        {(monitor: Gdk.Monitor) => (
          <This this={app}>
            <RunnerSurface gdkmonitor={monitor} />
          </This>
        )}
      </For>
      <For each={monitors}>
        {(monitor: Gdk.Monitor) => (
          <This this={app}>
            <WorkspaceVizSurface gdkmonitor={monitor} />
          </This>
        )}
      </For>
    </>
  );
}
