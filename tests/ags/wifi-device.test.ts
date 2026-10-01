import { expect, test } from "vitest";

import {
  followWifiDevice,
  type WifiDeviceSource,
} from "../../assets/home/.config/ags/common/wifi-device";

type FakeDevice = { name: string; wifi: boolean };

test("follows the Wi-Fi device across a NetworkManager restart", () => {
  const ethernet: FakeDevice = { name: "eno1", wifi: false };
  const before: FakeDevice = { name: "wlp5s0 (before restart)", wifi: true };
  const after: FakeDevice = { name: "wlp5s0 (after restart)", wifi: true };

  let devices: FakeDevice[] = [ethernet, before];
  let devicesChanged!: () => void;
  let unsubscribed = false;
  const source: WifiDeviceSource<FakeDevice, FakeDevice> = {
    /** Hand back whatever the fake NetworkManager currently exposes. */
    getDevices: () => devices,
    /** Tell Wi-Fi adapters apart by the fixture's flag. */
    isWifi: (device): device is FakeDevice => device.wifi,
    /** Capture the change callback so the test can play NetworkManager. */
    subscribeDevices: (callback) => {
      devicesChanged = callback;
      return () => {
        unsubscribed = true;
      };
    },
  };

  const seen: (string | null)[] = [];
  const stop = followWifiDevice(source, (device) => {
    seen.push(device?.name ?? null);
  });

  // A restarted NetworkManager drops every device object and exposes new
  // ones. The bar used to look the Wi-Fi device up once at start, so it kept
  // reading the dropped object and showed "Connecting…" while online.
  devices = [];
  devicesChanged();
  devices = [ethernet, after];
  devicesChanged();

  expect(seen).toEqual([
    "wlp5s0 (before restart)",
    null,
    "wlp5s0 (after restart)",
  ]);

  stop();
  expect(unsubscribed).toBe(true);
});
