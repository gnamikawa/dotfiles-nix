# Disable flatpakManagement pending a lighter update mechanism

`programs.flatpakManagement` exists to manage apps whose update cadence is
controlled server-side — primarily Discord, where a version-mismatched client
refuses to work. It is deliberately left in `home.nix` commented out, not
deleted: the capability should return, but in its current form it makes
rebuilds heavy through unnecessarily long redownloads on every activation.

The intent is to reimplement this natively in Nix if possible; failing that,
with any mechanism that updates server-pinned apps without penalising every
rebuild. Do not "clean up" the commented block or reinstate it as-is —
either is a regression against this decision.

VSCode was previously managed as a flatpak but no longer needs to be; it is
installed as a regular nix package (`modules/base-linux.nix`).
