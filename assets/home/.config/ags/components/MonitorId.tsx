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
import { layoutTick } from "../common/workspace-viz";

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
  layout: string;
}

/**
 * Look up the tiled layout ("dwindle" / "monocle") for a workspace id via
 * Hyprland's JSON `workspaces` IPC. AstalHyprland's Workspace wrapper
 * doesn't expose `tiledLayout` as a property, so we parse it out here. Any
 * IPC/parse failure yields an empty string so the caption just omits it.
 */
function readWorkspaceLayout(wsId: number | null): string {
  if (wsId == null) return "";
  try {
    const raw = hyprland.message("j/workspaces");
    const list = JSON.parse(raw) as Array<{ id: number; tiledLayout?: string }>;
    return String(list.find((w) => w.id === wsId)?.tiledLayout ?? "");
  } catch {
    return "";
  }
}

/**
 * Pick the grid dimensions for a plate given a workspace count.
 *
 * Maps 1 → 1×1, 2 → 1×2, 3–4 → 2×2, 5–9 → 3×3 per ADR-0011. `sizeClass`
 * feeds the CSS grid-scale variant.
 *
 * @param count - Workspaces pinned to this monitor, already capped at 9.
 * @returns Grid geometry and the size-class token for CSS.
 */
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

/**
 * The per-screen key card: an adaptive 1×1 / 1×2 / 2×2 / 3×3 grid of the
 * workspaces pinned to a monitor, with the active one lit and its peers
 * dim, plus the connector name printed below.
 *
 * Mounted one per output by `desktop/Desktop.tsx`. Takes only its
 * connector name; every other input is derived reactively.
 */
export default function MonitorId({ connector }: Props) {
  const view = createComputed<View | null>(() => {
    focusedWorkspaceBinding();
    layoutTick();
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
      flat.push(ws ? { id: ws.id, current: ws.id === activeId } : null);
    }
    const rows: (Cell | null)[][] = [];
    for (let r = 0; r < shape.rows; r++) {
      rows.push(flat.slice(r * shape.cols, (r + 1) * shape.cols));
    }
    return {
      sizeClass: shape.sizeClass,
      rows,
      layout: readWorkspaceLayout(activeId),
    };
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

  // Hold the last non-default layout name so the tag can fade out with its
  // real text still showing, instead of flashing "dwindle" for one frame
  // when the layout returns to the default.
  let lastShownLayout = "";
  const displayedLayout = createComputed(() => {
    const layout = view()?.layout;
    if (layout && layout !== "dwindle") lastShownLayout = layout;
    return lastShownLayout;
  });

  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.END}
      spacing={0}
    >
      {/* Fixed-height slot for the tag. The tag slides via margin-bottom;
       * keeping the slot's own height constant means the outer column never
       * renegotiates size and the plate below can't absorb the animation. */}
      <box
        class="monitor-plate-layout-slot"
        orientation={Gtk.Orientation.VERTICAL}
        halign={Gtk.Align.END}
        valign={Gtk.Align.END}
        vexpand={false}
      >
        <label
          class={createComputed(() => {
            const layout = view()?.layout;
            const shown = layout && layout !== "dwindle";
            return `monitor-plate-layout-tag ${shown ? "shown" : "hidden"}`;
          })}
          label={displayedLayout}
          halign={Gtk.Align.END}
          valign={Gtk.Align.END}
          vexpand
        />
      </box>
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
    </box>
  );
}
