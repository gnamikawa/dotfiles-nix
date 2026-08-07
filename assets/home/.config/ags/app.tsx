// Entry point of the AGS v3 desktop shell (ADR-0008).
//
// One process owns every user-session surface. The workspaces bar is the
// pathfinder; later surfaces join this same entry point as they replace their
// incumbents (ADR-0008, issue #34).
//
// Restart after editing: systemctl --user restart ags

import app from "ags/gtk4/app";
import { createBinding, For, This } from "ags";
import Bar from "./bar/Bar";

app.start({
  css: `${SRC}/style.css`,
  gtkTheme: "Adwaita",
  main() {
    return (
      <For each={createBinding(app, "monitors")}>
        {(monitor) => (
          <This this={app}>
            <Bar gdkmonitor={monitor} />
          </This>
        )}
      </For>
    );
  },
});
