# Lean ambient layer, toolchains in a devshell catalog

Toolchains never live in the ambient layer — not in system-nix's
`environment.systemPackages`, not in this repository's `home.packages`.
They live in `devshells/`, a catalog of self-sufficient flake devShells
(`cpp`, `rust`, `go`, `node`, `python`, `java`, `cuda`, …) activated
through direnv. The twin of this decision lives in system-nix as
`docs/adr/0004-lean-ambient-layer-devshell-catalog.md`.

Why this shape:

- The old lists imitated Debian's task selection (`build-essential`,
  "standard system utilities"), which on NixOS installed inert packages:
  daemon binaries whose services were never enabled, and `.dev` headers
  that no global search path ever saw. `gcc foo.c -lssl` never worked.
  As mkShell `buildInputs`, the same headers work.
- The Debian *feel* — tools at your fingertips — is kept, but delivered by
  the layer that travels: `home.packages` follows the user to non-NixOS
  machines (standalone mode), and devShells run identically anywhere Nix
  runs. `environment.systemPackages` travels nowhere.
- A **default development environment** (cross-language glue: `make`,
  `python3`) is prepended to PATH by every interactive shell at any
  working directory, as a prebuilt profile of the same package list
  `devShells.default` is built from — so a ten-line script never demands
  a `flake.nix` ceremony. It stays a removable layer, never ambient: the
  claiming shell exports the profile path in `DEFAULT_DEV_ENV`, project
  direnv environments layer in front of it, and a one-line helper
  (`drop_default_env`) strips it for projects that need it absent.
  Rejected alternatives: a fat ambient layer with all toolchains
  (re-bloats what the refactor leaned out); per-shell `nix develop`
  evaluation in bashrc (slow, uncached, nests shells — a prebuilt
  profile path costs none of that); a managed, whitelisted `~/.envrc`
  (direnv only reaches descendants of a `.envrc`, so every path outside
  `$HOME` loses the layer); a `.envrc` at the filesystem root
  (home-manager cannot write outside `$HOME`, it imposes one user's
  layer on every user of the machine, and it makes direnv load-bearing
  for every shell everywhere); and `environment.systemPackages` (not a
  layer — nothing a project can shadow cleanly or remove). Root login
  shells (`sudo -i`) are deliberately out of scope — root gets the base
  system only; plain `sudo <cmd>` already inherits the caller's PATH,
  NixOS setting no `secure_path`.
- Each catalog file exports plain mkShell arguments, so environments
  compose two ways: predefined merges via `inputsFrom` where builds must
  see both toolchains (`cpp-cuda` — also required because nvcc rejects
  host compilers newer than it supports, so `cuda` pins its own gcc), and
  ad-hoc stacking of `use flake dotfiles#<env>` lines in a project
  `.envrc`, where the last layer wins on scalar build variables.

Consequences: system-nix keeps only its base system (hardware, devices,
kernel, administration — including annotated guide-compatibility tools that
must survive `sudo`, which home.packages does not); its VM tests gain
guarantees that ambient tools resolve in a real login shell, that the
default development environment is present in every interactive shell
(proven outside `$HOME`), that a project environment layers over it and
can remove it entirely, and that plain `sudo` inherits the invoking
shell's environment.
