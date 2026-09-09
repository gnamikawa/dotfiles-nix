// Per-host settings for the window-orchestrator service.
//
// The Nix module for each host writes a JSON slice at
// `~/.config/generated/ags/window-orchestrator.json`; this module reads it
// once at service startup and exposes a typed view. Hosts without a
// satellite monitor omit the file entirely and the reader defaults to an
// empty config — every policy must survive absent optional fields.

import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";

/**
 * Verbatim `hyprctl monitors` description strings for host-specific outputs.
 *
 * Only the satellite is named here — the primary output is discovered at
 * runtime by geometry (the monitor pinned at origin, see
 * `common/monitors.ts`), so it does not need per-host configuration.
 */
export interface MonitorConfig {
  satellite?: string;
}

/**
 * Root shape of `window-orchestrator.json`. Every top-level field is
 * optional: new services extending the orchestrator add their own keys and
 * older hosts that predate the field simply see `undefined`.
 */
export interface WindowOrchestratorConfig {
  monitors?: MonitorConfig;
}

const CONFIG_PATH = `${GLib.get_user_config_dir()}/generated/ags/window-orchestrator.json`;

/**
 * Load the current host's window-orchestrator config from disk.
 *
 * Returns an empty object if the file is missing (laptop hosts, unmanaged
 * setups) or unreadable. Any JSON parse error is surfaced to the console
 * so a bad Nix render fails loudly rather than silently defaulting.
 *
 * @returns Parsed config, or `{}` when the file is absent.
 */
export function loadConfig(): WindowOrchestratorConfig {
  const file = Gio.File.new_for_path(CONFIG_PATH);
  if (!file.query_exists(null)) return {};

  try {
    const [ok, bytes] = file.load_contents(null);
    if (!ok) return {};
    const text = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(text) as WindowOrchestratorConfig;
  } catch (err) {
    console.error(`window-orchestrator: failed to parse ${CONFIG_PATH}:`, err);
    return {};
  }
}
