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

The live authentication check requires `/etc/pam.d/astal-auth`. The temporary
GEN-DPC test generation provides it; do not treat an authentication failure on
a generation without that file as a wrong-password test.

Successful authentication does not terminate the process from the library's
synchronous `unlocked` signal. The prototype holds itself alive, forces a GDK
display roundtrip, then shows an ordinary control window on the restored
desktop. Exit from that window. If the process instead dies between acquiring
and completing that roundtrip, the launcher enables session-lock restore and
starts hyprlock automatically; no command or approval is needed while locked.
After a successful hyprlock recovery it disables the restore escape hatch
again; if hyprlock itself fails, the hatch remains enabled for TTY recovery.

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
