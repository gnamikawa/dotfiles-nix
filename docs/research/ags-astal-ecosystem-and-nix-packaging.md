# AGS/Astal ecosystem survey and Nix packaging

Research for [issue #31](https://github.com/gnamikawa/dotfiles-nix/issues/31)
(part of the AGSv2 migration map, #30). Investigated 2026-07-26 against
primary sources only: the Aylur/ags, Aylur/astal and Aylur/gnim repositories,
their official docs, nixpkgs source, the home-manager source tree, GTK
documentation, and the npm registry.

**Amended 2026-07-30** ([#41](https://github.com/gnamikawa/dotfiles-nix/issues/41)):
§4's hm-module/nixGL claim was falsified by measurement in
[#37](https://github.com/gnamikawa/dotfiles-nix/issues/37) and has been
rewritten; the TL;DR and §3 shape summary follow it. Everything else stands
as investigated.

## TL;DR

- **Target AGS v3, not v2.** AGS v3 (v3.0.0, 2025-10-22; latest v3.1.2,
  2026-04-08) replaced the v2 frontend layer wholesale, and the v2-era
  TypeScript bindings inside Astal are explicitly marked for removal
  upstream. "AGSv2" in the migration map's name should be read as "AGS,
  current major" — the code written should be v3 (Gnim JSX, GTK4).
- **Every surface we need has a first-party Astal library**: hyprland,
  wireplumber, network, bluetooth, brightness, tray, notifd, apps.
- **Nix packaging**: nixpkgs ships AGS **v2.3.0 only** (stale) plus a fresh
  `astal.*` scope, but both just lost their principal maintainer
  (2026-07-21). For v3, the upstream `github:aylur/ags` flake is the only
  packaged source; it bundles TypeScript hermetically (esbuild embedded in
  the Go CLI — no npm access in the project's build) and ships a
  home-manager module.
- **nixGL**: the shell is a GJS + GTK4 app, GPU-rendered by default, so the
  final derivation must go through `config.lib.nixGL.wrap` like every other
  GUI package (ADR 0003). Wrap the *bundled output derivation*; the upstream
  home-manager module *accepts* a wrapped package but then silently drops
  its own `extraPackages` and ldflag overrides (see §4, corrected per
  [#37](https://github.com/gnamikawa/dotfiles-nix/issues/37)), so prefer
  bundling + a self-managed unit, wrapping last.

## 1. AGS v2 vs v3 vs "Astal directly"

### Version history and what v3 changed

Release history of Aylur/ags (GitHub releases API,
<https://api.github.com/repos/Aylur/ags/releases>): v1.8.2 (2024-04-29) was
the last v1; v2.0.0 (2024-11-13) through v2.3.0 (2025-02-04) were the v2
line; v3.0.0 shipped 2025-10-22, followed by v3.1.0 (2025-11-27), v3.1.1
(2025-12-14) and v3.1.2 (2026-04-08). There have been no v2 releases since
February 2025.

The project's own history (Astal docs,
<https://github.com/Aylur/astal/blob/main/docs/guide/introduction.md>):
AGS v1 was JavaScript-only; moving the backend to Vala/C with GObject
Introspection created Astal and AGS v2; the author then calls including
frontend abstractions in Astal "a misstep", notes he lost interest in the
Python and Lua ports, and says the frontend was decoupled from Astal into
**Gnim**, "leading to the emergence of AGS v3".

v3.0.0 release notes
(<https://github.com/Aylur/ags/releases/tag/v3.0.0>): the JSX runtime moved
to Gnim because the v2 implementation depended on GTK3's cascading
`destroy` signal, which GTK4 broke; `astalify` is gone (plain JSX over GTK
widgets); the `Variable` API is replaced by `Accessor` +
`createState`/`createBinding`/`createComputed`; `<For>`/`<With>` handle
dynamic children; lifecycle hooks (`onMount`, `onCleanup`, `createRoot`);
GTK4 is the default for `ags init`; and `ags bundle` now embeds the JS in a
Bash script so `LD_PRELOAD` of gtk4-layer-shell no longer needs manual
handling. Migration guide:
<https://aylur.github.io/ags/guide/migration-guide.html>.

### The v2 binding layer is deprecated upstream

The Astal repo still contains the v2-era language bindings under `lang/`,
but its README states: "Do not use these, they will be removed before the
first release. GJS code moved to <https://github.com/aylur/gnim/>. Lua moved
to <https://github.com/tokyob0t/astal-lua>"
(<https://github.com/Aylur/astal/blob/main/lang/README.md>). An AGS v2
config imports exactly that layer, so writing new v2 code means building on
code already scheduled for deletion.

### What "Astal directly" means now

Astal is "a collection of libraries written in Vala and C" providing
backend logic only (<https://github.com/Aylur/astal> README /
`docs/guide/introduction.md`). It is consumed through GObject
Introspection from any language; using it "directly" from GJS today means
hand-written GTK code without JSX/reactivity. AGS v3 is the first-party
frontend path: "AGS is a scaffolding tool for Astal + Gnim projects written
in TypeScript. Gnim is a library which brings JSX to GJS"
(`docs/guide/introduction.md`). Gnim itself provides JSX + reactivity for
GJS, GObject decorators, and DBus decorators
(<https://aylur.github.io/gnim/>). Conclusion: "Astal directly" and "AGS
v3" use the same service libraries; AGS v3 only adds the TypeScript/JSX
frontend plus the bundler CLI. There is no reason to forgo it.

### Maintenance outlook

- Astal: actively maintained — latest commit 2026-07-24 (commits API,
  <https://api.github.com/repos/Aylur/astal/commits>). Note it has never
  tagged a release; nixpkgs packages it as unstable snapshots.
- AGS: latest release 2026-04-08 (v3.1.2); `main` is the v3 line
  (`cli/version` reads 3.1.0,
  <https://github.com/Aylur/ags/blob/main/cli/version>).
- Gnim: npm package `gnim` at 1.9.1, last registry modification 2026-07-11
  (<https://registry.npmjs.org/gnim>); repo last commit 2026-04-08.
- The whole stack is effectively a single-author (Aylur) ecosystem — the
  history section of the Astal docs is written in first person singular.
  Active, but bus factor 1; the v1→v2→v3 sequence shows the frontend API
  has been rewritten twice in two years, while the Astal service libraries
  have stayed stable through both rewrites. Depending on Astal services +
  as thin a frontend layer as practical is the durable position.

## 2. Astal service libraries vs our surfaces

Library list from
<https://github.com/Aylur/astal/blob/main/docs/guide/libraries/references.md>
(descriptions quoted from there) and the `lib/` tree
(<https://github.com/Aylur/astal/tree/main/lib>). References per library at
`https://docs.astal.dev/<name>`.

| Surface | Library | Notes |
| --- | --- | --- |
| Hyprland workspaces | `hyprland` | "Library and cli tool for Hyprland IPC socket" |
| PipeWire/PulseAudio | `wireplumber` | "A library for audio control using wireplumber" — controls PipeWire via its session manager; there is no separate PulseAudio library |
| Network | `network` | "NetworkManager wrapper library" (requires NetworkManager as the backend) |
| Bluetooth | `bluetooth` | "Library to control bluez over dbus" |
| Backlight | `brightness` | "Library and CLI tool to read and control device brightness"; sysfs backlight + LED devices, guessed `screen`/`keyboard` singletons, normalized 0–1 `brightness`; default backend writes via systemd-logind, a udev-rules backend is a meson option (`docs/guide/libraries/brightness.md`) |
| Tray | `tray` | Implements the freedesktop StatusNotifierItem protocol (`docs/guide/libraries/tray.md`) |
| Notifications (daemon) | `notifd` | Freedesktop notification-spec daemon as a library; first instance becomes the daemon, later instances become clients, so bar and popup processes can share it (`docs/guide/libraries/notifd.md`) |
| App launching | `apps` | "Library and cli tool for querying applications" with `.desktop` files; `fuzzy_query` + launch (`docs/guide/libraries/apps.md`) |

Also available if wanted later: `battery` (upower), `mpris` (media
players), `powerprofiles`, `cava` (audio visualizer), `greet` (greetd),
`auth` (PAM), `river`, and infrastructure libs `io` (astal-io),
`astal3`/`astal4` (GTK3/GTK4 layer-shell window widgets), `quarrel`,
`wl`/`wayland-glib`. The `brightness`, `quarrel` and `wl`/`wayland-glib`
libraries are newer additions not present in the early v2-era set.

Every surface in the migration map is covered first-party; no third-party
service code is needed. All libraries expose a matching `astal-*` CLI,
which is useful for scripting before/independent of the shell.

## 3. Nix packaging

### nixpkgs: v2 only, and freshly maintainerless

- `pkgs/by-name/ag/ags/package.nix` pins **ags 2.3.0**
  (<https://github.com/NixOS/nixpkgs/blob/master/pkgs/by-name/ag/ags/package.nix>).
  No PR bumping it to v3 exists as of 2026-07-26 (nixpkgs PR search).
- Astal is a nixpkgs scope: `astal = recurseIntoAttrs (lib.makeScope …)` in
  `pkgs/top-level/all-packages.nix` (line 5455), built from
  `pkgs/development/libraries/astal/` off a single source pin — currently
  `0-unstable-2026-07-19`
  (<https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/libraries/astal/source.nix>).
  All the libraries above exist as `astal.<name>` including `brightness`
  (`pkgs/development/libraries/astal/default.nix`).
- nixpkgs `ags` carries `passthru.bundle`, a helper that wraps
  `ags bundle` into a derivation
  (<https://github.com/NixOS/nixpkgs/blob/master/pkgs/by-name/ag/ags/bundle.nix>)
  — but it drives the v2 CLI.
- Maintenance signal: PR [#544276](https://github.com/NixOS/nixpkgs/pull/544276)
  ("ags, astal: drop myself from maintainers", merged 2026-07-21) removed
  PerchunPak; `buildAstalModule.nix` now sets **no maintainers** for the
  astal scope, and `ags` retains only johnrtitor.

Verdict: nixpkgs cannot provide an AGS v3 today, and its astal scope just
lost its driver. Use the upstream flakes.

### Upstream flakes

`github:aylur/ags` (flake.nix on main,
<https://github.com/Aylur/ags/blob/main/flake.nix>):

- `packages.<system>`: `ags`/`default`, `agsFull` (AGS with every Astal
  library + libadwaita baked into the gjs runtime), and it re-exports all
  of `astal.packages.<system>` (so one input can suffice).
- `homeManagerModules.default` → `programs.ags` with options `enable`,
  `package`, `astal.gtk3Package`/`astal.gtk4Package`/`astal.ioPackage`,
  `configDir` (symlinked to `~/.config/ags` — leave `null` if the source
  already lives there), `extraPackages` (extra Astal libs and executables
  for the gjs runtime; the module only includes astal3/astal4/io by
  default), `systemd.enable` (user service running `ags run`), and
  read-only `finalPackage`
  (<https://github.com/Aylur/ags/blob/main/nix/hm-module.nix>,
  <https://github.com/Aylur/ags/blob/main/docs/guide/nix.md>).
- A flake template (`nix flake init --template github:aylur/ags`) showing
  the packaging pattern.
- `github:aylur/astal` exposes each library as
  `astal.packages.<system>.<name>`; the recommended wiring is
  `ags.inputs.astal.follows = astal` with both following nixpkgs
  (`docs/guide/nix.md`).

### How TypeScript bundling interacts with the Nix build

The interaction is unusually Nix-friendly:

- The `ags` CLI is a Go binary that **embeds esbuild** (`cli/go.mod`
  requires `github.com/evanw/esbuild v0.25.10`,
  <https://github.com/Aylur/ags/blob/main/cli/go.mod>). `ags bundle`
  therefore transpiles/bundles fully offline inside the sandbox — the
  project derivation needs no npm fetch, lockfile, or `npmDepsHash`.
- The JS runtime library (the `ags` JS package plus its `gnim` dependency)
  is prebuilt into the AGS package itself via `buildNpmPackage` with a
  fixed `npmDepsHash`, and the store path is burned into the CLI via
  `ldflags` (`-X main.agsJsPackage=…`)
  (<https://github.com/Aylur/ags/blob/main/nix/default.nix>). The npm side
  is upstream's problem, not the config repo's.
- Canonical project derivation (from `docs/guide/nix.md`):
  `stdenv.mkDerivation` with `nativeBuildInputs = [ wrapGAppsHook3
  gobject-introspection ags.packages.<sys>.default ]`, `buildInputs =
  [ glib gjs astal.io astal.astal4 <service libs> ]`, and
  `installPhase = "ags bundle app.ts $out/bin/my-shell"`; runtime
  executables are prefixed onto PATH via `gappsWrapperArgs`. The service
  libraries must be `buildInputs` of the derivation — on Nix, GI libraries
  cannot be "installed globally" and picked up at runtime
  (<https://github.com/Aylur/astal/blob/main/docs/guide/nix.md>).
- In v3 the bundle output is a Bash script embedding the JS, which handles
  the gtk4-layer-shell `LD_PRELOAD` itself (v3.0.0 release notes; the nix
  build passes the `gtk4-layer-shell` store path via ldflags).
- The `astal-*` CLI tools are not exposed by the home-manager module; add
  e.g. `astal.packages.<sys>.notifd` to `home.packages` if the CLIs are
  wanted (`docs/guide/nix.md`).

Two viable shapes for this repo: (a) the home-manager module +
`configDir`, which runs from source via `ags run` (dev-loop friendly,
but on a standalone profile its overrides are silently lost under nixGL —
see §4), or (b) a bundled derivation per the template, installed and
unit-managed like any other package (hermetic, wrappable, survives an AGS
CLI absence at runtime).

## 4. nixGL for the standalone profiles

Why wrapping is needed: the bundled shell is a GJS app rendering through
GTK4, whose GSK renderers are GPU-backed (OpenGL/Vulkan) with cairo as
"the fallback Cairo renderer" (<https://docs.gtk.org/gtk4/running.html>).
On a foreign distro the nix-linked mesa cannot find the host's drivers —
the exact situation ADR 0003 already covers for every GUI package.

Mechanics (home-manager source,
<https://github.com/nix-community/home-manager/blob/master/modules/targets/generic-linux/nixgl.nix>):
`config.lib.nixGL.wrap` (default wrapper), `config.lib.nixGL.wrappers.<w>`
and `wrapOffload` exist whenever the module is loaded; with
`nixGL.packages` unset they are no-ops, which is why wrapping costs
nothing under NixOS (ADR 0003 verified identity by derivation-path
equality). This repo already sets `nixGL.packages` and
`defaultWrapper = "mesa"` in the standalone graphical profile
(`flake.nix` lines 94–97). Per the module docs, any Nvidia wrapper
requires building with `--impure`; mesa (our default) does not.

Requirements for the AGS shell specifically:

- **Wrap the derivation that actually launches** — the bundled shell
  package (shape (b)) goes through `config.lib.nixGL.wrap` exactly like
  the other GUI packages, and our own systemd unit points at the wrapped
  binary. Nothing AGS-specific: the v3 bundle is a Bash script that execs
  gjs, and nixGL wraps by setting GL environment variables around the
  entrypoint, so the two compose.
- **The upstream hm module silently discards its own overrides when given
  a nixGL-wrapped package.** This note originally claimed the module
  *rejects* such a package — that `finalPackage`'s `.override` call cannot
  be satisfied because wrapping loses `.override`, that `finalPackage`
  being read-only is an obstacle, and that `ExecStart` ends up unwrapped.
  [#37](https://github.com/gnamikawa/dotfiles-nix/issues/37) built the
  thing and **falsified every clause** of that: home-manager's wrapper
  deliberately re-adds `.override`
  (`modules/targets/generic-linux/nixgl.nix:300-307`), the module evaluates
  and builds clean, and `finalPackage` comes out still wrapped with
  `ExecStart` pointing at the wrapped path.
  The real constraint is worse because it is silent: nixGL's
  `buildCommand` interpolates the store path captured **at wrap time**
  (`cp -rs "${pkg.out}"`), so the module's later `.override` and
  `overrideAttrs` change the derivation hash while changing nothing about
  what is copied or exec'd. Two module behaviours are lost with no error —
  `extraPackages`/`astal.*Package` never reach the gjs runtime (so every
  service library this migration needs would be missing), and the
  `-X main.agsJsPackage=$HOME/.local/share/ags` ldflag is inert. It
  surfaces only at runtime, as a TSX `import` of an Astal service failing.
  Scope: **standalone profiles only** — where `nixGL.packages` is unset
  (NixOS: GEN-DPC, GEN-LPC) `wrap` is the identity, so `programs.ags` with
  `systemd.enable = true` is usable there. Either way the safe shape is to
  **wrap last, after every `.override`**, which shape (b) does by
  construction. Measured evidence: [harness, commands and build
  log](https://gist.github.com/gnamikawa/2a36043261f55592a439f58cbcbe7047).
- No extra `LD_PRELOAD` handling is needed for gtk4-layer-shell in v3
  (v3.0.0 release notes) — one less thing to thread through the wrapper.

## Recommendation snapshot

Target **AGS v3 via the upstream `aylur/ags` flake input** (with
`aylur/astal` following the same nixpkgs), pull exactly the service
libraries per surface (`hyprland`, `wireplumber`, `network`, `bluetooth`,
`brightness`, `tray`, `notifd`, `apps`) into the derivation/`extraPackages`,
bundle with `ags bundle` inside a derivation for the installed artifact,
and route that derivation through `config.lib.nixGL.wrap` with a
self-managed systemd user unit. Treat nixpkgs' `ags`/`astal.*` as
unavailable for v3 purposes until someone lands a v3 bump there.

## Claims not verified against a primary source

- Which GPU renderer GTK4 selects by default per version (ngl vs vulkan);
  the GTK running-docs confirm only that cairo is the fallback and the
  others are GL/Vulkan renderers.
- ~~The hm-module/systemd/nixGL incompatibility above is my reading of the
  module source, not a documented upstream limitation.~~ **Since verified
  and falsified as stated** by
  [#37](https://github.com/gnamikawa/dotfiles-nix/issues/37) — the module
  accepts a wrapped package and keeps the wrap; the true defect is
  override-loss-through-wrapping, and §4 now records it.
- Long-term maintenance intent of the Aylur ecosystem is inferred from
  release/commit cadence and the docs' first-person history, not from any
  stated roadmap.
