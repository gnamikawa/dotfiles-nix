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
- **Opinionated.** This configuration makes deliberate choices instead of trying
  to be a general-purpose framework. Hyprland, the compositor that arranges
  windows and provides the graphical session, owns the full desktop. Geist,
  Vercel's design system—a shared set of visual rules—governs its visual
  language. Bash is the configured shell.
- **Portable.** Home Manager can activate profiles on its own, without NixOS,
  the Linux distribution configured with Nix. This lets the user environment run
  on other Linux distributions. Applications and preferences can sit beneath a
  distribution-owned desktop, while the full desktop profile supplies its own
  graphical session. The terminal profile works in graphical terminals, Linux
  text consoles (TTYs), and SSH sessions; it does not promise shell-agnostic
  behaviour.
- **Keyboard-first.** Every interactive surface should be reachable and operable
  without a pointer, except work that is inherently pointer-driven.

## Profiles

| Profile          | What it provides                                                                                        | Intended setting                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `genzo-terminal` | Bash, terminal applications, command-line tools, and the default development environment                | A graphical terminal, Linux TTY, SSH session, or headless machine |
| `genzo-apps`     | Everything in `genzo-terminal`, plus graphical applications and preferences that do not own the session | A Linux distribution that already provides its own desktop        |
| `genzo-desktop`  | Everything in `genzo-apps`, plus the graphical session itself                                           | A complete Hyprland desktop supplied by this repository           |

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
  a small `default` environment and the combined `cpp-cuda` environment. A
  separate `dotfiles-maintenance` environment holds this repository's own
  formatters, linters, and git hooks (see "Contributing" below); it is not part
  of the language catalog and never leaks into a Home Manager profile.
- `packages.x86_64-linux` contains `greeter`, which supplies the login screen;
  `session-lock`, which locks the active graphical session; and `geistdesign`,
  which packages shared design-system assets. `system-nix` consumes these
  packages to assemble the system; they are not general user applications.

## Ownership boundary

This repository owns user-level configuration. That includes applications,
preferences, user packages, development environments, and desktop behaviour. It
does not own operating-system configuration, hardware setup, secrets, or mutable
user data.

On NixOS, `system-nix` is the system entry point. It owns the operating system
and consumes this repository's default NixOS module. On other Linux
distributions, the standalone profiles provide the user environment without
requiring NixOS.

## Inspect before activating

You need [Nix](https://nix.dev/install-nix) with the `flakes`
[experimental feature](https://nix.dev/manual/nix/latest/development/experimental-features.html)
enabled. The flake also uses the `pipe-operators` feature; it declares that
itself, so you do not enable it in `nix.conf` — but Nix only trusts a flake's
declared config for a trusted user, so either add yourself to `trusted-users` in
`nix.conf` or pass `--accept-flake-config` on every command. Activation also
needs the
[Home Manager command](https://nix-community.github.io/home-manager/nix-flakes/standalone.html).
These links cover the wider Nix ecosystem; this README only describes this
repository's entry points.

Clone the repository, then inspect its outputs without changing your user
environment:

```console
git clone https://github.com/gnamikawa/dotfiles-nix.git
cd dotfiles-nix
nix flake show
```

Evaluate and build the repository's checks with:

```console
nix flake check
```

This may fetch and build dependencies, but it does not activate a Home Manager
profile. To build one profile without activating it:

```console
home-manager build --flake .#genzo-terminal
```

Activating a profile changes the current user's packages and managed files. This
configuration is written for the `genzo` account and hard-codes its home
directory, so review and adapt it before running any activation command. Once
reviewed, a standalone profile can be activated with:

```console
home-manager switch --flake .#genzo-terminal
```

Replace `genzo-terminal` with `genzo-apps` or `genzo-desktop` only after
reviewing the larger profile. In particular, `genzo-desktop` supplies a
graphical session rather than fitting beneath an existing one. Home Manager's
default lookup on the `genzo` account resolves `home-manager switch --flake .`
(no attribute) to `genzo-desktop`, so the attributeless form activates the full
desktop.

## Compatibility and maturity

The project is actively evolving. It currently targets `x86_64-linux`, follows
the unstable Nix packages branch, and serves the maintainer's desktop and
laptop. The standalone profiles are checked by the flake, but the project does
not claim exhaustive manual testing across Linux distributions or graphical
environments.

## Contributing

Formatting, linting, and the pull-request checks all run through one pinned
toolchain: enter it with `nix develop .#dotfiles-maintenance`, or activate it
automatically with [direnv](https://direnv.net/) (`direnv allow` once this
repository's `.envrc` is trusted). Entering the environment — by either route —
points git at `.githooks`, so the checks below run on every commit and push from
that point on:

- **Pre-commit** checks formatting (`nix fmt`), ShellCheck, actionlint, and
  Markdownlint against the files staged for that commit, and fails without
  changing anything if one of them would have rewritten a file.
- **Pre-push** runs `nix flake show` and the `formatting` check: the same
  whole-flake evaluation and formatting/linting sweep GitHub Actions runs first,
  without building any package or VM test.

`nix fmt` applies the same tools' safe fixes — nixfmt, Prettier, StyLua, shfmt,
and Markdownlint's auto-fixable rules — across the whole tree; run it yourself
before committing so the hook stays a check rather than a fix (see `AGENTS.md`
"Formatting" for why this matters when a file has both staged and unstaged
changes).

GitHub Actions (`.github/workflows/ci.yaml`) repeats the same formatting and
linting pass, evaluates and builds every check this flake declares, and then
runs `system-nix`'s VM test suite against the commit under review, so a change
that also needs a coordinated `system-nix` change can be tested together (see
the workflow file for the `System-Nix-Ref` pull-request contract).

## Further reference

- [`CONTEXT.md`](CONTEXT.md) defines the project's canonical terms.
- `docs/adr/` records architectural decisions and their trade-offs.
- [`docs/maintenance.md`](docs/maintenance.md) documents standing maintenance
  and recovery procedures.
