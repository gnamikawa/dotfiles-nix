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

// One request, one response. AstalGreet.login() is deliberately not used, and
// this is not a preference: Request.send() throws only for socket and JSON
// failures, and hands greetd's own {"type":"error"} back as an ordinary return
// value (astal greet src/client.vala). login() wraps its three requests in a
// try/catch, so nothing catches a wrong password — it finishes cleanly and the
// screen reads that as a login. The screen then quits, per greetd's contract,
// and greetd finds the greeter gone with no session behind it: the seat drops
// to a black display. A mistyped password took the machine down.
//
// So the response has to be inspected, which means driving the three requests
// here rather than through the shorthand.
function send(request: Greet.Request): Promise<Greet.Response> {
  return new Promise((resolve, reject) => {
    request.send((_, res) => {
      try {
        resolve(request.send_finish(res))
      } catch (err) {
        reject(err)
      }
    })
  })
}

// Thrown for anything that ends the attempt, carrying the one line the fault
// line shows; the detail greetd gave goes to the journal separately.
class Fault extends Error {}

// greetd's protocol is a PAM conversation: create_session opens it and every
// reply is either a prompt to answer, a success, or an error. NixOS's stack
// asks one secret question, but answering whatever it asks costs three lines
// and means an added pam module cannot silently wedge the screen.
async function converse(password: string): Promise<void> {
  let answered = false
  let res = await send(Greet.CreateSession.new(USER))

  while (res instanceof Greet.AuthMessage) {
    const kind = res.get_message_type()

    // Informative, not a question. The protocol still wants a reply, and it is
    // an empty one — this is where PAM says things like "password expired".
    if (kind === Greet.AuthMessageType.INFO || kind === Greet.AuthMessageType.ERROR) {
      console.error(`greetd: ${res.get_message()}`)
      res = await send(Greet.PostAuthMesssage.new(""))
      continue
    }

    // A second question after the password was given is one this screen has no
    // way to ask — it collects a single secret and nothing else. Refusing is
    // the honest end; looping would post the same password forever.
    if (answered) {
      console.error(`greetd asked a second question: ${res.get_message()}`)
      throw new Fault("could not sign in")
    }

    answered = true
    res = await send(Greet.PostAuthMesssage.new(password))
  }

  if (res instanceof Greet.Error) {
    // One fixed phrase in front of greetd's own words: this is the line that
    // says the refusal was seen as a refusal, and it is what the VM test greps
    // for. The screen itself shows far less.
    console.error(`greetd refused the login: ${res.get_description()}`)
    throw new Fault(
      res.get_error_type() === Greet.ErrorType.AUTH_ERROR
        ? "authentication failed"
        : "could not sign in",
    )
  }
}

// Resolves on a started session — at which point this process must exit for
// greetd to hand the seat over — and rejects with the one line to show on the
// fault line.
//
// A rejected login mostly says "authentication failed" and nothing more,
// because from the screen's side a wrong password is the only case worth
// distinguishing; greetd's own message goes to the journal instead. Failing to
// read the session entry is different in kind — nothing was typed wrong and no
// password will fix it — so that one says what actually broke.
export async function login(password: string): Promise<void> {
  let argv: string[]
  try {
    argv = GLib.shell_parse_argv(sessionCommand())[1]!
  } catch (err) {
    console.error(`${SESSION}: ${err}`)
    throw "no session to start"
  }

  try {
    await converse(password)
    const started = await send(Greet.StartSession.new(argv, []))
    if (started instanceof Greet.Error) {
      console.error(`greetd: ${started.get_description()}`)
      throw new Fault("could not start the session")
    }
  } catch (err) {
    // Anything after create_session succeeded leaves greetd holding a session
    // under configuration, and it will refuse to open another. Without this,
    // one wrong password would make every later attempt fail too.
    send(Greet.CancelSession.new()).catch((e) => console.error(`cancel: ${e}`))
    if (err instanceof Fault) throw err.message
    console.error(`login: ${err}`)
    throw "could not reach greetd"
  }
}
