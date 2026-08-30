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

/**
 * Fire-and-forget a shell command, logging any spawn error to the console.
 *
 * Used by the greeter and lock's power buttons; failures are visible in the
 * surface's stderr but do not surface to the user, since a failed shutdown
 * verb has no meaningful UI recovery.
 *
 * @param command - Absolute-path command line handed straight to GLib.
 */
export function run(command: string) {
  try {
    GLib.spawn_command_line_async(command);
  } catch (err) {
    console.error(`${command}: ${err}`);
  }
}
