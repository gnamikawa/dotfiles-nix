// Hardware-control verbs fired by Hyprland's Fn-row and audio binds.
//
// Every one of these used to be a Hyprland Lua bind shaped like
// `bash -lc 'wpctl set-volume …; ags request osd-volume "$(wpctl get-volume …)"'`
// — two commands chained with `;`, the second one's output captured through
// a `$(…)` substitution, the whole thing escaped through a Lua string
// literal. `ags request` was just the tail end of a shell one-liner, not a
// real interface, and a single stray character in that escaping is enough
// to silently break the bind (Lua string → bash `-c` string → nested
// `$(…)` → wpctl's own arg parsing, four layers deep). Hyprland's job now
// is only `hl.dsp.exec_cmd("ags request <verb>")`, no payload; every case
// here owns the actual command and reports the result to the OSD itself.
//
// argv-form Gio.Subprocess (see hypr-dispatch.ts) — no shell, so there's
// nothing left to escape. The radio toggles below skip subprocesses
// entirely: NM's `wireless-enabled` and AstalBluetooth's `isPowered` are
// already the live GObjects Bar.tsx binds for the tray icons, so flipping
// them is a direct property write / method call, not an external command.

import Gio from "gi://Gio?version=2.0";
import NM from "gi://NM";
import AstalBluetooth from "gi://AstalBluetooth";
import { showOsd } from "./osd";

const nmClient = NM.Client.new(null);
const bluetooth = AstalBluetooth.get_default();

/**
 * Run argv (no shell) and resolve with its trimmed stdout.
 *
 * @param argv - Argv-form command line.
 * @returns Trimmed stdout, or `""` if the process fails to spawn or exits
 *   with output GIO can't decode.
 */
function run(argv: string[]): Promise<string> {
  return new Promise((resolve) => {
    let proc: Gio.Subprocess;
    try {
      proc = Gio.Subprocess.new(
        argv,
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE,
      );
    } catch (err) {
      console.error(`${argv.join(" ")}: ${err}`);
      resolve("");
      return;
    }
    proc.communicate_utf8_async(null, null, (self, res) => {
      try {
        const [, stdout] = self!.communicate_utf8_finish(res);
        resolve((stdout ?? "").trim());
      } catch (err) {
        console.error(`${argv.join(" ")}: ${err}`);
        resolve("");
      }
    });
  });
}

/**
 * Parse wpctl's `get-volume` line ("Volume: 0.45" or "Volume: 0.45
 * [MUTED]") into the OSD's 0-100 level and on/off (unmuted/muted) flag.
 *
 * @param line - Raw stdout from `wpctl get-volume`.
 */
function parseVolume(line: string): { level: number; on: boolean } {
  const match = line.match(/([\d.]+)/);
  const level = match ? Math.round(parseFloat(match[1]) * 100) : 0;
  return { level, on: !line.includes("MUTED") };
}

/** Re-read a wpctl endpoint's volume/mute and push it to the OSD. */
async function showVolumeOsd(endpoint: string): Promise<void> {
  const { level, on } = parseVolume(
    await run(["wpctl", "get-volume", endpoint]),
  );
  showOsd({ kind: "volume", level, on });
}

/** F-row / XF86AudioRaiseVolume: +5%, capped at 100% (`--limit`). */
export async function volumeUp(): Promise<void> {
  await run([
    "wpctl",
    "set-volume",
    "--limit",
    "1.0",
    "@DEFAULT_AUDIO_SINK@",
    "5%+",
  ]);
  await showVolumeOsd("@DEFAULT_AUDIO_SINK@");
}

/** XF86AudioLowerVolume: -5%, no floor (wpctl clamps at 0 itself). */
export async function volumeDown(): Promise<void> {
  await run(["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", "5%-"]);
  await showVolumeOsd("@DEFAULT_AUDIO_SINK@");
}

/** XF86AudioMute: toggle the sink. */
export async function volumeMuteToggle(): Promise<void> {
  await run(["wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle"]);
  await showVolumeOsd("@DEFAULT_AUDIO_SINK@");
}

/** F4 (mic mute): toggle the source; OSD only cares about the mute flag. */
export async function micMuteToggle(): Promise<void> {
  await run(["wpctl", "set-mute", "@DEFAULT_AUDIO_SOURCE@", "toggle"]);
  const line = await run(["wpctl", "get-volume", "@DEFAULT_AUDIO_SOURCE@"]);
  showOsd({ kind: "mic", on: !line.includes("MUTED") });
}

/**
 * Adjust backlight brightness and push the result to the OSD.
 *
 * `-m` alone (no separate read-back call, unlike volume) makes `set` itself
 * print the machine-readable `device,class,current,percent%,max` line.
 * `-e4` perceptually linearizes the percentage steps; `-n2` floors
 * brightness above zero so the screen never goes pitch black.
 *
 * @param step - brightnessctl step expression, e.g. `"5%+"` or `"5%-"`.
 */
async function adjustBrightness(step: string): Promise<void> {
  const line = await run(["brightnessctl", "-m", "-e4", "-n2", "set", step]);
  const percentField = line.split(",")[3] ?? "0%";
  const level = parseInt(percentField, 10) || 0;
  showOsd({ kind: "brightness", level });
}

/** F5/XF86MonBrightnessDown. */
export function brightnessDown(): Promise<void> {
  return adjustBrightness("5%-");
}

/** F6/XF86MonBrightnessUp. */
export function brightnessUp(): Promise<void> {
  return adjustBrightness("5%+");
}

/**
 * F8/XF86RFKill: toggle Wi-Fi and Bluetooth together, both landing on
 * whichever side Wi-Fi is heading to (matches the old rfkill-based
 * behavior: F8 forces both radios to agree, it doesn't just flip each
 * independently).
 *
 * `wireless-enabled` is a plain writable GObject property (confirmed
 * against the live client — no subprocess needed). AstalBluetooth only
 * exposes `isPowered` read-only plus a `toggle()` method, so Bluetooth is
 * only toggled when its current state doesn't already match Wi-Fi's new
 * one.
 */
export function radioToggle(): void {
  const next = !nmClient.wireless_enabled;
  nmClient.wireless_enabled = next;
  if (bluetooth.get_is_powered() !== next) bluetooth.toggle();
  showOsd({ kind: "radio", on: next });
}

/** F10/XF86Bluetooth: Bluetooth only, independent of F8/Wi-Fi. */
export function bluetoothToggle(): void {
  const next = !bluetooth.get_is_powered();
  bluetooth.toggle();
  showOsd({ kind: "bluetooth", on: next });
}
