// The desktop screen: the always-on session UI. It hosts the bar and the
// alt-tab overlay today; later components (panel, notifications, control
// centre, …) settle in the same shell as they arrive (ADR-0008, issue #34).
//
// The two surfaces have different mounting rules:
//   Bar     — primary output only. One clock per session.
//   AltTab  — every output, but each surface is visible only when altTabOpen
//             is true AND the focused workspace lives on that surface's
//             monitor, so the overlay follows focus across outputs.
// Both are top-anchored so layer-shell centres them horizontally; the leaf
// components (Bar, AltTab) stay just their content and know nothing about
// windows or which monitor they're on.

import { createBinding, createComputed, For, onCleanup, This } from "ags";
import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import AstalHyprland from "gi://AstalHyprland";
import Bar from "../components/Bar";
import AltTab from "../components/AltTab";
import { findPrimaryMonitor } from "../common/monitors";
import { altTabOpen } from "../common/alt-tab";

const hyprland = AstalHyprland.get_default();
const focusedWorkspace = createBinding(hyprland, "focusedWorkspace");

function BarSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
  const { TOP } = Astal.WindowAnchor;

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
      anchor={TOP}
      application={app}
    >
      <Bar />
    </window>
  ) : (
    <></>
  );
}

// Exclusivity.IGNORE: the overlay is a summoned interruption, not a persistent
// chrome — it should float over content rather than steal reserved space.
// marginTop clears the bar pill so the two surfaces don't overlap at Alt-hold.
//
// visible is per-monitor: layer-shell mounts one surface per output, but only
// the one on the focused workspace's monitor unhides when Alt is held. That's
// what makes the overlay show up on the screen the user is looking at,
// not always on the pinned primary.
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

export default function Desktop() {
  const monitors = createBinding(app, "monitors");
  // Wrap the primary monitor (or nothing, when none is live) as a single-item
  // array so <For> mounts one BarSurface on the pinned output and none
  // elsewhere; the alt-tab loop iterates the full set.
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
    </>
  );
}
