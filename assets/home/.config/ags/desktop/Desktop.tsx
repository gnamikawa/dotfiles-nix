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
//   SystemMenu      — every output; visible on Alt+Shift-hold, only on the
//                     focused workspace's monitor. Anchors to all four edges
//                     so the scrim covers the whole screen.
//   MonitorId       — every output; blinks up on workspace change or
//                     Alt-hold. Every screen carries its own key card —
//                     which physical screen this is (connector) plus which
//                     workspace is currently in front on it (ADR-0009).
// The leaf components stay just their content and know nothing about which
// monitor they are on beyond a connector string, when they need it.

import { createBinding, createComputed, For, onCleanup, This } from "ags";
import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import AstalHyprland from "gi://AstalHyprland";
import Bar from "../components/Bar";
import AltTab from "../components/AltTab";
import Runner from "../components/Runner";
import SystemMenu from "../components/SystemMenu";
import MonitorId from "../components/MonitorId";
import { findPrimaryMonitor } from "../common/monitors";
import { altTabOpen } from "../common/alt-tab";
import { runnerOpen } from "../common/runner";
import { systemMenuOpen } from "../common/system-menu";
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

// The uncommon-actions menu: Alt+Shift-hold shades the whole screen and
// shows a legend of session verbs each row keyed by an Alt+Shift+<key>
// chord. Anchored to all four edges so the layer-shell surface fills the
// output — the wrap inside paints the scrim. Layer.OVERLAY so the scrim
// covers maximized clients (the default TOP layer sits under fullscreen
// windows). Exclusivity.IGNORE so the tiles beneath stay put; no keymode
// because the chords are ordinary Hyprland binds (see hypr/binds.lua),
// not entries this window intercepts.
function SystemMenuSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;

  onCleanup(() => window.destroy());

  const visible = createComputed(
    () => systemMenuOpen() && focusedWorkspace()?.monitor?.name === connector,
  );

  return connector ? (
    <window
      $={(self) => (window = self)}
      visible={visible}
      class="system-menu-window"
      namespace="ags-system-menu"
      name={`system-menu-${connector}`}
      gdkmonitor={gdkmonitor}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      application={app}
    >
      <SystemMenu />
    </window>
  ) : (
    <></>
  );
}

// The per-screen key card: connector name + active workspace, anchored
// bottom-left of every output at once. Shares workspaceVizOpen as its open
// signal, so during Alt-hold and on every workspace change each screen
// blinks up its own plate. Margins are deliberately offset from the tile
// gap (gaps_out=20) so the HUD's corner doesn't sit on the same pixel line
// as the adjacent window's corner.
function MonitorIdSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
  const { BOTTOM, LEFT } = Astal.WindowAnchor;

  onCleanup(() => window.destroy());

  return connector ? (
    <window
      $={(self) => (window = self)}
      visible={workspaceVizOpen}
      class="monitor-id-window"
      namespace="ags-monitor-id"
      name={`monitor-id-${connector}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={BOTTOM | LEFT}
      marginBottom={32}
      marginLeft={32}
      application={app}
    >
      <MonitorId connector={connector} />
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
            <SystemMenuSurface gdkmonitor={monitor} />
          </This>
        )}
      </For>
      <For each={monitors}>
        {(monitor: Gdk.Monitor) => (
          <This this={app}>
            <MonitorIdSurface gdkmonitor={monitor} />
          </This>
        )}
      </For>
    </>
  );
}
