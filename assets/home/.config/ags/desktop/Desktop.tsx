// The desktop screen: the always-on session UI. It hosts the bar and every
// summoned surface today; later components (panel, notifications, control
// centre, …) settle in the same shell as they arrive (ADR-0008, issue #34).
//
// Surface mounting rules:
//   Bar             — primary output only. One clock per session.
//   WindowMenu      — every output; visible on Alt-hold, only on the focused
//                     workspace's monitor.
//   WindowContext   — every output; rides on the Alt-hold with WindowMenu
//                     (both open together, both close together), only when
//                     the focused client has audio (pw-dump-driven pid
//                     index) and only on that client's monitor. Pinned to
//                     the client's outer edge (right, else left, else
//                     overlaid) and re-anchored via a 32ms poll.
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
import WindowMenu from "../components/WindowMenu";
import WindowContext from "../components/WindowContext";
import Runner from "../components/Runner";
import SystemMenu from "../components/SystemMenu";
import MonitorId from "../components/MonitorId";
import { findPrimaryMonitor } from "../common/monitors";
import { windowMenuOpen } from "../common/window-menu";
import {
  computePlacement,
  liveGeom,
  windowContextOpen,
} from "../common/window-context";
import { runnerOpen } from "../common/runner";
import { systemMenuOpen } from "../common/system-menu";
import { workspaceVizOpen } from "../common/workspace-viz";

const hyprland = AstalHyprland.get_default();
const focusedWorkspace = createBinding(hyprland, "focusedWorkspace");

/**
 * Layer-shell surface that hosts the top bar on a single output.
 *
 * Anchored TOP|LEFT|RIGHT so the surface spans the full width, and
 * `EXCLUSIVE` so client windows reserve space beneath.
 *
 * @param props.gdkmonitor - The output to mount this bar on.
 */
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

/**
 * Layer-shell surface that hosts the Alt-hold window-menu peek.
 *
 * `Exclusivity.IGNORE` because the surface is a summoned interruption,
 * not persistent chrome; `marginTop` clears the bar so the two do not
 * overlap on Alt-hold. Visible only when the peek is open AND the focused
 * workspace lives on this output, so the peek follows focus rather than
 * always showing on the pinned primary.
 *
 * @param props.gdkmonitor - The output this surface is mounted on.
 */
function WindowMenuSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
  const { TOP } = Astal.WindowAnchor;

  onCleanup(() => window.destroy());

  const visible = createComputed(
    () => windowMenuOpen() && focusedWorkspace()?.monitor?.name === connector,
  );

  return connector ? (
    <window
      $={(self) => (window = self)}
      visible={visible}
      class="window-menu-window"
      namespace="ags-window-menu"
      name={`window-menu-${connector}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP}
      marginTop={80}
      application={app}
    >
      <WindowMenu />
    </window>
  ) : (
    <></>
  );
}

/**
 * Layer-shell surface that hosts the per-window audio-output router.
 *
 * Anchors TOP|LEFT and slides into place by margin — right of the focused
 * client if the outer gap fits, else left, else overlaid at the client's
 * top-left corner. Placement is a computed off `liveGeom`, which polls
 * `hyprctl -j activewindow` every 32ms while the peek is open (Hyprland's
 * socket2 doesn't emit movewindow events for interactive drags, so the
 * poll is the only way to keep the card glued during a drag). `Layer.OVERLAY`
 * floats it above fullscreen clients; visibility is gated on the focused
 * client living on this output.
 *
 * @param props.gdkmonitor - The output this surface is mounted on.
 */
function WindowContextSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
  const { TOP, LEFT } = Astal.WindowAnchor;

  onCleanup(() => window.destroy());

  const placement = liveGeom((g) => computePlacement(g));
  // Visibility gate: peek is open AND this monitor holds the focused
  // client. The card itself decides whether to show routing rows or a
  // "silent window" hint (see components/WindowContext.tsx) — deciding
  // that here would force the surface to unmount when audio state flips
  // and take any in-flight click with it.
  const visible = createComputed(() => {
    if (!windowContextOpen()) return false;
    const g = liveGeom();
    if (!g) return false;
    return g.connector === connector;
  });
  const marginTop = placement((p) => p.marginTop);
  const marginLeft = placement((p) => p.marginLeft);

  return connector ? (
    <window
      $={(self) => (window = self)}
      visible={visible}
      class="window-context-window"
      namespace="ags-window-context"
      name={`window-context-${connector}`}
      gdkmonitor={gdkmonitor}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP | LEFT}
      marginTop={marginTop}
      marginLeft={marginLeft}
      application={app}
    >
      <WindowContext />
    </window>
  ) : (
    <></>
  );
}

/**
 * Layer-shell surface that hosts the Alt+F3 runner.
 *
 * Same follow-focus rule as {@link WindowMenuSurface}, but keymode
 * `EXCLUSIVE` so the entry receives keystrokes until the user submits or
 * Escapes. Submit / dismiss wiring lives inside the `Runner` component;
 * this surface just decides where and when the layer-shell window shows.
 *
 * @param props.gdkmonitor - The output this surface is mounted on.
 */
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

/**
 * Layer-shell surface that hosts the Alt+Shift system-menu shade.
 *
 * Anchored to all four edges so the surface fills the output — the wrap
 * inside paints the scrim. `Layer.OVERLAY` so the scrim covers maximized
 * clients; `Exclusivity.IGNORE` so the tiles beneath stay put. No
 * keymode: the chords are ordinary Hyprland binds (see
 * `hypr/binds.lua`), not entries this window intercepts.
 *
 * @param props.gdkmonitor - The output this surface is mounted on.
 */
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

/**
 * Layer-shell surface that hosts the per-screen key card.
 *
 * Anchored bottom-left of every output at once. Shares `workspaceVizOpen`
 * as its open signal, so during Alt-hold and on every workspace change
 * each screen blinks up its own plate. Margins are deliberately offset
 * from the tile gap so the HUD's corner does not sit on the same pixel
 * line as the adjacent window's corner.
 *
 * @param props.gdkmonitor - The output this surface is mounted on.
 */
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

/**
 * The always-on desktop screen: the bar on the primary output, and one
 * of every summoned surface per output.
 *
 * The bar iterates a single-item slice (primary only); every other
 * surface iterates the full monitor set and decides per-monitor
 * visibility internally.
 */
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
            <WindowMenuSurface gdkmonitor={monitor} />
          </This>
        )}
      </For>
      <For each={monitors}>
        {(monitor: Gdk.Monitor) => (
          <This this={app}>
            <WindowContextSurface gdkmonitor={monitor} />
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
