# Context

Glossary of terms as used in this repository. Definitions here are canonical;
if code or conversation disagrees with this file, one of them is wrong.

This repository maintains structure parity with system-nix — see
`docs/adr/0002-structure-parity-with-system-nix.md`.

## Terms

### Module
One concern, one file, directly under `modules/`. A module is shared by every
host; anything host-specific does not belong in one. `modules/default.nix` is
the aggregator that imports all of them. A module may be a directory instead
of a file only when it carries its own asset tree (currently only `sway/`).

### Package bundle
An install-only module under `modules/packages/` — it adds packages and
configures nothing. Current bundles: base-linux, user-applications, etc,
nvidia.

### Base Linux packages
The standard Linux userland that mainstream distributions (e.g. Debian) ship
preinstalled but NixOS deliberately leaves to the user — coreutils, grep,
curl, vim, and kin.

### Etc packages
The grab-bag of system-adjacent packages with no better home yet: hardware
enablement (wacom, v4l, iOS devices), Wayland utilities, and Nix glue. Known
to be fuzzy; tolerated deliberately.

### User applications
Desktop/GUI applications chosen by the user. Anything useful without a
display belongs in CLI tools instead.

### CLI tools
Terminal-only tools — everything in this bundle must be useful on a
headless box. Never toolchains: compilers, runtimes, and library headers
belong to development environments, not the ambient layer.

### Ambient layer
The set of tools present in every interactive shell on every host without
any activation step. It is deliberately **lean**: the interactive CLI
toolkit only. Compilers, language runtimes, build toolchains, and library
headers are never ambient — they belong to development environments. This
repository owns the user-level part (portable to non-NixOS machines);
system-nix owns the system-level part (its base system). The term is shared
with system-nix.

### Development environment
A named, activatable set of toolchain packages layered on top of the
ambient layer, defined in this repository's devshell catalog. The
**default development environment** is active in **every interactive shell
at any working directory** and contains only cross-language glue, never
full language toolchains. Its automatic activation does not make it
ambient: unlike the ambient layer it remains a **removable layer** —
identifiable, shadowable, and strippable per project — whereas ambient
tools are never removable. A **project environment** stacks on top of it,
shadows any of its tools, or removes it entirely (first-class: a project
declares removal with one line, never hand-rolled PATH surgery).
**Language environments** (`cpp`, `rust`, `go`, `node`, …) are
self-sufficient — each carries its complete toolchain rather than a delta —
and stack on top of whatever is already active. Combinations that must
compile against each other's libraries are pre-merged; anything else
composes at activation time. The term is shared with system-nix.

### Guide-compatibility tool
A tool kept in the ambient layer not because it is habitually used but
because external documentation (guides, tutorials, answers) assumes its
presence. Keeping one is a deliberate decision with this stated rationale.
The term is shared with system-nix.

### Profile
A composition of modules that standalone home-manager can activate. Two
exist: **graphical** (the full configuration, GUI packages wrapped for
foreign-distro GL) and **terminal** (the headless subset the graphical
profile builds upon). Under NixOS the graphical profile plus a host
directory is always used.

### Host
A named machine this configuration serves. Currently `GEN-DPC` (desktop,
NVIDIA GPU) and `GEN-LPC` (laptop). Everything that differs between machines
lives in `hosts/<NAME>/`; a machine whose hostname has no directory there
fails at evaluation on purpose. The term is shared with system-nix.

### Asset
A raw (non-Nix) config file under `assets/`, symlinked into the home
directory out-of-store so the application can read — and write — it live,
without a rebuild. Assets are the escape hatch for programs that rewrite
their own config.

### Constants
The palette/theme attrset under `constants/`, injected into every module via
`extraSpecialArgs`. It is data, not a module.
