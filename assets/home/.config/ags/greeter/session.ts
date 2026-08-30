// What the greeter can start: one session, one user, two power verbs. Nothing
// here is selectable — the login screen presents no choice (issue #48).

import GLib from "gi://GLib";
import Greet from "gi://AstalGreet";

// The only account with a graphical session. root exists but is deliberately
// TTY-only, so offering it would present a choice whose one outcome is failure.
export const USER = "genzo";

// The uwsm-managed entry, never the plain hyprland.desktop beside it: uwsm is
// what puts the session under systemd as wayland-wm@hyprland.desktop.service,
// which system-nix's VM test asserts is active after login.
const SESSION = "hyprland-uwsm.desktop";

const SESSIONS_DIR = "/run/current-system/sw/share/wayland-sessions";

/**
 * Read the desktop entry's own `Exec` line to get the session's launch
 * command.
 *
 * Reading the entry rather than spelling a command here keeps the
 * greeter correct across `uwsm` updates (its store path is baked into
 * the Exec line and changes on every update) with no rebuild of its own.
 *
 * @returns The `Exec` line from the session's `.desktop` file.
 */
export function sessionCommand(): string {
  const keyfile = new GLib.KeyFile();
  keyfile.load_from_file(`${SESSIONS_DIR}/${SESSION}`, GLib.KeyFileFlags.NONE);
  return keyfile.get_string("Desktop Entry", "Exec");
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
/**
 * Send one greetd request and resolve with the parsed response.
 *
 * The higher-level `AstalGreet.login()` shorthand is deliberately not
 * used — it swallows a wrong password as a normal return, and the
 * screen would then quit and drop the seat to black. Driving the
 * requests here lets the response type be inspected.
 *
 * @param request - The greetd request to send.
 * @returns Promise that resolves with greetd's response, or rejects on
 *   a socket/JSON failure.
 */
function send(request: Greet.Request): Promise<Greet.Response> {
  return new Promise((resolve, reject) => {
    request.send((_, res) => {
      try {
        resolve(request.send_finish(res));
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Thrown for anything that ends the attempt.
 *
 * The message is the single line the fault slot displays; greetd's own
 * detail goes to the journal separately.
 */
class Fault extends Error {}

/**
 * Drive greetd's PAM conversation for one attempt.
 *
 * Opens a session, answers a single `SECRET` prompt with the password,
 * and refuses anything else (a second question, a non-secret prompt, or
 * a `Greet.Error`) with a `Fault`. NixOS's default PAM stack asks only
 * one SECRET, but a fingerprint reader or OTP module added later must
 * not silently wedge the screen — hence the positive gate.
 *
 * @param password - The password to answer greetd's SECRET prompt with.
 * @throws {Fault} On refusal or on any unexpected prompt shape.
 */
async function converse(password: string): Promise<void> {
  let answered = false;
  let res = await send(Greet.CreateSession.new(USER));

  while (res instanceof Greet.AuthMessage) {
    const kind = res.get_message_type();

    // Informative, not a question. The protocol still wants a reply, and it is
    // an empty one — this is where PAM says things like "password expired".
    if (
      kind === Greet.AuthMessageType.INFO ||
      kind === Greet.AuthMessageType.ERROR
    ) {
      console.error(`greetd: ${res.get_message()}`);
      res = await send(Greet.PostAuthMesssage.new(""));
      continue;
    }

    // Positive gate: the one thing this screen holds is the password, so the
    // only prompt it may answer with it is one the protocol has marked SECRET.
    // A VISIBLE prompt (or any type not enumerated here) would be greetd
    // asking for something else — a username, a security question, a token —
    // and posting the password to it would put it somewhere it must not go.
    // NixOS's default pam stack asks only SECRET, but a fingerprint reader or
    // OTP module added later would break the assumption silently.
    if (kind !== Greet.AuthMessageType.SECRET) {
      console.error(
        `greetd asked a non-secret prompt (${kind}): ${res.get_message()}`,
      );
      throw new Fault("could not sign in");
    }

    // A second question after the password was given is one this screen has no
    // way to ask — it collects a single secret and nothing else. Refusing is
    // the honest end; looping would post the same password forever.
    if (answered) {
      console.error(`greetd asked a second question: ${res.get_message()}`);
      throw new Fault("could not sign in");
    }

    answered = true;
    res = await send(Greet.PostAuthMesssage.new(password));
  }

  if (res instanceof Greet.Error) {
    // One fixed phrase in front of greetd's own words: this is the line that
    // says the refusal was seen as a refusal, and it is what the VM test greps
    // for. The screen itself shows far less.
    console.error(`greetd refused the login: ${res.get_description()}`);
    throw new Fault(
      res.get_error_type() === Greet.ErrorType.AUTH_ERROR
        ? "authentication failed"
        : "could not sign in",
    );
  }
}

/**
 * Attempt one login against greetd and start the session on success.
 *
 * Resolves once `StartSession` has returned — at which point this
 * process must exit for greetd to hand the seat over. Rejects with the
 * one line to show on the fault slot; greetd's own detail goes to the
 * journal separately. Cancels any half-open session on failure so a
 * wrong password does not wedge every later attempt.
 *
 * @param password - The password to hand to greetd.
 * @throws {string} A short human-readable fault message.
 */
export async function login(password: string): Promise<void> {
  let argv: string[];
  try {
    argv = GLib.shell_parse_argv(sessionCommand())[1]!;
  } catch (err) {
    console.error(`${SESSION}: ${err}`);
    throw "no session to start";
  }

  try {
    await converse(password);
    const started = await send(Greet.StartSession.new(argv, []));
    if (started instanceof Greet.Error) {
      console.error(`greetd: ${started.get_description()}`);
      throw new Fault("could not start the session");
    }
  } catch (err) {
    // Anything after create_session succeeded leaves greetd holding a session
    // under configuration, and it will refuse to open another. Without this,
    // one wrong password would make every later attempt fail too.
    send(Greet.CancelSession.new()).catch((e) => console.error(`cancel: ${e}`));
    if (err instanceof Fault) throw err.message;
    console.error(`login: ${err}`);
    throw "could not reach greetd";
  }
}
