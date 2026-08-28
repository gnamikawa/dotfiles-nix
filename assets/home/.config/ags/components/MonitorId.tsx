// The monitor identifier's content: the connector name of the monitor this
// surface is mounted on, centered inside a fixed square — a HUD nameplate
// so the user can tell at a glance which physical screen is which. The
// component knows only its own monitor because the surface wraps it once
// per output (see MonitorIdSurface in desktop/Desktop.tsx) and passes the
// connector down.

import { Gtk } from "ags/gtk4";

interface Props {
  connector: string;
}

export default function MonitorId({ connector }: Props) {
  return (
    <box class="monitor-id-wrap">
      <label
        class="monitor-id-name"
        label={connector}
        hexpand
        vexpand
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
      />
    </box>
  );
}
