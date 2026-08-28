// The monitor identifier's content: the connector name of the monitor this
// surface is mounted on, in big text — a HUD label so the user can tell at
// a glance which physical screen is which. Component knows only its own
// monitor because the surface wraps it once per output (see
// MonitorIdSurface in desktop/Desktop.tsx) and passes the connector down.

interface Props {
  connector: string;
}

export default function MonitorId({ connector }: Props) {
  return (
    <box class="monitor-id-wrap">
      <label class="monitor-id-name" label={connector} />
    </box>
  );
}
