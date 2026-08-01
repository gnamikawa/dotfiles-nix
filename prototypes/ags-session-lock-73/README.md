# AGS session-lock prototype

**PROTOTYPE — delete after issue 73 is decided.**

Question: can one shared state machine safely coordinate fresh GTK4 session
lock windows on every monitor, authenticate through Astal Auth exactly once,
and unlock only after success? This is deliberately not the finished lock UI.

Drive the lifecycle without locking the session:

```sh
nix run .#lock-prototype -- simulate
```

Exercise the real compositor lock from a Hyprland session:

```sh
nix run .#lock-prototype -- live
```

The live authentication check requires `/etc/pam.d/astal-auth`. It is absent
on the current system as of 2026-08-02, so add `security.pam.services.astal-auth
= { };` in system-nix and rebuild before taking the real lock. Do not treat an
authentication failure while that service is absent as a wrong-password test.

Before deliberately killing the live prototype, confirm TTY recovery: switch
to a TTY, log in, and terminate the user’s Hyprland session. The protocol is
fail-closed, so killing the locker leaves normal content hidden; recovery must
end the locked compositor session rather than trying to revive an untrusted UI
inside it.

Manual checks: initial monitor coverage; hot-plug and unplug; wrong password;
double-submit while PAM is busy; successful authentication; a second live
instance (acquisition failure); compositor-initiated unlock; and `kill -KILL`
followed by the TTY recovery above. The full state is printed after every
event and mirrored on every lock surface.
