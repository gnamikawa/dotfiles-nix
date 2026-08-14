# dotfiles-nix

`dotfiles-nix` is the centralized, opinionated configuration of one user's
applications, preferences, packages, development environments, and desktop
behaviour. It is a personal system built for `genzo`. This page is written for
interested individuals who want to evaluate it or learn from its design.

The goal is one coherent user environment that travels without pretending the
underlying machines are identical. [Nix](https://nix.dev/install-nix) makes the
packages and configuration reproducible;
[Home Manager](https://nix-community.github.io/home-manager/introduction.html)
applies that configuration to a user's home directory.

A module holds one reusable configuration concern. A profile is a named
composition of modules that Home Manager can build and activate. A development
environment is a named, activatable set of programming tools.

## Design principles

- **Centralized.** Application settings, command-line tools, development
  environments, desktop behaviour, and shared visual rules live in one
  repository.
- **Opinionated.** This configuration makes deliberate choices instead of
  trying to be a general-purpose framework. Hyprland, the compositor that
  arranges windows and provides the graphical session, owns the full desktop.
  Geist, Vercel's design system—a shared set of visual rules—governs its visual
  language. Bash is the configured shell.
- **Portable.** Home Manager can activate profiles on its own, without NixOS,
  the Linux distribution configured with Nix. This lets the user environment
  run on other Linux distributions. Applications and preferences can sit
  beneath a distribution-owned desktop, while the full desktop profile supplies
  its own graphical session. The terminal profile works in graphical terminals,
  Linux text consoles (TTYs), and SSH sessions; it does not promise
  shell-agnostic behaviour.
- **Keyboard-first.** Every interactive surface should be reachable and
  operable without a pointer, except work that is inherently pointer-driven.

## Profiles

| Profile | What it provides | Intended setting |
| --- | --- | --- |
| `genzo-terminal` | Bash, terminal applications, command-line tools, and the default development environment | A graphical terminal, Linux TTY, SSH session, or headless machine |
| `genzo-apps` | Everything in `genzo-terminal`, plus graphical applications and preferences that do not own the session | A Linux distribution that already provides its own desktop |
| `genzo-desktop` | Everything in `genzo-apps`, plus the graphical session itself | A complete Hyprland desktop supplied by this repository |

The `apps` and `desktop` boundary is ownership of the graphical session, not
whether software has a graphical interface. A browser belongs in `apps`; a
compositor, bar, notification service, or lock screen belongs in `desktop`.

## What the flake exposes

A [Nix flake](https://nix.dev/concepts/flakes.html) is the repository's declared
set of pinned dependencies and named outputs. This flake exposes four groups:

- `homeConfigurations` contains the three standalone Home Manager profiles.
- `nixosModules.default` is a reusable block of NixOS configuration. It lets
  [`system-nix`](https://github.com/gnamikawa/system-nix) consume the full user
  environment as part of a NixOS system.
- `devShells.x86_64-linux` contains named, self-sufficient development
  environments: `cpp`, `cuda`, `go`, `java`, `node`, `python`, and `rust`, plus
  a small `default` environment and the combined `cpp-cuda` environment.
- `packages.x86_64-linux` contains `greeter`, which supplies the login screen;
  `session-lock`, which locks the active graphical session; and `geistdesign`,
  which packages shared design-system assets. `system-nix` consumes these
  packages to assemble the system; they are not general user applications.

## Ownership boundary

This repository owns user-level configuration. That includes applications,
preferences, user packages, development environments, and desktop behaviour.
It does not own operating-system configuration, hardware setup, secrets, or
mutable user data.

On NixOS, `system-nix` is the system entry point. It owns the operating system
and consumes this repository's default NixOS module. On other Linux
distributions, the standalone profiles provide the user environment without
requiring NixOS.

## Inspect before activating

You need [Nix](https://nix.dev/install-nix) with
[flakes enabled](https://nix.dev/concepts/flakes.html). Activation also needs
the [Home Manager command](https://nix-community.github.io/home-manager/nix-flakes/standalone.html).
These links cover the wider Nix ecosystem; this README only describes this
repository's entry points.

Clone the repository, then inspect its outputs without changing your user
environment:

```console
$ git clone https://github.com/gnamikawa/dotfiles-nix.git
$ cd dotfiles-nix
$ nix flake show
```

Evaluate and build the repository's checks with:

```console
$ nix flake check
```

This may fetch and build dependencies, but it does not activate a Home Manager
profile. To build one profile without activating it:

```console
$ home-manager build --flake .#genzo-terminal
```

Activating a profile changes the current user's packages and managed files.
This configuration is written for the `genzo` account and hard-codes its home
directory, so review and adapt it before running any activation command. Once
reviewed, a standalone profile can be activated with:

```console
$ home-manager switch --flake .#genzo-terminal
```

Replace `genzo-terminal` with `genzo-apps` or `genzo-desktop` only after
reviewing the larger profile. In particular, `genzo-desktop` supplies a
graphical session rather than fitting beneath an existing one.

## Compatibility and maturity

The project is actively evolving. It currently targets `x86_64-linux`, follows
the unstable Nix packages branch, and serves the maintainer's desktop and
laptop. The standalone profiles are checked by the flake, but the project does
not claim exhaustive manual testing across Linux distributions or graphical
environments.

## Further reference

- [`CONTEXT.md`](CONTEXT.md) defines the project's canonical terms.
- [`docs/adr/`](docs/adr/) records architectural decisions and their
  trade-offs.
- [`docs/maintenance.md`](docs/maintenance.md) documents standing maintenance
  and recovery procedures.
