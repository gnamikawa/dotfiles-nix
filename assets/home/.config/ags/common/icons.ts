// Shared Lucide-icon loader. Lucide SVGs live in the geistdesign package,
// symlinked to this path by modules/ags.nix. Loaded via
// `Gtk.Image.set_from_gicon(FileIcon)` so `pixel-size` still constrains the
// render, and the imperative subscribe actually repaints on binding change —
// ags gtk4's declarative `iconName={binding}` was proven inert against
// `Gtk.Image`, and the file-backed path bypasses GTK's theme lookup entirely.
//
// Duplicated from components/bar/Bar.tsx rather than importing it back into
// a shared module retroactively — this file exists so a second consumer
// (components/osd/Osd.tsx) doesn't have to reach into Bar's internals or
// re-derive the same lookup from scratch.

import { Accessor } from "ags";
import { Gtk } from "ags/gtk4";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

const LUCIDE_DIR = GLib.build_filenamev([
  GLib.get_home_dir(),
  ".local",
  "share",
  "geistdesign",
  "icons",
  "lucide",
]);

/**
 * Build a file-backed `Gio.Icon` for a Lucide glyph.
 *
 * @param name - Basename of the SVG (without the `.svg` extension).
 * @returns A file icon that bypasses GTK's theme lookup entirely.
 */
export const lucideIcon = (name: string): Gio.Icon =>
  Gio.FileIcon.new(Gio.File.new_for_path(`${LUCIDE_DIR}/${name}.svg`));

/**
 * Wire a Lucide-icon binding into a `Gtk.Image`.
 *
 * @param image - The image widget to imperatively repaint.
 * @param name - Reactive Lucide icon basename.
 * @returns Unsubscribe function.
 */
export function bindLucideIcon(
  image: Gtk.Image,
  name: Accessor<string>,
): () => void {
  image.set_from_gicon(lucideIcon(name.get()));
  return name.subscribe(() => image.set_from_gicon(lucideIcon(name.get())));
}
