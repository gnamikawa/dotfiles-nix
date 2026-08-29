// The bar's content: a passive strip anchored to the top of the primary
// output. Left half is a placeholder for the upcoming drag-down summon
// gesture (iOS-Control-Center style, not built yet — the handle lives here
// so the swipe target is discoverable later). Right half carries the
// ambient triad: bluetooth, wifi, clock.
//
// The layer-shell surface that hosts this lives in desktop/Desktop.tsx, so
// Bar takes no props and knows nothing about which monitor it is on.

import { createBinding, createComputed, Accessor } from "ags";
import { createPoll } from "ags/time";
import { Gtk } from "ags/gtk4";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import NM from "gi://NM";
import AstalBluetooth from "gi://AstalBluetooth";

const bluetooth = AstalBluetooth.get_default();

// Lucide SVGs live in the geistdesign package, symlinked to this path by
// modules/ags.nix. Loaded via `Gtk.Image.set_from_gicon(FileIcon)` so
// `pixel-size` still constrains the render, and the imperative subscribe
// below actually repaints on binding change — ags gtk4's declarative
// `iconName={binding}` was proven inert against Gtk.Image, and the file-
// backed path bypasses GTK's theme lookup entirely (which had been
// collapsing every `network-wireless-signal-*-symbolic` request through
// Papirus-Dark's suffix-stripping fallback to a single generic glyph).
const LUCIDE_DIR = GLib.build_filenamev([
  GLib.get_home_dir(),
  ".local",
  "share",
  "geistdesign",
  "icons",
  "lucide",
]);
const lucideIcon = (name: string): Gio.Icon =>
  Gio.FileIcon.new(Gio.File.new_for_path(`${LUCIDE_DIR}/${name}.svg`));

function bindLucideIcon(image: Gtk.Image, name: Accessor<string>): () => void {
  image.set_from_gicon(lucideIcon(name.get()));
  return name.subscribe(() => image.set_from_gicon(lucideIcon(name.get())));
}

// We talk to NetworkManager directly instead of via AstalNetwork. Three
// upstream bugs live in astal-network's Wifi wrapper — merely constructing
// the `AstalNetwork.Network` singleton triggers all of them by way of the
// Wifi constructor:
//
//   1. `on_active_connection` never syncs `internet` from the current state,
//      only wires a notify callback. When the active connection reaches
//      ACTIVATED before the callback is attached (typical after a reconnect
//      or resume), `internet` latches at DISCONNECTED and `iconName` sticks
//      at `network-wireless-offline-symbolic` forever.
//
//   2. The `access_point_added` handler inserts into a string-keyed
//      hashtable without null-checking `ap.bssid`. NM emits AP events with
//      null bssid for transient management frames during association, and
//      `g_str_hash(NULL)` segfaults the whole shell (six coredumps in a row
//      when `nmcli connection up` reactivates wifi).
//
//   3. `on_active_access_point` dereferences the AP wrapper without null-
//      checking after a `_access_points.get()` miss, spraying assertion
//      failures at boot.
//
// gi://NM is the same NetworkManager introspection lib astal-network wraps,
// so we get identical properties (state, connectivity, strength) with none
// of the caching bugs, and no crashes on association.
const nmClient = NM.Client.new(null);

function getWifiDevice(): NM.DeviceWifi | null {
  for (const d of nmClient.get_devices()) {
    if (d.get_device_type() === NM.DeviceType.WIFI) {
      return d as NM.DeviceWifi;
    }
  }
  return null;
}

function computeWifiIcon(): string {
  const wifi = getWifiDevice();
  if (!wifi || !nmClient.wireless_enabled) return "wifi-off";

  const state = wifi.get_state();
  if (state !== NM.DeviceState.ACTIVATED) return "wifi-off";
  if (nmClient.get_connectivity() !== NM.ConnectivityState.FULL) {
    return "wifi-zero";
  }

  const strength = wifi.get_active_access_point()?.get_strength() ?? 0;
  if (strength >= 75) return "wifi";
  if (strength >= 50) return "wifi-high";
  if (strength >= 25) return "wifi-low";
  return "wifi-zero";
}

function computeWifiTooltip(): string {
  const wifi = getWifiDevice();
  if (!wifi) return "No Wi-Fi adapter";
  if (!nmClient.wireless_enabled) return "Wi-Fi off";

  const state = wifi.get_state();
  const DS = NM.DeviceState;
  if (state === DS.UNAVAILABLE) return "Wi-Fi unavailable";
  if (state === DS.DISCONNECTED) return "Not connected";
  if (state === DS.FAILED) return "Connection failed";
  if (state !== DS.ACTIVATED) return "Connecting…";

  const name = wifi.get_active_connection()?.get_id() ?? "Wi-Fi";
  if (nmClient.get_connectivity() !== NM.ConnectivityState.FULL) {
    return `${name} — no internet`;
  }
  const strength = wifi.get_active_access_point()?.get_strength() ?? 0;
  return `${name} · ${strength}%`;
}

const wifiIconName = createPoll<string>(computeWifiIcon(), 3000, computeWifiIcon);
const wifiTooltip = createPoll<string>(computeWifiTooltip(), 3000, computeWifiTooltip);

const isPowered = createBinding(bluetooth, "isPowered");
const isConnected = createBinding(bluetooth, "isConnected");
const btIconName = createComputed(() => {
  if (!isPowered()) return "bluetooth-off";
  if (isConnected()) return "bluetooth-connected";
  return "bluetooth";
});
const btTooltip = createComputed(() => {
  if (!isPowered()) return "Bluetooth off";
  if (isConnected()) return "Bluetooth connected";
  return "Bluetooth on";
});

export default function Bar() {
  const fmtTime = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  const fmtDate = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const time = createPoll(fmtTime(), 1000, fmtTime);
  const clockTooltip = createPoll(fmtDate(), 60_000, fmtDate);

  return (
    <box class="bar-content" spacing={0}>
      {/* Drag-down handle stub. Empty on purpose — a Gtk.GestureDrag will
          attach here when the iOS-style Control-Center surface lands. */}
      <box class="bar-left" hexpand />
      <box class="bar-right" spacing={10} valign={Gtk.Align.CENTER}>
        <image
          class="bar-icon"
          tooltipText={btTooltip}
          pixelSize={16}
          $={(self) => bindLucideIcon(self, btIconName)}
        />
        <image
          class="bar-icon"
          tooltipText={wifiTooltip}
          pixelSize={16}
          $={(self) => bindLucideIcon(self, wifiIconName)}
        />
        <label
          class="bar-clock text-button-14"
          label={time}
          tooltipText={clockTooltip}
        />
      </box>
    </box>
  );
}
