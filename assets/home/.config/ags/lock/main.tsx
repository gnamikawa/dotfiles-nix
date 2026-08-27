import app from "ags/gtk4/app";
import { createRoot } from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import SessionLock from "gi://Gtk4SessionLock?version=1.0";
import GLib from "gi://GLib";
import Auth from "../components/auth/Auth";
import { findPrimaryMonitor } from "../common/monitors";
import { createLockController } from "./controller";
import authCss from "../components/auth/style.css";
import lockCss from "./style.css";

const sessionLock = SessionLock.Instance.new();
type Surface = {
  cover: Gtk.Widget;
  dispose: () => void;
  interactive: boolean;
};

const surfaces = new Map<Gdk.Monitor, Surface>();
const controller = createLockController(() => sessionLock.unlock());
let held = false;

function renderSurfaces() {
  // Gtk4SessionLock does not destroy an assigned window when its output
  // disappears. Intersect the lock surfaces with GDK's live inventory (via
  // findPrimaryMonitor's `among` filter) so a stale surface can never retain
  // the interactive role.
  const primary = findPrimaryMonitor(surfaces.keys());
  for (const [monitor, surface] of surfaces) {
    const shouldBeInteractive = monitor === primary;
    if (surface.interactive === shouldBeInteractive) continue;
    surface.cover.set_visible(!shouldBeInteractive);
    surface.interactive = shouldBeInteractive;
    if (shouldBeInteractive) controller.focus();
  }
}

function quit() {
  // Acquisition failure can be reported both by the signal and by lock()'s
  // return value. Releasing the application hold must still happen once.
  if (held) {
    app.release();
    held = false;
  }
  app.quit();
}

sessionLock.connect("monitor", (_, monitor: Gdk.Monitor) => {
  // Gtk4SessionLock requires a fresh window that has never been realized.
  // Astal.Window is intentionally not used: it would create a layer surface.
  // Gtk4SessionLock, not Gtk.Application, owns this window's Wayland
  // lifecycle. Registering it as an application window makes GTK run normal
  // toplevel-session cleanup after the output surface has already vanished,
  // which crashes in gdk_wayland_toplevel_remove_from_session on hot-unplug.
  const window = new Gtk.Window();
  const cover = (<box class="lock-secondary" hexpand vexpand />) as Gtk.Widget;
  const auth = (<Auth controller={controller} />) as Gtk.Widget;

  const dispose = createRoot((dispose) => {
    const overlay = new Gtk.Overlay();
    overlay.set_child(auth);
    overlay.add_overlay(cover);
    window.set_child(overlay);
    return dispose;
  });
  // Every surface keeps a mapped password entry because Hyprland transfers
  // keyboard focus with the pointer. Secondary presentation is an opaque
  // cover, not an unmapped input subtree.
  surfaces.set(monitor, { cover, dispose, interactive: false });
  renderSurfaces();
  window.connect("destroy", () => {
    dispose();
    surfaces.delete(monitor);
    // GDK's monitor model finishes updating after the window teardown. If the
    // primary disappeared, promote the new logical-origin/first survivor.
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      renderSurfaces();
      return GLib.SOURCE_REMOVE;
    });
  });
  sessionLock.assign_window_to_monitor(window, monitor);
});

sessionLock.connect("locked", () => controller.acquired());

sessionLock.connect("failed", () => {
  controller.acquisitionFailed();
  console.error("could not acquire the compositor lock");
  quit();
});

sessionLock.connect("unlocked", () => {
  // This signal is synchronous and arrives before the library's queued
  // Wayland unlock request is guaranteed to have reached the compositor.
  // Keep the process held through an idle turn and a display round trip.
  controller.unlockSignalled();
  GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
    Gdk.Display.get_default()?.sync();
    controller.unlockRoundtripCompleted();
    quit();
    return GLib.SOURCE_REMOVE;
  });
});

app.start({
  // A second invocation must independently reach Gtk4SessionLock so it can
  // fail acquisition cleanly instead of being routed to the first AGS process.
  instanceName: `genzo-session-lock-${Date.now()}`,
  css: `${authCss}\n${lockCss}`,
  main() {
    if (!SessionLock.is_supported()) {
      console.error("compositor does not support ext-session-lock-v1");
      app.quit();
      return;
    }

    const monitors = Gdk.Display.get_default()?.get_monitors();
    monitors?.connect("items-changed", () => {
      // The inventory is updated before this signal, while session-lock
      // surface bookkeeping can settle later in the same main-loop turn.
      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        renderSurfaces();
        return GLib.SOURCE_REMOVE;
      });
    });

    // Assigned windows are destroyed during unlock. The explicit hold keeps
    // the process alive until the compositor round trip above has completed.
    app.hold();
    held = true;
    controller.acquire();
    if (!sessionLock.lock()) {
      // `failed` may already have fired synchronously; the state machine makes
      // this duplicate harmless.
      controller.acquisitionFailed();
      quit();
    }
  },
});
