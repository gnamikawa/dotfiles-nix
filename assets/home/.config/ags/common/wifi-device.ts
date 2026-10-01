/** The slice of NM.Client that following the Wi-Fi device needs. */
export type WifiDeviceSource<D, W extends D> = {
  getDevices(): D[];
  isWifi(device: D): device is W;
  subscribeDevices(callback: () => void): () => void;
};

/**
 * Find the first Wi-Fi device NetworkManager currently exposes.
 *
 * @param source - The NetworkManager client, narrowed to what this needs.
 * @returns The Wi-Fi device, or `null` on a hard-wired-only box or while
 *   NetworkManager is down.
 */
export function findWifiDevice<D, W extends D>(
  source: WifiDeviceSource<D, W>,
): W | null {
  return source.getDevices().find(source.isWifi) ?? null;
}

/**
 * Report NetworkManager's current Wi-Fi device, now and after every change
 * to its device list.
 *
 * A device object only lives as long as the NetworkManager process that
 * exposed it. When NetworkManager restarts (every `nixos-rebuild switch`
 * that touches its config) the old object is dropped with its last state
 * frozen, and a new one appears. Looking the device up once therefore leaves
 * the caller reading a dead object for the rest of the shell's life.
 *
 * @param source - The NetworkManager client, narrowed to what this needs.
 * @param onDevice - Called with the current Wi-Fi device, or `null`.
 * @returns An unsubscribe function.
 */
export function followWifiDevice<D, W extends D>(
  source: WifiDeviceSource<D, W>,
  onDevice: (device: W | null) => void,
): () => void {
  /** Look the device up afresh and hand it to the caller. */
  const report = () => onDevice(findWifiDevice(source));
  report();
  return source.subscribeDevices(report);
}
