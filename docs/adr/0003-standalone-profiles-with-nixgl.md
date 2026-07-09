# Standalone profiles with nixGL wrapping

This repository must work in two modes: as a NixOS module (consumed by
system-nix) and as standalone home-manager on non-NixOS distributions
(e.g. Debian) — the repo's original form. Two standalone profiles exist as
insurance, not for any current machine: `genzo-graphical` (full
configuration) and `genzo-terminal` (headless subset, layered under the
graphical profile via `modules/terminal.nix`).

Every GUI package reference goes through `config.lib.nixGL.wrap` so that
nix-installed GUI apps can use a foreign distro's GL drivers. Under NixOS
the wrapper is the identity function — this was verified by derivation-path
equality — so the wrapping costs nothing there. Do not "simplify" the wrap
calls away; they only look like no-ops on NixOS. The default wrapper is
mesa (Intel/AMD out of the box); NVIDIA on a foreign distro requires
switching to a driver-matched wrapper manually.

The alternatives — wrapping nothing and documenting manual `nixGL <app>`
invocations, or wrapping only a few daily-driver apps — were rejected:
insurance that requires an incantation per launch, or an arbitrary
wrapped/unwrapped line, defeats the purpose.

Standalone profiles are protected from rot by flake checks that build both
activation packages; they broke silently once before (missing `constants`,
no host identity, no `osConfig`) because nothing forced their evaluation.
