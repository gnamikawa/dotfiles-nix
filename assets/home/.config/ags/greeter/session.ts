// What the greeter can start: one session, one user, two power verbs. Nothing
// here is selectable — the login screen presents no choice (issue #48).

import GLib from "gi://GLib"
import Greet from "gi://AstalGreet"

// The only account with a graphical session. root exists but is deliberately
// TTY-only, so offering it would present a choice whose one outcome is failure.
export const USER = "genzo"

// The uwsm-managed entry, never the plain hyprland.desktop beside it: uwsm is
// what puts the session under systemd as wayland-wm@hyprland.desktop.service,
// which system-nix's VM test asserts is active after login.
const SESSION = "hyprland-uwsm.desktop"

const SESSIONS_DIR = "/run/current-system/sw/share/wayland-sessions"

// The entry's own Exec line rather than a command spelled here: it carries the
// uwsm store path, which changes with every uwsm update, and reading it keeps
// the greeter correct across those updates with no rebuild of its own.
export function sessionCommand(): string {
  const keyfile = new GLib.KeyFile()
  keyfile.load_from_file(`${SESSIONS_DIR}/${SESSION}`, GLib.KeyFileFlags.NONE)
  return keyfile.get_string("Desktop Entry", "Exec")
}

// Resolves on a started session — at which point this process must exit for
// greetd to hand the seat over — and rejects with the one line to show on the
// fault line.
//
// A rejected login says "authentication failed" and nothing more, because from
// the screen's side a wrong password is the only case worth distinguishing;
// greetd's own message goes to the journal instead. Failing to read the
// session entry is different in kind — nothing was typed wrong and no password
// will fix it — so that one says what actually broke.
export function login(password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd: string
    try {
      cmd = sessionCommand()
    } catch (err) {
      console.error(`${SESSION}: ${err}`)
      return reject("no session to start")
    }

    Greet.login(USER, password, cmd, (_, res) => {
      try {
        Greet.login_finish(res)
        resolve()
      } catch (err) {
        console.error(`login: ${err}`)
        reject("authentication failed")
      }
    })
  })
}

// Absolute paths: the greeter's PATH is whatever greetd's PAM stack hands it,
// which is not something this surface should depend on. Both actions need a
// polkit rule for the greeter user, which system-nix installs.
const SYSTEMCTL = "/run/current-system/sw/bin/systemctl"

export const VERBS = [
  { icon: "moon", label: "Hibernate", command: `${SYSTEMCTL} hibernate` },
  { icon: "power", label: "Power off", command: `${SYSTEMCTL} poweroff` },
] as const

export function run(command: string) {
  try {
    GLib.spawn_command_line_async(command)
  } catch (err) {
    console.error(`${command}: ${err}`)
  }
}
