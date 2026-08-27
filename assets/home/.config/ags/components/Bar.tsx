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
import AstalNetwork from "gi://AstalNetwork";
import AstalBluetooth from "gi://AstalBluetooth";

const network = AstalNetwork.get_default();
const bluetooth = AstalBluetooth.get_default();

// Prototype: poll every 3 s rather than wire notify:: chains through wifi's
// appear/disappear lifetime. Adequate for at-a-glance icon state; revisit
// when the drag-down surface arrives and wants richer detail.
const wifiIconName = createPoll<string>(
  network.wifi?.iconName ?? "network-wireless-offline-symbolic",
  3000,
  () => network.wifi?.iconName ?? "network-wireless-offline-symbolic",
);

const isPowered = createBinding(bluetooth, "isPowered");
const isConnected = createBinding(bluetooth, "isConnected");
const btIconName = createComputed(() => {
  if (!isPowered()) return "bluetooth-disabled-symbolic";
  if (isConnected()) return "bluetooth-active-symbolic";
  return "bluetooth-symbolic";
});

export default function Bar() {
  const time = createPoll("", 1000, () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  );

  return (
    <box class="bar-content" spacing={0}>
      {/* Drag-down handle stub. Empty on purpose — a Gtk.GestureDrag will
          attach here when the iOS-style Control-Center surface lands. */}
      <box class="bar-left" hexpand />
      <box class="bar-right" spacing={10} valign={Gtk.Align.CENTER}>
        <image class="bar-icon" iconName={btIconName} pixelSize={16} />
        <image class="bar-icon" iconName={wifiIconName} pixelSize={16} />
        <label class="bar-clock text-button-14" label={time} />
      </box>
    </box>
  );
}
