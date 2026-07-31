// Everything the status rail shows, read from paths an unprivileged user with
// no home directory can reach — which is the greeter's situation exactly (uid
// 988, /var/lib/greeter wiped at boot). Hence /proc, /sys and /run only: no
// session bus, no user config, nothing behind a login.

import GLib from "gi://GLib"

function read(path: string): string {
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    return ok ? new TextDecoder().decode(bytes).trim() : ""
  } catch {
    return ""
  }
}

export const host = GLib.get_host_name()
export const kernel = read("/proc/sys/kernel/osrelease")
export const nixosVersion = read("/run/current-system/nixos-version")

export const generation = (() => {
  const link = GLib.file_read_link("/nix/var/nix/profiles/system")
  const m = link?.match(/system-(\d+)-link/)
  return m ? m[1] : "?"
})()

export function uptime(): string {
  const secs = Number(read("/proc/uptime").split(" ")[0])
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// null on a machine with no battery, which is how the rail decides whether the
// row exists at all. GEN-DPC is a desktop and /sys/class/power_supply is empty
// there; GEN-LPC reads real values.
export function battery(): { pct: number; charging: boolean } | null {
  const dir = "/sys/class/power_supply"
  try {
    const d = GLib.Dir.open(dir, 0)
    let name: string | null
    while ((name = d.read_name()) !== null) {
      if (read(`${dir}/${name}/type`) !== "Battery") continue
      const pct = Number(read(`${dir}/${name}/capacity`))
      const charging = read(`${dir}/${name}/status`) === "Charging"
      return { pct, charging }
    }
  } catch {
    // no power_supply class at all
  }
  return null
}
