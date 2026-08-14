# Context

Glossary of terms as used in this repository. Definitions here are canonical;
if code or conversation disagrees with this file, one of them is wrong.

This repository maintains structure parity with system-nix — see
`docs/adr/0002-structure-parity-with-system-nix.md`.

## Working style

Answers are short and in plain language. A few sentences beats a structured
write-up; length is earned only when the subject genuinely needs it, never
spent on restating or on options that won't be pursued. The length rule is
for conversation — ADRs, research notes and the definitions below are
reference material and stay as long as they must be.

A sentence must stand on its own. Never let an issue number, a pull request
number, a section marker or a file path do the work of an explanation: say the
thing, then cite. "Issue #46 settled this" tells the reader nothing they can
act on; "the audit found the role names are Geist's own" does, and the number
can follow it in parentheses. Assume the reader has not read what is being
cited and will not go and read it now. This applies to references backwards in
the same conversation too — a decision made an hour ago still needs restating
in a clause, not pointed at.

Define specialist terms on first use in an exchange. If a reader would need a
glossary to parse the sentence, either reword it or gloss the term in a clause
before using it. And when the point turns on specific wording in a file, quote
that wording into the sentence itself; a line number is a pointer, not an
explanation. Both rules apply to the repository's prose (ADRs, research notes,
commit messages) as well as to conversation — length can grow when a document
needs it, but jargon-without-context and pointer-in-place-of-explanation cannot.

## Terms

### Portable user environment
The centralized, opinionated configuration of one user's applications,
preferences, packages, development environments, and desktop behaviour. It
travels across Linux distributions and remains usable in a distribution-owned
graphical session, a graphical terminal, a Linux TTY, or an SSH session. The
full desktop profile deliberately supplies its own graphical session, while
the terminal profile deliberately configures Bash rather than promising
shell-agnostic behaviour. Operating-system configuration, hardware setup,
secrets, and mutable user data remain outside this environment.

### Module
One concern, one file, directly under `modules/`. A module is shared by every
host; anything host-specific does not belong in one. Modules are composed into
profiles rather than all imported at once, so no single file imports them
all — a host may import a module its profile leaves out. A module may become
a directory only when one file no longer holds its responsibilities cleanly
(see `docs/maintenance.md`); none currently does.

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
A composition of modules that standalone home-manager can activate. Three
exist, each layered on the one before: **terminal** (the headless subset),
**apps** (terminal plus everything graphical that does not own the session,
GUI packages wrapped for foreign-distro GL), and **desktop** (apps plus the
session itself — compositor and lock screen). The boundary between apps and
desktop is whether a thing owns the session, not whether it is graphical, so
apps is the one safe to activate on a distribution that ships its own
desktop. Under NixOS the desktop profile plus a host directory is always
used; the host directory supplies the shell surfaces that host runs.

### Host
A named machine this configuration serves. Currently `GEN-DPC` (desktop,
NVIDIA GPU) and `GEN-LPC` (laptop). Everything that differs between machines
lives in `hosts/<NAME>/`; a machine whose hostname has no directory there
fails at evaluation on purpose. The term is shared with system-nix.

### Asset
A raw (non-Nix) config file under `assets/`, symlinked into the home
directory out-of-store so it can be read — and edited — live, without a
rebuild. Assets are the **default** home for all configuration. A config
is Nix-managed only where it needs a power raw files lack: injected
values (constants), store-path references, or host/profile branching —
and then only as a computed slice, never wholesale.

### Computed slice
The minimal Nix-generated portion of an otherwise raw configuration,
joined to its asset via the application's own include mechanism. A
rationale for Nix management admits only the slice that needs it, never
the whole config: ten host-varying lines earn generation; the static
body around them stays an asset.

### Keyboard-first
The system is operated entirely from the keyboard; the mouse is a last
resort and, where possible, never required. Every interactive surface
must be fully reachable and operable without a pointer — a flow that
demands the mouse is a defect. Inherently pointer-driven work (drawing
on the Cintiq) is the sole exemption.

### Action hub
The single-keybind, keyboard-driven menu hosting infrequent quick
actions (status checks, device switching, summoning parked windows,
power actions). It exists to cap keybind pollution: a new quick action
lands in the hub by default and earns a dedicated keybind only through
high frequency of use.

### Etc space
The hidden holding area for windows that deserve no screen real estate —
the window-level sibling of Etc packages. Contents are summonable over
the current view on demand and banished back out of sight; the space
occupies no output. A grab-bag by design, tolerated deliberately.

### Satellite window
A small window that belongs near the user's attention but never in the
tiling layout (video pop-outs, live-chat pop-outs). Satellites come in
two tiers: an **attention satellite** occupies a tiny dedicated corner
of the primary output, always visible, glanced at often; an **ambient
satellite** occupies the media output wholesale, watched passively.
When the media output is absent, an ambient satellite parks out of
sight and is summonable on demand rather than vanishing. A satellite
reappears at its last-used location whenever that location is visible.

### Companion sliver
A narrow window docked beside an ambient satellite on the media output
(e.g., a live-chat pop-out beside the video it belongs to). The media
output is a large-plus-sliver composition, not a single window.

### Media output
The output a host designates for ambient satellites — passive media
real estate beside the primary output. On GEN-DPC it is the TV
(the I-O Data display); GEN-LPC designates none. May be absent; its
absence changes ambient satellites' behavior, never their existence.

### Geist
The design system (Vercel's Geist) that governs all OS theming. It is
the canonical standard every themed surface — window chrome, bars,
GTK/Qt applications, terminals, notifications, lock screens, input
methods — is measured against. Adherence is expected by default: a
surface that diverges from Geist is a defect, not a stylistic choice.
The palette in Constants encodes Geist's color scales.

### Constants
The design-token attrsets under `constants/`, injected into every module via
`extraSpecialArgs`. It is data, not a module. Where a family's values differ
between themes, the theme name sits near the front of the path
(`constants.theme.dark.border.default.gray`) and every call site names the
theme it wants — there is no default theme to fall back on.

Colour values have one source: no numeric colour literal may appear outside
`constants/`. This includes pure black, pure white, alpha-bearing colours, and
SVG attributes. Consumers refer to a token directly or receive a computed
slice; generated build and Home Manager outputs may materialise the value. The
CSS keyword `transparent` is allowed because it carries no hue of its own.
