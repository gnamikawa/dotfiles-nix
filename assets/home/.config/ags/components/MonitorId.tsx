// The per-screen key card: an adaptive grid of the workspaces pinned to
// this monitor, the current one bright and its peers dim, plus a small
// connector caption below. Each screen owns its own plate (ADR-0009).
//
// The grid escapes the row-of-N form deliberately: at plate scale, any
// nine-position strip collapses to a boring line of rectangles, and no
// physical-object metaphor survives the small-cell rendering. Trading
// skeuomorphism for a denser, more distinctive shape is the ADR-0011
// call — one workspace is a single big digit, nine are a dense 3×3
// mosaic, and the two states do not look like the same widget carrying
// different data. Peer identities are printed (ADR-0010 legibility
// ceiling) because they can't be encoded at this size.
//
// Grid scaling:
//   1 workspace  → single big number, whole plate area
//   2 workspaces → 1×2, side by side
//   3-4          → 2×2, filled left-to-right top-to-bottom
//   5-9          → 3×3, same fill order
// Trailing cells in the last row stay empty when the count is 3 or 5-8,
// so the "how full is this screen" state is itself visible.
//
// The surface that mounts this one-per-output lives in desktop/Desktop.tsx.

import { createBinding, createComputed, createEffect, With } from "ags";
import { Gtk } from "ags/gtk4";
import AstalHyprland from "gi://AstalHyprland";

const hyprland = AstalHyprland.get_default();
const monitorsBinding = createBinding(hyprland, "monitors");
const workspacesBinding = createBinding(hyprland, "workspaces");
const focusedWorkspaceBinding = createBinding(hyprland, "focusedWorkspace");

interface Cell {
  id: number;
  current: boolean;
}

interface View {
  sizeClass: 1 | 2 | 4 | 9;
  rows: (Cell | null)[][];
}

function gridShape(count: number): {
  rows: number;
  cols: number;
  sizeClass: 1 | 2 | 4 | 9;
} {
  if (count <= 1) return { rows: 1, cols: 1, sizeClass: 1 };
  if (count === 2) return { rows: 1, cols: 2, sizeClass: 2 };
  if (count <= 4) return { rows: 2, cols: 2, sizeClass: 4 };
  return { rows: 3, cols: 3, sizeClass: 9 };
}

interface Props {
  connector: string;
}

export default function MonitorId({ connector }: Props) {
  const view = createComputed<View | null>(() => {
    focusedWorkspaceBinding();
    const list = workspacesBinding()
      .filter((w) => w.monitor?.name === connector)
      .slice()
      .sort((a, b) => a.id - b.id);
    if (list.length === 0) return null;
    const activeId =
      monitorsBinding().find((mo) => mo.name === connector)?.activeWorkspace
        ?.id ?? null;
    // Cap at 9 so the 3×3 stays the ceiling; a 10th+ workspace still
    // exists in Hyprland but this plate cannot legibly render it. If the
    // user goes past 9 regularly, that's the signal to build the picker
    // surface (see [[ia-map-95]]).
    const capped = list.slice(0, 9);
    const shape = gridShape(capped.length);
    const total = shape.rows * shape.cols;
    const flat: (Cell | null)[] = [];
    for (let i = 0; i < total; i++) {
      const ws = capped[i];
      flat.push(
        ws ? { id: ws.id, current: ws.id === activeId } : null,
      );
    }
    const rows: (Cell | null)[][] = [];
    for (let r = 0; r < shape.rows; r++) {
      rows.push(flat.slice(r * shape.cols, (r + 1) * shape.cols));
    }
    return { sizeClass: shape.sizeClass, rows };
  });

  let plate: Gtk.Box | null = null;
  // Whenever the view changes, With disposes and rebuilds the grid subtree
  // and GTK's dirty-region tracking sometimes misses the OLD widget's
  // bounds — leaving residual glyph pixels above the new (smaller) cell.
  // Force a full redraw on the plate to clear any stale region.
  createEffect(() => {
    view();
    plate?.queue_draw();
  });

  return (
    <box
      $={(self) => (plate = self)}
      class="monitor-plate"
      orientation={Gtk.Orientation.VERTICAL}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
    >
      {/* Persistent vexpand slot: With rebuilds the grid subtree on every
       * workspace switch, so wrap it in a stable vexpand box. Otherwise the
       * connector label below briefly loses its "pushed to bottom" anchor
       * and pops to the top during rebuild. */}
      <box hexpand vexpand>
        <With value={view}>
          {(v) => {
            if (v === null) return <box hexpand vexpand />;
            return (
              <box
                class={`plate-grid plate-grid-${v.sizeClass}`}
                orientation={Gtk.Orientation.VERTICAL}
                homogeneous
                hexpand
                vexpand
              >
                {v.rows.map((row) => (
                  <box
                    orientation={Gtk.Orientation.HORIZONTAL}
                    homogeneous
                    hexpand
                    vexpand
                  >
                    {row.map((cell) =>
                      cell === null ? (
                        <box class="plate-cell empty" hexpand vexpand />
                      ) : (
                        <label
                          class={`plate-cell ${cell.current ? "current" : "peer"}`}
                          label={String(cell.id)}
                          hexpand
                          vexpand
                          halign={Gtk.Align.FILL}
                          valign={Gtk.Align.FILL}
                        />
                      ),
                    )}
                  </box>
                ))}
              </box>
            );
          }}
        </With>
      </box>
      <label
        class="monitor-plate-connector"
        label={connector}
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.END}
      />
    </box>
  );
}
