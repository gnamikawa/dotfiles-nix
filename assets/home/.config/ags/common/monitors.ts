// Monitor selection for surfaces that must land on the logical primary output.
//
// Hyprland's logical origin is the primary workspace output in this repo's
// host layouts (system-nix's hardware.primaryMonitor pins the chosen output
// to 0x0 in every compositor the surfaces run under, including greetd's).
// GDK enumeration order is driver-dependent and unrelated to that layout, so a
// surface that picks by "the first monitor" lands wherever the driver chose to
// enumerate first — on the wrong output whenever the driver disagrees with the
// pin. Picking by geometry is what makes the pin load-bearing.
//
// currentMonitors is exposed for callers that manage per-monitor surfaces (the
// session lock) and need to intersect their own bookkeeping with GDK's live
// inventory so a surface for a gone-away output cannot retain the primary role.

import { Gdk } from "ags/gtk4";

/**
 * Snapshot the display's live monitor inventory as a plain Set.
 *
 * Wraps GDK's ListModel in a Set so callers can do set intersection against
 * their own per-monitor bookkeeping without dealing with the model iterator.
 *
 * @returns Every monitor GDK currently reports; empty on no default display.
 */
export function currentMonitors(): Set<Gdk.Monitor> {
  const model = Gdk.Display.get_default()?.get_monitors();
  const monitors = new Set<Gdk.Monitor>();
  if (!model) return monitors;
  for (let index = 0; index < model.get_n_items(); index += 1) {
    const monitor = model.get_item(index) as Gdk.Monitor | null;
    if (monitor) monitors.add(monitor);
  }
  return monitors;
}

/**
 * Pick the primary monitor by geometry — the one pinned at compositor
 * origin (0, 0) by system-nix's `hardware.primaryMonitor` setting.
 *
 * Falls back to the first candidate when nothing sits at the origin, which
 * happens on VMs and early boot before Hyprland has applied the layout.
 *
 * @param among - When supplied, restrict candidates to monitors the caller
 *   already tracks (used by the session lock, which manages one surface per
 *   monitor and needs to intersect with GDK's live inventory).
 * @returns The primary monitor, or `undefined` when no candidates remain.
 */
export function findPrimaryMonitor(
  among?: Iterable<Gdk.Monitor>,
): Gdk.Monitor | undefined {
  const live = currentMonitors();
  const candidates = among
    ? [...among].filter((monitor) => live.has(monitor))
    : [...live];
  return (
    candidates.find((monitor) => {
      const geometry = monitor.get_geometry();
      return geometry.x === 0 && geometry.y === 0;
    }) ?? candidates[0]
  );
}
