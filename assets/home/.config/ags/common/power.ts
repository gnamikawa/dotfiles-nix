// Power verbs shared by the greeter and the session lock. Both surfaces are
// usable without a pointer and present the same two actions.

import GLib from "gi://GLib";

// Absolute paths: neither greetd's PAM environment nor an on-demand lock
// should depend on a caller's PATH. The greeter's actions are authorized by
// system-nix; the logged-in user follows the ordinary system policy.
const SYSTEMCTL = "/run/current-system/sw/bin/systemctl";

export const VERBS = [
  { icon: "moon", label: "Hibernate", command: `${SYSTEMCTL} hibernate` },
  { icon: "power", label: "Power off", command: `${SYSTEMCTL} poweroff` },
] as const;

export function run(command: string) {
  try {
    GLib.spawn_command_line_async(command);
  } catch (err) {
    console.error(`${command}: ${err}`);
  }
}
