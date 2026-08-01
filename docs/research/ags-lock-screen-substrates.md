# AGS lock-screen substrates

Research for the lock-screen decision in the
[AGS v3 migration map](https://github.com/gnamikawa/dotfiles-nix/issues/30).
Investigated 2026-08-02 against primary upstream documentation, source, and
this repository's pinned nixpkgs revision.

## TL;DR

The premise recorded in ADR 0008 is obsolete: a maintained GTK4 session-lock
library exists. `gtk4-layer-shell` exposes the `Gtk4SessionLock-1.0`
GObject-introspection API and has added monitor-hotplug support. Its current
1.3.0 release is actively maintained.
[Upstream README](https://github.com/wmww/gtk4-layer-shell),
[release history](https://github.com/wmww/gtk4-layer-shell/releases),
[session-lock API](https://wmww.github.io/gtk4-layer-shell/gtk4-layer-shell-GTK4-Session-Lock.html).

An AGS v3/Gnim locker can therefore combine GTK4/Gnim UI,
`Gtk4SessionLock` for secure Wayland surfaces, and Astal Auth for PAM. No
custom Wayland FFI appears necessary. This direction should first be proved
with a minimal GJS prototype because upstream ships C, Python, and Vala
examples, not a GJS locker.

## What exists now

`gtk4-layer-shell` describes itself as a GTK4 library for both Layer Shell
and Session Lock, enables GObject introspection by default, and documents a
GObject-derived `GtkSessionLockInstance`. The installed namespace is
`Gtk4SessionLock-1.0`, so the expected GJS import is:

```ts
import Gtk4SessionLock from "gi://Gtk4SessionLock?version=1.0"
```

That is the same GI mechanism Gnim uses for GTK4. Gnim supplies JSX and
reactivity over ordinary GTK4 widgets; it does not restrict the other
introspected libraries a GJS process may import.
[Gnim GTK tutorial](https://aylur.github.io/gnim/tutorial/gtk),
[`gtk4-layer-shell` build options](https://github.com/wmww/gtk4-layer-shell#meson-options).

Releases 1.1.0 (2025-01-29), 1.1.1 (2025-03-29), 1.2.0 (2025-08-12), and
1.3.0 (2025-10-29) all postdate the original GTK4 port. The 1.2 API added a
`monitor` signal and hotplug tests; 1.3 fixed a session-lock use-after-free
and monitor-change behavior.
[Upstream releases](https://github.com/wmww/gtk4-layer-shell/releases).

## The actual responsibility boundary

Astal Auth is only the authentication half. It exposes asynchronous PAM
authentication and requires a NixOS PAM service. It does not acquire or
release a compositor lock.
[Astal Auth documentation](https://aylur.github.io/astal/guide/libraries/auth).

`Gtk4SessionLock` absorbs protocol plumbing: acquisition, a lock surface per
output, surface resize/configure handling, output addition, and automatic
unmapping when an output disappears or the lock ends. The app must still:

- handle immediate or asynchronous acquisition failure;
- create a fresh, unrealized `Gtk.Window` for every `monitor` signal;
- keep authentication, error, and busy state coherent across monitors;
- dispose of password material, invoke PAM, and reject concurrent attempts;
- call `unlock()` only after successful authentication;
- handle compositor-initiated unlock, cancellation, and orderly shutdown;
- supervise or recover the UI process after a crash.

Client failure is fail-closed: after the compositor acknowledges the lock,
it must keep normal content hidden and replace destroyed lock surfaces with
a solid colour. A crash therefore protects secrecy but can strand the user
until a trusted recovery mechanism exists. Authentication and the decision
to unlock remain the client's job.
[ext-session-lock-v1 specification](https://wayland.app/protocols/ext-session-lock-v1),
[`Gtk4SessionLock` lifecycle API](https://wmww.github.io/gtk4-layer-shell/gtk4-layer-shell-GTK4-Session-Lock.html).

Assigned windows must be unrealized before assignment and may not be hidden
while active. Popup windows do not display while locked, although
`GtkPopover` works because it uses a subsurface. Geist tokens and greeter
components can be shared, but an already-realized greeter window cannot be
reused verbatim.

## Options

| Option | What we own | Reuse / flexibility | Assessment |
| --- | --- | --- | --- |
| **AGS v3 + `Gtk4SessionLock` + Astal Auth** | Application state machine, PAM invocation, unlock policy, failure/recovery behavior, and security tests | GTK4, Gnim, Geist tokens, and greeter components | **Preferred for a prototype.** Technically coherent through GI, with no bespoke Wayland binding. |
| **Custom GTK3 + `gtk-session-lock` + Astal Auth** | Essentially the same app-level responsibilities | Loses AGS v3/GTK4 component reuse | Viable, but no longer has a compensating advantage. [Upstream](https://github.com/Cu3PO42/gtk-session-lock). |
| **`gtklock` as substrate** | Theme/config/modules and integration; gtklock owns PAM and locker lifecycle | GTK3 CSS and modules, with less direct Gnim reuse | Lowest amount of security-sensitive code and the conservative fallback. [Upstream](https://github.com/jovanlanik/gtklock). |

## Nix packaging

The repository pins nixpkgs at
[`549bd84d`](https://github.com/NixOS/nixpkgs/tree/549bd84d6279f9852cae6225e372cc67fb91a4c1).
Direct evaluation against that pin found:

- `gtk4-layer-shell` 1.3.0
  ([package expression](https://github.com/NixOS/nixpkgs/blob/549bd84d6279f9852cae6225e372cc67fb91a4c1/pkgs/by-name/gt/gtk4-layer-shell/package.nix));
- `gtk-session-lock` 0.2.0
  ([package expression](https://github.com/NixOS/nixpkgs/blob/549bd84d6279f9852cae6225e372cc67fb91a4c1/pkgs/by-name/gt/gtk-session-lock/package.nix));
- `gtklock` 4.0.0
  ([package expression](https://github.com/NixOS/nixpkgs/blob/549bd84d6279f9852cae6225e372cc67fb91a4c1/pkgs/by-name/gt/gtklock/package.nix)).

Packaging is not a blocker. A prototype still needs to prove that the
`Gtk4SessionLock-1.0` typelib is visible inside the bundled AGS v3 runtime
and establish TypeScript declarations. Runtime viability and editor support
are separate questions: GJS can consume the typelib even without a ready-made
TypeScript definition package.

## Recommendation

Reopen ADR 0008's lock-screen exclusion and prototype the smallest possible
AGS v3 locker: acquire a `Gtk4SessionLock.Instance`, create one plain lock
window per `monitor` signal, authenticate once with Astal Auth, and unlock
only on success. Exercise initial multi-monitor coverage, hotplug/unplug,
wrong passwords, concurrent submissions, acquisition failure,
compositor-initiated unlock, and deliberate process death. If crash recovery
or GJS/GI integration is unacceptable under those tests, retain `gtklock` as
the established substrate rather than falling back to custom GTK3.
