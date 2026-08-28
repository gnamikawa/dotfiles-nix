// The bar's content: a passive strip anchored to the top of the primary
// output. Left half is a placeholder for the upcoming drag-down summon
// gesture (iOS-Control-Center style, not built yet — the handle lives here
// so the swipe target is discoverable later). Right half carries the
// ambient triad: bluetooth, wifi, clock.
//
// The layer-shell surface that hosts this lives in desktop/Desktop.tsx, so
// Bar takes no props and knows nothing about which monitor it is on.

import { createBinding, createComputed } from "ags";
import { createPoll } from "ags/time";
import { Gtk } from "ags/gtk4";
import NM from "gi://NM";
import AstalBluetooth from "gi://AstalBluetooth";

const bluetooth = AstalBluetooth.get_default();

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
  if (!wifi) return "network-wireless-offline-symbolic";
  if (!nmClient.wireless_enabled) return "network-wireless-disabled-symbolic";

  const state = wifi.get_state();
  const DS = NM.DeviceState;

  if (state !== DS.ACTIVATED) {
    if (
      state === DS.PREPARE ||
      state === DS.CONFIG ||
      state === DS.NEED_AUTH ||
      state === DS.IP_CONFIG ||
      state === DS.IP_CHECK ||
      state === DS.SECONDARIES
    ) {
      return "network-wireless-acquiring-symbolic";
    }
    return "network-wireless-offline-symbolic";
  }

  if (nmClient.get_connectivity() !== NM.ConnectivityState.FULL) {
    return "network-wireless-no-route-symbolic";
  }

  const strength = wifi.get_active_access_point()?.get_strength() ?? 0;
  if (strength >= 80) return "network-wireless-signal-excellent-symbolic";
  if (strength >= 60) return "network-wireless-signal-good-symbolic";
  if (strength >= 40) return "network-wireless-signal-ok-symbolic";
  if (strength >= 20) return "network-wireless-signal-weak-symbolic";
  return "network-wireless-signal-none-symbolic";
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
  if (!isPowered()) return "bluetooth-disabled-symbolic";
  if (isConnected()) return "bluetooth-active-symbolic";
  return "bluetooth-symbolic";
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
          iconName={btIconName}
          tooltipText={btTooltip}
          pixelSize={16}
        />
        <image
          class="bar-icon"
          iconName={wifiIconName}
          tooltipText={wifiTooltip}
          pixelSize={16}
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
