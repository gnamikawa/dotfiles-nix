// The desktop screen: the always-on session UI on every monitor. It hosts the
// workspaces bar today; later components (panel, notifications, control
// centre, …) settle in the same shell as they arrive (ADR-0008, issue #34).
//
// The bar's Astal layer-shell surface lives here — anchored to the top edge
// of every output, one instance per connector — so Bar itself stays just the
// workspaces content and knows nothing about windows.

import { createBinding, For, onCleanup, This } from "ags";
import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import Bar from "../components/Bar";

function BarSurface({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let window: Astal.Window;
  const connector = gdkmonitor.connector;
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
      <Bar connector={connector} />
    </window>
  ) : (
    <></>
  );
}

export default function Desktop() {
  return (
    <For each={createBinding(app, "monitors")}>
      {(monitor: Gdk.Monitor) => (
        <This this={app}>
          <BarSurface gdkmonitor={monitor} />
        </This>
      )}
    </For>
  );
}
