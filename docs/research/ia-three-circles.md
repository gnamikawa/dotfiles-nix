# IA three-circles research (Context, Content, Users)

Research for [#97](https://github.com/gnamikawa/dotfiles-nix/issues/97),
part of map
[#95 — Information architecture for the desktop UI](https://github.com/gnamikawa/dotfiles-nix/issues/95).
Investigated 2026-08-05 to 2026-08-06.

Method: parallel AFK research agents for **Context** and **Content**
(read-only investigation of `dotfiles-nix` and `system-nix`); a multi-turn
HITL grilling session for **Users**, following `/grilling` +
`/domain-modeling`. Establishes what is true across the three circles
Rosenfeld / Morville / Arango name in *Information Architecture for the Web
and Beyond*, 4th ed.; feeds every downstream ticket that must consult user,
environment, or existing state.

Deliberately changes nothing — this note is fact-gathering. Design work
happens in downstream tickets; the design axes recorded in
[§3.5](#35-design-axes-pinned-during-the-grilling) are user preferences
committed to during the grilling, not architectural decisions to be
re-litigated.

## TL;DR

- **Two hosts, one live, one deferred.** GEN-DPC (NVIDIA/Wacom desktop) is
  live and runs the AGS bar; GEN-LPC (Intel laptop) is on waybar and
  awaiting NixOS reinstall (per memory 2026-07-30). Different shell
  surfaces today; the reforming pass must land one IA on both.
- **The shell surfaces `#30` produced are load-bearing but sparse.** AGS
  runs the workspaces-only bar, the auth screen (shared greeter + lock),
  and the session locker. **Launcher, notifications, OSD, and action hub
  are named in ADR-0008 but do not exist yet.** No battery module. No
  network / bluetooth / volume anywhere on GEN-DPC's AGS bar. `geistdesign`
  package emits tokens (CSS custom properties + a `space`/`motion` TS
  module).
- **ADRs 0005, 0006, 0007, 0008** are the ones the reforming pass audits;
  0006 (Geist) and 0007 (Hyprland) and 0008 (AGS v3) are the personality,
  compositor, and shell commitments respectively.
- **The user is ADHD-I with strong hyperfocus and real time-blindness.**
  The IA earns its keep by *reducing friction for correct behavior rather
  than forced rules to enforce correct behavior* (user's wording, pinned as
  primary design principle).
- **Anxiety is a first-class design axis alongside the framework's
  response-required rule.** Seven anxiety patterns catalogued
  ([§3.4](#34-anxiety-axes)); every capture / retrieval / countdown flow
  answers one or more.
- **~85 first-class flows named** across daily, weekly, exception, and
  cross-boot categories ([§3.6](#36-flow-inventory)). No discrete modes;
  the design rejects mode-gating outright ([§3.9](#39-aspirational-modes--rejected)).
- **The Cintiq Pro is not a drawing surface — it's a permanent ambient
  dashboard.** Two-surface split: **drawer** (universal, exists on both
  hosts, holds *actions*) vs **Cintiq bento** (Cintiq-only, holds
  *dashboards*). See [§3.10](#310-surface-home-decisions-made-during-grilling).
- **Outlook is canonical for calendar + todos**; sqlite is canonical for
  everything Outlook can't hold (habits, journal, yeet, capture history).
- **Real gaps that need their own tickets:** LLM procedural coaching
  (blocked by offline-first + local-quality), Reason 10 / Clip Studio
  Paint Linux equivalents, cross-host handoff (parked pending GEN-LPC
  return), Windows dual-boot flow.

---

## 1. Context

The environment the IA lives in. All claims cite `dotfiles-nix/…` or
`system-nix/…` unless noted.

### 1.1 Hosts

- **GEN-DPC** — desktop tower. AMD CPU
  (`hardware.cpu.amd.updateMicrocode`, `kvm-amd` in
  `boot.kernelModules`), NVIDIA GPU. GRUB EFI boot
  (`system-nix/hosts/GEN-DPC/default.nix:13-15`). Hibernation to
  `/swapfile` on `864978b2-…`
  (`system-nix/hosts/GEN-DPC/hardware.nix:13-15`). Extra NTFS mounts
  `/mnt/windows` and `/mnt/windows-ssd`
  (`hardware.nix:48-63`). Live — imported unconditionally in the flake
  (`system-nix/flake.nix:40`). Extra host-only modules: `nvidia.nix`,
  `wacom.nix`, `steam.nix`, `ollama.nix`
  (`system-nix/hosts/GEN-DPC/default.nix:4-9`).
  `hardware.primaryMonitor = "desc:Viewteck Co. Ltd. GFV22CB"` is pinned
  here (`hardware.nix:79`) — consumed by the greeter to place its warm
  surface at 0x0.
- **GEN-LPC** — laptop. Intel CPU (`kvm-intel`,
  `hardware.cpu.intel.updateMicrocode`). GRUB installed to `/dev/nvme0n1`
  (`system-nix/hosts/GEN-LPC/default.nix:9`). Hibernation to `/swapfile`
  on `664ef959-…`, 8 GB × 2
  (`system-nix/hosts/GEN-LPC/hardware.nix:14-16`). Only imports
  `hardware.nix` (`system-nix/hosts/GEN-LPC/default.nix:3-5`) — no
  NVIDIA/Wacom/Steam. **No `primaryMonitor` pinned.** Memory
  (`gen-lpc-awaiting-nixos-reinstall.md`) records GEN-LPC as awaiting
  reinstall as of 2026-07-30, but the flake still enumerates it
  (`flake.nix:41`) and its VM guarantee spec still runs
  (`system-nix/tests/gen-lpc.spec.nix`). ADR-0003 also notes "GEN-LPC
  never set the sysctl and is unaffected"; the code carries no explicit
  "live vs deferred" flag beyond the memory note.

The dotfiles half of each host lives in `dotfiles-nix/hosts/<NAME>/`:

- GEN-DPC imports its `hyprland-outputs.nix` plus `ags.nix`,
  `ags-session-lock.nix`, `mako.nix`
  (`dotfiles-nix/hosts/GEN-DPC/default.nix:5-13`) — mako is still active
  pending an AGS notification surface; waybar has already been cut over
  to the AGS bar here (#34).
- GEN-LPC imports `hyprland-outputs.nix`, its own `waybar.nix` bar
  array, plus modules `ags.nix`, `hyprlock.nix`, `mako.nix`, `waybar.nix`
  (`dotfiles-nix/hosts/GEN-LPC/default.nix:5-16`) — still on waybar and
  Hyprlock. AGS is present but "renders nothing yet" on this host per
  the comment.

**Consequence: the two hosts run different shell surfaces today.** Bar and
lock differ; hypridle and mako are shared.

### 1.2 Screens

**GEN-DPC** (`dotfiles-nix/hosts/GEN-DPC/hyprland-outputs.nix:25-46`):

| Output | Description | Mode | Scale | Position |
|---|---|---|---|---|
| I-O Data 24" | `I-O Data Device Inc EX-LDGCQ241D GH30106986BW` | 2560×1440@59.95 | 1 | −2560×−360 (left) |
| Cintiq Pro 22 | `Wacom Tech Cintiq Pro 22 4DQ01C1000153` | 3840×2160@120 | 1 | −1920×1080 (below-left) |
| Viewteck | `Viewteck Co. Ltd. GFV22CB` | 1920×1080@144.00 | 1 | 0×0 (primary/centre) |

Workspace pinning at the same file (`hyprland-outputs.nix:49-50`):
workspace 8 → Cintiq, workspace 9 → I-O Data, both with `default:true`.
`primaryMonitor` in `system-nix/hosts/GEN-DPC/hardware.nix:79` pins the
Viewteck as the greeter/lock warm-surface host. No orientation overrides.
All at `scale = 1`.

**GEN-LPC** (`dotfiles-nix/hosts/GEN-LPC/hyprland-outputs.nix:6-12`):

| Output | Mode | Scale | Position |
|---|---|---|---|
| `eDP-1` (built-in) | 2560×1440@59.998 | 1.5 | 0×0 |

Only host with a non-1 scale. No `primaryMonitor` pinned; the greeter's
`primaryRule` (`system-nix/modules/greeter.nix:53-54`) is empty here and
the sole output at 0×0 satisfies `findPrimaryMonitor` by construction.

All screen config uses `monitorv2` and lives in
`hosts/<NAME>/hyprland-outputs.nix`; `modules/hyprland.nix` supplies
empty defaults so standalone profiles remain evaluable
(`hyprland.nix:39-40`). The generated slice is emitted to
`~/.config/generated/hypr/monitors.conf` and joined to the raw config
via `source =`
(`dotfiles-nix/assets/home/.config/hypr/hyprland.conf:6`).

### 1.3 Cintiq Pro (GEN-DPC only)

Model **Wacom Cintiq Pro 22**, serial `4DQ01C1000153`, on connector
**DP-2** (`dotfiles-nix/hosts/GEN-DPC/hyprland-outputs.nix:14,20`). Runs
at 3840×2160@120 scale 1.

Input wiring at
`dotfiles-nix/hosts/GEN-DPC/hyprland-outputs.nix:57-66`:

- **Pen** is bound compositor-wide:
  `input { tablet { output = desc:${cintiqDesc} } }` — pen maps to the
  Cintiq regardless of pointer focus.
- **Touch (finger)** is bound per-device by connector:
  `device { name = wacom-cintiq-pro-22-finger; output = DP-2 }`. Comment
  records that generic `touchdevice:output` silently ignores `desc:`
  matching so the connector spelling is load-bearing.
- **Workspace 8** defaults to the Cintiq (`hyprland-outputs.nix:49`).

System side (`system-nix/hosts/GEN-DPC/wacom.nix`):
`services.xserver.wacom.enable = true` and user `genzo` added to the
`input` group. Etc packages carry `libwacom` and `xf86_input_wacom`
(`system-nix/modules/packages/etc.nix:9-10`). **No button map / on-tablet
menu** — only pen+finger routing.

`dotfiles-nix/CONTEXT.md:129` enshrines "drawing on the Cintiq" as the
sole exemption from the keyboard-first rule. **This map's Users pass
reframes the Cintiq's role** — see [§3.10](#310-surface-home-decisions-made-during-grilling).

### 1.4 Input devices

- **GEN-DPC**: Cintiq pen + finger as above. No explicit keyboard or
  mouse binding — libinput defaults through the system stack.
  `boot.kernelModules` adds `uinput` and `hardware.uinput.enable = true`
  (`system-nix/hosts/GEN-DPC/hardware.nix:27,74`).
- **GEN-LPC**: Synaptics touchpad is **permanently disabled** —
  `device { name = synaptics-tm3289-002; enabled = false }`
  (`dotfiles-nix/hosts/GEN-LPC/hyprland-outputs.nix:14-18`). No other
  input bindings. Keyboard uses libinput defaults.
- **Both hosts**: `input { follow_mouse = 0 }` in
  `dotfiles-nix/assets/home/.config/hypr/hyprland.conf:31-34` — keyboard
  focus does not track the pointer. `services.libinput.enable = true` and
  `services.xserver.enable = true` in `system-nix/modules/desktop.nix:34-35`.

No hardware-specific keyboard layout / caps-lock remap / hotkey daemon
found in either repo.

### 1.5 Network posture

- System: `system-nix/modules/network.nix` enables NetworkManager,
  `useDHCP = true`, `firewall.allowPing = true`, opens TCP 7860 + Samba
  ports 137/138/139/445. Autoconnect retries infinite with 3-second
  delay. Avahi + timesyncd active.
- iOS device support: `services.usbmuxd.enable = true` in both
  `services.nix:8` and `ios-devices.nix:7`, plus `libimobiledevice` and
  `ifuse`. **Nothing detects "this is an iPhone tether" or NAT64
  specifically** — the machine can accept a tether, but the shell is
  unaware.
- IA-visible on **GEN-LPC (waybar)**:
  - Network module
    (`dotfiles-nix/assets/home/.config/waybar/modules.jsonc:105-127`):
    10s poll, shows wifi/ethernet/disconnected/disabled icons, tooltip
    includes essid / IP / signal / freq; left-click toggles wi-fi via
    `networktoggle.sh`, right-click opens `nm-connection-editor`.
  - Bluetooth module (`modules.jsonc:129-147`): similar shape.
  - `networktoggle.sh` just calls `nmcli networking on|off` with
    `notify-send`.
- IA-visible on **GEN-DPC (AGS bar)**: `bar/Bar.tsx` renders workspaces
  only. **No network, no bluetooth, no volume — the AGS bar surfaces
  nothing about network posture today.**
- The auth screen's status rail (`Screen.tsx:126-132`) lists host /
  system / kernel / generation / uptime / battery — **no network row**.

There is no NAT64 indicator, no "hotspot detected" hook, and no fallback
surface for the flakiness recorded in memory
(`hotspot-nat64-github-flakiness.md`, 2026-07-19).

### 1.6 Session lifecycle

- **Boot → login screen**: `services.greetd.enable = true`
  (`system-nix/modules/greeter.nix:77`). greetd's default session runs
  `start-hyprland -- --config <greeterConf>` (`greeter.nix:89`) — a
  bespoke minimal Hyprland with animations off, wallpaper off, one
  exec-once running the greeter bin under
  `systemd-cat --identifier=greeter` (`greeter.nix:41-73`).
- **Greeter user**: `greeter`, uid pinned to 988, home
  `/var/lib/greeter` wiped-and-rebuilt at every boot via
  `systemd.tmpfiles` `R!` rule (`greeter-state.nix:20-33`).
- **Greeter authentication**: greetd's PAM. Session command read at
  runtime from
  `/run/current-system/sw/share/wayland-sessions/hyprland-uwsm.desktop`
  (`dotfiles-nix/assets/home/.config/ags/greeter/session.ts:14-25`).
- **Login → session**: uwsm-managed `wayland-wm@hyprland.desktop.service`
  (`system-nix/modules/desktop.nix:5-8` — `programs.hyprland.withUWSM = true`).
- **User services started under `graphical-session.target`**:
  - `ags.service` — `ags run`, `Restart = on-failure`,
    `KillMode = mixed` (`dotfiles-nix/modules/ags.nix:50-66`).
  - `hypridle.service` — `Restart = on-failure`
    (`dotfiles-nix/modules/hypridle.nix:9-21`).
  - `genzo-session-lock.service` — on-demand, `Restart = no`,
    deliberately no `WantedBy`
    (`dotfiles-nix/modules/ags-session-lock.nix:25-36`).
- **Idle / lock policy**
  (`dotfiles-nix/assets/home/.config/hypr/hypridle.conf`):
  - `lock_cmd = genzo-lock`
  - `before_sleep_cmd = genzo-lock`
  - `after_sleep_cmd = hyprctl dispatch dpms on`
  - No idle timeouts declared in the raw file (the AGS locker relies on
    logind + this before_sleep).
- **`genzo-lock`** resolves per-host: on GEN-DPC it starts
  `genzo-session-lock.service` (AGS locker,
  `dotfiles-nix/modules/ags-session-lock.nix:16-18`); on GEN-LPC it
  execs Hyprlock directly (`dotfiles-nix/modules/hyprlock.nix:8-11`,
  cross-referenced in `docs/maintenance.md:15-17`).
- **Unlock**: AGS locker uses PAM via
  `security.pam.services.astal-auth`
  (`system-nix/modules/desktop.nix:11-12`); Hyprlock uses the default
  PAM stack. Auth is orchestrated by `common/auth-machine.ts` with
  phases `idle | acquiring | locked | authenticating | unlocking | unlocked | failed` (`auth-machine.ts:16-23`).
- **Lock recovery**: fail-closed on locker crash; manual TTY runbook at
  `dotfiles-nix/docs/maintenance.md:19-50`
  (`hyprctl keyword misc:allow_session_lock_restore true` then restart
  the service).
- **Suspend / hibernate / power keys**
  (`system-nix/modules/hibernation.nix:34-46`):
  - `HandleLidSwitch = "suspend-then-hibernate"`
  - `HandlePowerKey = "hibernate"`
  - `HandlePowerKeyLongPress = "poweroff"`
  - `HibernateDelaySec = "5min"`
  - `mem_sleep_default = deep`
  - `services.power-profiles-daemon.enable = true`

  Applied to **both** hosts via `system-nix/modules/default.nix:4`.
- **Power verbs surfaced**:
  - Auth screen (both greeter and lock): only **Hibernate** and **Power
    off** (`dotfiles-nix/assets/home/.config/ags/common/power.ts:11-14`),
    bound to F11/F12 (`Screen.tsx:63-66`). Greeter is polkit-authorised
    for these two actions only (`greeter.nix:105-113`).
  - Waybar power menu
    (`dotfiles-nix/assets/home/.config/waybar/scripts/power-menu.sh:17-46`):
    fzf list of Lock / Shutdown / Reboot / Logout / Hibernate / Suspend.
- **Shutdown**: no repo-level hook; whatever greetd/logind do.

### 1.7 Laptop-first implications

- **Battery indicator**:
  - Auth screen rail conditionally adds a `battery` row only when
    `/sys/class/power_supply` has one — `hasBattery = battery() !== null`
    (`Screen.tsx:57-58,136`), read from `common/sysinfo.ts:50-65`.
    GEN-DPC returns `null`; GEN-LPC returns real values.
  - **Waybar has no battery module** in `modules.jsonc` — the comment at
    `modules.jsonc:6` records battery as "dead code, #10". CSS classes
    for `#battery.warning|critical|charging` still exist unreferenced
    (`styles/states.css:25-36`).
  - **AGS bar has no battery** — `bar/Bar.tsx` renders only workspaces.
- **Lid-cycle handling**: nothing beyond the logind default above.
  **No compositor-level or AGS-level lid hook** exists. No hyprctl
  dispatch is registered for lid-close beyond what `before_sleep_cmd` in
  hypridle does when logind fires suspend.
- **Backlight**:
  - Waybar `backlight` module in `modules.jsonc:149-167` (scroll to
    adjust via `brightnessctl` in `scripts/backlight.sh`).
  - Wired only in the **GEN-LPC waybar top bar** (`bars/top.jsonc:23`).
    AGS bar exposes no backlight surface.
  - No keyboard binding for brightness in
    `dotfiles-nix/assets/home/.config/hypr/binds.conf` — the
    `XF86MonBrightness*` keys are not bound; adjustment is
    scroll-on-widget only.
- **Poll costs** (relevant to a laptop running the AGS bar or the auth
  screen on battery):
  - Auth screen (`Screen.tsx:46-57`): time every **1 s**; date, uptime,
    battery every 60 s.
  - Waybar (`modules.jsonc`): clock every **1 s**; cpu every 10 s;
    memory every 10 s; network every 10 s. Also `on-scroll` handlers
    that spawn subprocesses.
  - AGS bar today: no timers, only Hyprland signal subscriptions
    (`bar/Bar.tsx:11-19`).
- **NVIDIA-specific assumptions**: `env.conf` slice on GEN-DPC forces
  `LIBVA_DRIVER_NAME=nvidia`, `NVD_BACKEND=direct`,
  `cursor.no_hardware_cursors = true`
  (`dotfiles-nix/hosts/GEN-DPC/hyprland-outputs.nix:70-78`) — none of
  this exists on GEN-LPC's slice.
- **Firefox PiP window rule**
  (`dotfiles-nix/assets/home/.config/hypr/rules.conf:11-14`): shared
  across hosts, hard-coded `move 1462 0` with `size 426 240`. Assumes
  primary width around 1920 (GEN-DPC's Viewteck). GEN-LPC's `eDP-1` at
  2560×1440 scale 1.5 (logical 1707×960) lands PiP off-position.
- **Touchpad**: GEN-LPC's Synaptics is disabled at compositor level —
  the laptop is intentionally keyboard-only for pointing.
- **Media output**: `dotfiles-nix/CONTEXT.md:160-163` defines the
  concept — on GEN-DPC it is the I-O Data display; GEN-LPC designates
  none. No code currently reads or acts on that designation.
- **`hardware.overcommit`**: `vm.overcommit_memory = 0` set only on
  GEN-DPC (`system-nix/hosts/GEN-DPC/hardware.nix:37-41`, ADR-0003) —
  heuristic overcommit was needed for desktop workloads; the laptop
  runs strict defaults, per ADR.

**Absences worth naming explicitly:**

- No lid-cycle handler in Hyprland or AGS beyond `logind`.
- No hotplug hook for monitors — `monitors.conf` is static per host.
- No idle-timeout entries in `hypridle.conf`.
- No network-quality / NAT64 indicator in any surface.
- No AGS bar content beyond workspaces on GEN-DPC.
- No battery module in either bar today.

---

## 2. Content

What exists in master post-`#30`. The reforming pass audits every
surface, ADR, and module below against the IA the map settles on.

### 2.1 AGS surfaces currently defined

The session shell and the two authentication surfaces share a single
tree under `dotfiles-nix/assets/home/.config/ags/`. Only the shell tree
is run live (out-of-store symlink via `modules/assets.nix:1`); the
greeter and lock are built into store-path executables
(`packages/greeter.nix`, `packages/session-lock.nix`).

- **Bar (workspaces only)** — `assets/…/ags/bar/Bar.tsx:40`. Purpose:
  "the pathfinder bar: numbered Hyprland workspaces, and deliberately
  nothing else. It grows in place as later surface tickets settle the
  final bar" (`Bar.tsx:1-2`). Trigger/lifecycle: persistent, always-visible
  layer surface with `Astal.Exclusivity.EXCLUSIVE`, anchored
  `TOP | LEFT | RIGHT` (`Bar.tsx:47-58`). Monitors: one instance per GDK
  monitor via `<For each={createBinding(app, "monitors")}>` in
  `app.tsx:18-25`.
- **Shell entry point** — `assets/…/ags/app.tsx:13-27`. One AGS v3
  process, `gtkTheme: "Adwaita"`, css `${SRC}/style.css`. Runs under
  systemd user unit `ags.service` (`modules/ags.nix:50-66`) which execs
  `ags run` (no `-d`), so `$XDG_CONFIG_HOME/ags` is the search root.
- **Auth screen (shared surface)** — `components/screen/Screen.tsx:45-221`.
  Purpose: "The auth screen shared by the greeter and the session lock.
  What is on screen — a clock, a status rail, two power verbs, and eight
  password dots — is the same in both contexts" (`Screen.tsx:1-5`).
  Layout: centred clock+date+dot row+password entry (`Screen.tsx:109-122`),
  bottom-left status rail (`Screen.tsx:126-156`), bottom-right verbs
  (`Screen.tsx:163-199`), 200 px top/bottom band (`Screen.tsx:28`,
  `Screen.tsx:207-218`). Rail: host, NixOS version, kernel, generation,
  uptime, battery-when-present (`Screen.tsx:126-136`, sourced from
  `common/sysinfo.ts`). Verbs: Hibernate (F11) and Power off (F12) via
  `common/power.ts:11-14` and `Screen.tsx:63-66`.
- **Greeter (login screen)** — `greeter/main.tsx:21-59`. Purpose: greetd
  greeter, ADR-0008 issue #38. Trigger/lifecycle: launched by greetd at
  seat handover, single overlay window with `Astal.Layer.OVERLAY`,
  exclusivity `IGNORE`, keymode `EXCLUSIVE`, anchored to all four edges
  (`main.tsx:36-50`). Monitors: primary output only, chosen by geometry
  in `common/monitors.ts:30-43`; secondary heads stay dark. Files:
  `greeter/main.tsx`, `greeter/controller.ts` (greetd PAM state machine,
  `controller.ts:20-145`), `greeter/session.ts` (greetd protocol
  conversation, `session.ts:38-144`), shared `components/screen/*`,
  packaged by `packages/greeter.nix:32-109`.
- **Session lock** — `lock/main.tsx:104-138`. Purpose: "the production,
  on-demand AGS session-lock executable... process death is fail-closed"
  (`packages/session-lock.nix:1-4`). Trigger/lifecycle: `genzo-lock`
  shell wrapper starts on-demand user service
  `genzo-session-lock.service` (`modules/ags-session-lock.nix:16-36`),
  which execs the packaged bundle; the compositor's `ext-session-lock-v1`
  protocol holds the surface (`lock/main.tsx:12`, `lock/run.sh:6`).
  Monitors: one lock window per output via `Gtk4SessionLock`
  (`lock/main.tsx:48-81`); primary carries the interactive password
  entry, secondaries render an opaque cover (`lock/main.tsx:23-36`).
  Files: `lock/main.tsx`, `lock/controller.ts` (PAM via `AstalAuth`,
  `controller.ts:30-163`), `lock/run.sh`, `lock/style.css`, shared
  `components/screen/*`. `hypridle` triggers this at idle and pre-sleep
  (`hypridle.conf:4-5`).
- **Auth state machine** — `common/auth-machine.ts:15-82`. Shared
  vocabulary: phases
  `idle | acquiring | locked | authenticating | unlocking | unlocked | failed`;
  controller shape in `common/controller.ts:10-28`.
- **Legacy lock (hyprlock)** — still wired on GEN-LPC via
  `modules/hyprlock.nix:1-17` and `assets/…/hypr/hyprlock.conf`. Same
  `genzo-lock` command name, different implementation.
- **Legacy notifications (mako)** — `modules/mako.nix:1-59`. Both hosts
  import it (GEN-DPC:12, GEN-LPC:14). Layer overlay, per-urgency Geist
  colours, 300x110, sort by time.
- **Legacy bar (waybar)** — `modules/waybar.nix:1-58`. GEN-LPC only
  (`hosts/GEN-LPC/default.nix:15`); three bar bodies under
  `assets/…/waybar/bars/` (top, bottom, etc — see §2.7).

**Surfaces named in `#97` that do not exist in master today**:

- **launcher** (nothing under AGS; `dmenu_run` is bound in Hyprland —
  see §2.5)
- **OSD** (no volume/brightness surface — WirePlumber volume is `pactl`
  bound to keys with no visual)
- **action hub / control center** (no such AGS component)

Comments in `modules/ags.nix:7-9` and ADR-0008 name these three
explicitly as planned but not yet implemented.

### 2.2 `geistdesign` package (from `#58`)

Location: `packages/geistdesign.nix:8-102`. Emits a two-file output from
`constants/`:

- **`geistdesign.css`** — GTK stylesheet consumed via CSS `@import`
  (session `assets/…/ags/style.css:3`; greeter and lock rewrite the
  import at build to `file://${geistdesign}/geistdesign.css` in
  `packages/greeter.nix:80-81` and `packages/session-lock.nix:69-70`).
  Contents (`packages/geistdesign.nix:68-85`):
  - `:root` custom properties: `--ds-debug`, `--ds-black`, `--ds-white`,
    `--ds-contrast-fg`, plus `--ds-radius-*` (from `constants/radius.nix`)
    and `--ds-motion-*` (from `constants/motion.nix`).
  - Dark theme applied to `:root` and `.light .invert-theme`; light theme
    applied to `.light, .invert-theme`. Each theme block emits
    `--ds-background-*`, `--ds-<color>-<step>` (whole palette ramp),
    `--ds-<role>-<variant>-<color>` (component background, border,
    high-contrast, text — see `constants/theme.nix:19-53`),
    `--ds-shadow-*`, `--ds-focus-*`.
  - Utility classes generated from `constants/type.nix`:
    `.text-heading-{14,16,20,24,32,40,48,56,64,72}`,
    `.text-copy-{13,13-mono,14,14-mono,16,18,20,24}`,
    `.text-label-{12,12-mono,13,13-mono,14,14-mono,16,18,20}`,
    `.text-button-{12,14,16}`.
- **`index.ts`** — TypeScript module consumed by widget properties GTK
  cannot receive from CSS. Contents (`packages/geistdesign.nix:87-96`):
  - `space` — full `constants/space.nix` attrset serialised as-is (base
    scale, gap, form, popover, controlHeight, negatives).
  - `motion` — only `overlay.duration` and `popover.duration` (used by
    GTK `Revealer`/`Stack` transition-duration).

Consumers today: the workspaces bar imports `space` for its `spacing`
(`bar/Bar.tsx:9`, `Bar.tsx:22`). No component yet imports from `motion`.
Home-manager wires the store path to `~/.local/share/geistdesign`
(`modules/ags.nix:48`) for the live session; greeter/lock inline the
store path at bundle time.

### 2.3 ADRs (0001-0008)

None of the ADRs carry an explicit `Status:` field; every file is present
in master with no `-superseded-by-` or archive marker, so each is treated
as **Accepted** unless the body says otherwise. Shell/UI/IA relevance
flagged in brackets.

- **0001 Disable flatpak management** — `programs.flatpakManagement`
  stays commented out in favour of a lighter update mechanism; block
  preserved deliberately. *Not shell/UI.*
- **0002 Structure parity with system-nix** — mirrors modules/, hosts/,
  docs/ layout with system-nix; lists dotfiles-nix-only deviations
  (`assets/`, `constants/`, `modules/sway/` — sway historical, now
  Hyprland). *Meta.*
- **0003 Standalone profiles with nixGL** — every GUI package must go
  through `config.lib.nixGL.wrap`; two standalone profiles
  (`genzo-graphical`, `genzo-terminal`) kept as insurance. **Touches
  shell**: every shell binary the reforming pass ships (AGS, session-lock,
  hyprland, waybar, mako) is wrapped this way.
- **0004 Lean ambient layer, toolchains in devshell catalog** — no
  compilers in `home.packages`; toolchains under `devshells/`; "default
  development environment" prepends to PATH. *Not shell/UI.*
- **0005 Assets by default, Nix only for computed slices** — raw files
  under `assets/` are the default; Nix earns a config only for computed
  slices joined through the app's own include mechanism. **Touches
  shell** (defining rule for how every UI file in this repo is edited;
  drives the split between `assets/home/.config/hypr/*.conf` and
  `xdg.configFile."generated/hypr/*.conf".text`, and the ags asset
  symlink).
- **0006 Geist as the OS design system** — all OS theming follows Vercel
  Geist; catppuccin explicitly rejected; prebuilt third-party themes
  never adopted wholesale. **Touches UI** (design system that surfaces
  are audited against).
- **0007 Hyprland as the compositor** — Hyprland replaces sway; bundled
  into the "Era change" milestone with ADRs 0005 and 0006; special
  workspaces, pinning, HyprMon named as primitives. **Touches shell**
  (the compositor).
- **0008 AGS v3 as the desktop shell** — one AGS v3 project owns bar,
  notifications, launcher, OSD, action hub, greeter; incumbents (waybar,
  mako, dmenu bind, sysc-greet) rejected; upstream `github:aylur/ags`
  flake rather than nixpkgs; every dependency is a first-party Astal
  service. **Touches shell/IA** (the surface-inventory rule the reforming
  pass audits).

**Reforming pass audits: 0005, 0006, 0007, 0008.**

### 2.4 Modules relevant to the shell

Shell-adjacent (imported by `modules/default.nix`, `modules/apps.nix`,
or one of the hosts):

- `modules/hyprland.nix:1-41` — Hyprland package (nixGL-wrapped) +
  generated `theme.conf` (border/lock colours, slurp screenshot colours)
  + empty defaults for `monitors.conf`/`env.conf` that hosts override.
- `modules/hypridle.nix:1-22` — `hypridle` binary + user service; policy
  body in `assets/…/hypr/hypridle.conf` (`lock_cmd = genzo-lock`,
  `before_sleep_cmd = genzo-lock`,
  `after_sleep_cmd = hyprctl dispatch dpms on`).
- `modules/hyprlock.nix:1-17` — legacy locker; provides the `genzo-lock`
  shellscript for hosts on the pre-AGS locker (GEN-LPC).
- `modules/ags.nix:1-67` — AGS v3 shell package + `ags.service` user
  unit + wires framework types (`~/.local/share/ags`) and geistdesign
  (`~/.local/share/geistdesign`) into `home.file`.
- `modules/ags-session-lock.nix:1-37` — production locker: `genzo-lock`
  script that `systemctl --user start genzo-session-lock.service`; unit
  `Restart = no` (fail-closed).
- `modules/mako.nix:1-59` — mako notification daemon with per-urgency
  Geist colours.
- `modules/waybar.nix:1-58` — waybar package + service; entry config
  generated, bodies raw (host-varying because waybar's include cannot
  add array elements).
- `modules/theme.nix:1-95` — fonts (Inter, Noto, JetBrainsMono Nerd Font,
  ricty, font-awesome), Qt/Kvantum tooling, XDG portals,
  cursor/Electron/Java/SDL env, XDG user dirs. Imports `gtk.nix`,
  `qt.nix`.
- `modules/gtk.nix:1-72` — GTK 2/3/4 config: Marwaita-Teal theme,
  Papirus-Dark icons, Adwaita cursors, `dconf`
  `color-scheme = prefer-dark`, `GDK_BACKEND = wayland,x11`.
- `modules/qt.nix:1-20` — Qt platformTheme `gtk3`;
  `QT_QPA_PLATFORM = "wayland;xcb"`.
- `modules/fcitx5.nix:1-34` — input method with Mozc, wayland frontend,
  `Mod+space` trigger.
- `modules/assets.nix:1-16` — symlinks every `assets/home/.config/*`
  out-of-store into `~/.config` (the mechanism ADR-0005 rests on).
- `modules/kitty.nix:1-47` — terminal emulator + colours from
  `constants/terminal.nix`. (Shell-adjacent because it is spawned from
  the Hyprland launcher/yazi keybinds.)
- `modules/keepassxc.nix:1-34` — GUI app, autostart candidate (currently
  disabled service).
- `modules/firefox.nix:1-40+` — GUI app with `userChrome` from
  `assets/home/.mozilla/firefox/minimal.default/chrome/userChrome.css`.
- `modules/apps.nix:1-26` — aggregator for `terminal`, `firefox`,
  `keepassxc`, `kitty`, `fcitx5`, `theme`, `obsidian` + packages.
- `modules/default.nix:1-27` — desktop aggregator: `apps`, `hyprland`,
  `hypridle`; also sets `xdg.autostart.enable = true` and
  `xdg.userDirs.setSessionVariables = true`.

Skipped (present under `modules/` but not shell/UI): `bash.nix`,
`direnv.nix`, `git.nix`, `neovim.nix`, `yazi.nix`, `terminal.nix`,
`default-env.nix`, `obsidian.nix`, `flatpak.nix` (unused; option-only),
`packages/base-linux.nix`, `packages/cli-tools.nix`,
`packages/etc.nix`, `packages/nvidia.nix`,
`packages/user-applications.nix`.

### 2.5 Hosts

- `hosts/GEN-DPC/default.nix:1-14` — imports its `hyprland-outputs.nix`
  + `modules/ags.nix` + `modules/ags-session-lock.nix` +
  `modules/mako.nix`. Comment: waybar already replaced by the AGS bar
  here; mako stays "until the AGS notification surface replaces it".
  Three-monitor NVIDIA workstation
  (`hosts/GEN-DPC/hyprland-outputs.nix:24-78`) as tabled in §1.2.
  Workspaces 8→Cintiq, 9→I-O Data (defaults pinned). Pen + touch mapped
  to the Cintiq. Nvidia env vars: `LIBVA_DRIVER_NAME`,
  `__GLX_VENDOR_LIBRARY_NAME`, `NVD_BACKEND`,
  `cursor.no_hardware_cursors = true`.
- `hosts/GEN-LPC/default.nix:1-17` — imports its `hyprland-outputs.nix`
  + `waybar.nix` + `modules/ags.nix` (renders nothing yet) +
  `modules/hyprlock.nix` (legacy lock still) + `modules/mako.nix` +
  `modules/waybar.nix`. Single-display laptop
  (`hosts/GEN-LPC/hyprland-outputs.nix:6-20`) as tabled in §1.2.
  Synaptics touchpad disabled. `hosts/GEN-LPC/waybar.nix:1-21` wires two
  bars (top + bottom, both `bars/top.jsonc`/`bars/bottom.jsonc` +
  `modules.jsonc`) pinned to `eDP-1`. Per memory, GEN-LPC is not
  currently running NixOS.

### 2.6 Existing keybinds (Hyprland)

Source: `assets/home/.config/hypr/binds.conf:1-79`. `$mod = ALT`,
`$win = SUPER`.

- **Applications & session**
  - `$mod + R` → `exec, ranger`
  - `$mod + F4` → `killactive`
  - `$mod + F3` → `exec, dmenu_run -m 0` (launcher)
  - `$mod + SHIFT + E` → `exec, uwsm stop` (log out)
  - `$mod + SHIFT + R` → `exec, hyprctl reload`
  - `$win + F` → `togglefloating`
  - `$win + T` → `exec, kitty -e bash -lc yazi`
  - `$win + B` → `exec, $BROWSER`
  - `$win + SPACE` → `exec, fcitx5-remote -t` (IME toggle)
- **Screenshots**
  - `CTRL + SHIFT + 2` → region grab via `grim | wl-copy` with slurp
  - `CTRL + SHIFT + 4` → full-selection grab via same pipeline
- **Audio (XF86 keys, no on-screen feedback)**
  - `XF86AudioRaiseVolume` →
    `pactl set-sink-volume @DEFAULT_SINK@ +5%`
  - `XF86AudioLowerVolume` →
    `pactl set-sink-volume @DEFAULT_SINK@ -5%`
  - `XF86AudioMute` → `pactl set-sink-mute @DEFAULT_SINK@ toggle`
- **Workspace focus** — `$mod + 1…9` → `workspace, N`
- **Move window to workspace (stay focus)** —
  `$win + 1…9` → `movetoworkspacesilent, N`
- **Window focus (vim)** — `$mod + H/J/K/L` → `movefocus l/d/u/r`
- **Window move (vim)** —
  `$mod + SHIFT + H/J/K/L` → `movewindow l/d/u/r`
- **Move workspace to output** —
  `$win + H/J/K/L` → `movecurrentworkspacetomonitor l/d/u/r`
- **Resize (1 px)** —
  `$win + UP/DOWN/RIGHT/LEFT` → `resizeactive 0 1 / 0 -1 / 1 0 / -1 0`
- **Split preselect (dwindle)** — `$win + PLUS` → preselect right;
  `$win + MINUS` → preselect down
- **Mouse floating** — `$win + mouse:272` → `movewindow`;
  `$win + mouse:273` → `resizewindow`

**Conflicts / notes**: `$win + H/J/K/L` (move workspace to output)
collides in intent with `$mod + H/J/K/L` (focus) and
`$mod + SHIFT + H/J/K/L` (move window) — different modifiers, but users
must reason about three overlapping vim-direction bindings.
`$win + 1…9` and `$mod + 1…9` are the sway-style "move" / "focus" pair
with no collision. Global two greeter/lock shortcuts `F11` (Hibernate)
and `F12` (Power off) live inside the auth surface
(`Screen.tsx:63-66`), not in Hyprland. Session-lock trigger has no
keybind — it is idle-driven (`hypridle.conf`); there is no `Super+L`
bind.

Compositor-level also: idle policy in `hypridle.conf` (calls `genzo-lock`
at idle and pre-suspend); window rules in
`assets/…/hypr/rules.conf:1-14` (float nm-connection-editor, blueman,
pavucontrol, Thunar rename dialog; Firefox PiP pinned top-right at
426x240).

### 2.7 App configuration under `assets/`

`assets/home/` layout (asset symlinks come from `modules/assets.nix`):

- **`.bashrc`** — bash rc, appended in `modules/bash.nix:5`.
- **`.config/hypr/`** — `hyprland.conf`, `binds.conf`, `rules.conf`,
  `hypridle.conf`, `hyprlock.conf`. Live-editable body of the
  compositor and its idle/lock policy. **Shapes chrome** (border colours
  through `theme.conf` slice, gaps, dwindle layout).
- **`.config/ags/`** — session shell + shared screen + greeter + lock
  trees (see §2.1). `style.css` at the root is the session's own
  stylesheet (currently only bar rules). **Shapes chrome,
  notifications-future, theming** (imports geistdesign via CSS `@import`).
- **`.config/waybar/`** — `bars/{top,bottom,etc}.jsonc` (three bar
  bodies), `modules.jsonc` (module definitions), `style.css` +
  `theme.css` + `styles/*.css` (fonts, dividers, left/right/center
  modules, states, global), `scripts/*.sh` (bluetooth, power-menu,
  volume, network[toggle], bluetoothtoggle, fzf-colors, backlight,
  qrscan), `themes/fzf/catppuccin.txt` (legacy catppuccin remnant —
  ADR-0006 notes these are "slated for deletion"). **Shapes chrome,
  notifications (implicit via scripts), theming**.
- **`.config/terminator/config`** — terminator terminal config (legacy;
  kitty is the primary today).
- **`.config/nix/`** — `nix.conf`, `registry.json` (registers the
  `dotfiles` flake alias used by `.envrc` files; see
  `modules/direnv.nix:3-6`).
- **`.config/nixpkgs/config.nix`** — nixpkgs settings.
- **`.config/lazygit/config.yml`** — lazygit UI settings.
- **`.config/ranger/`** — `rc.conf`, `commands.py`, `scope.sh`,
  `devicons.py`, `plugins/`. TUI file manager.
- **`.config/nvim/lua/`** — neovim lua config tree.
- **`.config/mimeapps.list`** — MIME defaults.
- **`.mozilla/firefox/minimal.default/`** — Firefox profile assets;
  `chrome/userChrome.css` inlined by `modules/firefox.nix:26`.
  **Shapes chrome** (browser).

---

## 3. Users

Deeper than the mind dump (2026-08-04, in `#95` body). This section
records the user profile, the ADHD-I and anxiety axes the IA must design
around, the flow inventory, and every design axis / surface home
decision that came out of the multi-turn grilling. It is descriptive of
the user — including their design preferences — not prescriptive of a
solution.

### 3.1 Method

- Conducted via `/grilling` + `/domain-modeling` over ~30 conversational
  turns, 2026-08-05 — 2026-08-06.
- Structured breadth-first (flow enumeration) → depth-first (ADHD-I and
  anxiety axes) → integration (surface homes and design principles).
- Every axis and home decision recorded here was explicitly named by the
  user and confirmed against a recommendation.
- Where the user's own wording is stronger or more precise than
  paraphrase, it is quoted verbatim.

### 3.2 The user, in broad strokes

Established from the map's original mind dump (2026-08-04) and expanded
during grilling.

- **One continuous session** (wake to sleep, many hours), no discrete
  modes.
- **Boot → terminal + browser co-launched immediately** *(often, not
  always — corrected during grilling)*.
- High multimedia concurrency: up to 4 PIP'd livestreams + chat + coding
  (`nvim` + `claude` / `codex`) + comms + music.
- Multi-monitor with a **"satellite"** (YouTube-first, promoted to main
  when a stream earns it) on desktop only.
- Cintiq Pro on desktop (touch + buttons) — repurposed by this pass from
  a drawing surface to a **permanent ambient dashboard** (see
  §3.10).
- Communication: Discord (personal), Outlook (mail + calendar). Media:
  video, mpd, images. Games: Steam.
- Primary Hyprland layout target: migrating to **Monocle + `alt-tab` /
  `alt-shift-tab` cycling** from current dwindle. Flagged for the
  reforming pass; not designed here.
- Windows-only workflows still requiring dual-boot: **Reason 10**
  (audio production; wine insufficient), **Clip Studio Paint** (digital
  art; Krita a partial substitute). Both are real recurring flows, not
  aspirations.
- Aspirational: a **personal sqlite life-database** as the long-term
  home for every captured artifact (habit events, journal entries,
  todos, notes, yeet-thoughts, flashcards, capture history).

### 3.3 ADHD-I profile

The IA designs around these patterns. Each was posed as a candidate and
confirmed / declined by the user.

- **Initiation paralysis (start-friction) — confirmed strongly.** Once
  seated, flow is sustained. The existing coding-session pattern
  (boot → co-launch → seated) is an unconscious workaround; other flows
  deserve similar seat-taking mechanisms.
- **Time blindness — confirmed with detail.** Hyperfocus consumes ~6
  hours unnoticed. Hyperfocus territories: **coding, singing/recording**
  (both named). User has partial workaround via hyperawareness.
- **Task-switching cost — confirmed.** Works on one thing at a time.
  The 4-parallel Claude sessions read *mentally* as one session, not
  multitasking. Matches the ~65-cell slim-terminal preference.
- **Working-memory pressure — confirmed as major problem.** Mental
  notes evaporate the moment attention shifts. Mental resources are
  consumed maintaining retention until the note is logged, which
  prevents the current task. Structural, not preferential.
- **Hyperfocus — confirmed (via time-blindness).** Not just a symptom —
  a *resource*. Coding and singing/recording are its territories.
- **Rejection-sensitivity / shame aversion — confirmed subconsciously.**
  Not surface-level acute, but active enough that streak-loss counters
  and red-day rendering are net-negative.
- **Novelty-seeking / boredom aversion — parked.** User could not
  self-answer; not designed around explicitly.
- **Executive-function fatigue — confirmed strongly.** *"One at a time.
  As simple as possible. Measurable progress."* Directly opposes
  put-everything-on-the-bar; validates the framework's Nothing default.
- **Object permanence for tasks — confirmed with the desk analogy.**
  User's real desk-top: bills in front until resolved. Hates clutter,
  clears it as soon as mental capacity allows (limited supply). The
  "desk-clutter" design pattern for habits (see §3.5) is a direct
  translation.
- **Sensory sensitivity — partial.** Bolts gaze at fast-moving
  peripherals (rules out toast animations at edges). Background YouTube
  is a chosen exception, not a contradiction — user-summoned is fine;
  system-initiated motion is not.

Additional axis surfaced during grilling:

- **Task-inertia over urgent-pivot.** Once seated in a problem,
  resistance to leaving grows even when incoming task's cost-of-delay is
  objectively higher. Example: interview prep margin gets eaten by "one
  more fix". Self-trust fails under hyperfocus; the IA needs a channel
  that penetrates without being tuned out. Design answer: per-event
  hyperfocus-penetration opt-in (see §3.6, flow #77).

### 3.4 Anxiety axes

Anxiety is a first-class design axis alongside the framework's
response-required rule. The user surfaces it as *"is there something I
should prioritize now?"* pressure that drives repeat-checking, avoidance,
and hyperfocus retention.

- **A. Uncertainty anxiety** — *am I missing something?* Remedy:
  legible presence. Anxiety-relief surfaces must be *visible even when
  nothing needs attention*, so the state of nothing-to-do is confirmable,
  not inferrable. User's phrasing: *"stay on screen as small overlay so
  I know it's dormant, not bugged."*
- **B. Missed-thing / memory anxiety** — merged into A during grilling.
  *"Did I forget X?"* is served by capture-everything-forever + trust
  the store, not the memory.
- **C. Confirmation anxiety** — needing to re-check the same fact
  repeatedly (phone calendar many times a day when bad). Remedy:
  easy re-summon + visible confirmation; checking must be zero-cost, no
  shame for repeating.
- **D. Task-completion anxiety** — *did I actually finish that
  correctly?* Remedy: artifacts are visible; the thing you did leaves a
  findable trace in the sqlite life-database.
- **E. Interruption anxiety** — *the moment I look away, everything
  piles up.* Remedy: quiet accretion + on-demand review; nothing during
  away-time, everything present-and-manageable on return.
- **F. Procedural anxiety** — *I don't want to do X because I don't
  know how to do X.* Confirmed with concrete example: US phone calls
  fine; Japanese phone calls / emails avoided because cadence and
  vocabulary unfamiliar. Causes avoidance, not just discomfort. Current
  workaround: ad-hoc web-based LLM chat. **Design answer is aspirational
  and currently blocked** by offline-first + local-model quality
  constraints (see §3.5 and §3.11).
- **G. Loss anxiety** — *did the system lose my work / is it bugged?*
  Remedy: artifacts have durable, findable homes; system health-check
  is legible (dormant, not bugged) — same primitive as A.

Anxiety-relief pattern from the user's own life: *pull-when-anxious →
push-gently → glance-recognize-dismiss, and the dismiss is
confidence-building, not friction.* The phone calendar embodies this.
Any anxiety-relief surface on the shell must preserve this shape — not
degrade the dismiss into an obligation.

### 3.5 Design axes pinned during the grilling

These are user commitments made during the session, not open design
questions. Each is load-bearing on downstream tickets.

1. **Two orthogonal lenses, applied in this order:**
   1. **Response-required** (Saleh / EEMUA) governs **shell surfaces** —
      chrome, notifications, ambient, interruption. *Subtractive.*
   2. **Low-friction / low-shame** governs **content flows** — habits,
      journal, drills, quick note. *Additive to reachability;
      subtractive to guilt-instrumentation.*
   User's own phrasing of (2): *"reduce friction for correct behavior
   rather than forced rules to enforce correct behavior."*

2. **Silent measurement / sqlite life-database.** Capture every artifact
   + event. Surface **nothing accountability-shaped** to the user. No
   streaks, no red, no counts on screen. User-initiated retrieval only.
   Sqlite as long-term store.

3. **Invitation without enforcement (Design 2+3 hybrid, confirmed).**
   Zero-measurement surfaces + ambient presence. The presence of a
   surface is a *summoning affordance*, not an accountability signal.
   No completion checkbox anywhere; Goodhart's law dissolves because
   the question isn't asked.

4. **Real-world equivalents preferred.** When a real-world object
   models the interaction (kitchen twist-timer for timer,
   desk-with-bills for object permanence, iPad Action Center pull-drawer
   for cross-host action panel), prefer that model. Not skeuomorphism
   as decoration — skeuomorphism as *interaction metaphor*.

5. **Single source of truth per signal.** Never render the same
   underlying state in two surfaces. Drift → confusion. Explicitly
   applied to safety-class icons (primary only), ambient countdown
   (primary overlay only), calendar peek (drawer only).

6. **Desk-clutter reinforcement (habits).** Habits show up as visible
   undone-things that clear when done. Presence is the reminder; absence
   is the reward. Analog: code smells — functional, sub-optimal, doesn't
   nag, only we can fix it. Also silent-measured. Physical and digital
   habits both belong on the surface (dishes, laundry, cleaning next to
   journal, kanji, flashcards) — the computer is the one place the user
   consistently comes back to, so the IA anchors real-life habits too.

7. **Legible presence (dormant vs bugged).** Anxiety-relief surfaces
   must show *"nothing to worry about right now"* as an active,
   confirmable state — not an absence. Any surface that could be dormant
   *or* broken must make the distinction legible.

8. **Task-inertia handling (per-event opt-in, not per-channel).** The
   IA does not attempt to interrupt hyperfocus by default. When the
   user knows a specific obligation is at risk (interview, hard
   deadline), they *pre-authorize* the shell to escalate for that one.
   Rare by design; power comes from rarity. See flow #77.

9. **Procedural anxiety scaffolding (unsolved gap).** The IA should
   help reduce F-axis anxiety by providing scaffolding for unfamiliar
   procedures. Playbooks (rigid) rejected as insufficient — real
   flexibility requires an LLM. Currently blocked by offline-first +
   local-model quality. Recorded here as a **real gap**, not solved.

10. **Laptop-first with Cintiq as bonus.** Every Cintiq surface must
    have a laptop-friendly equivalent. Laptop is the constrained,
    load-bearing platform; Cintiq is bonus real-estate on GEN-DPC only.

11. **Mental-model preservation across hosts.** The universal
    **drawer** (see §3.10) exists on both hosts in identical shape so
    muscle memory transfers when switching between GEN-DPC and GEN-LPC.

12. **Offline-first for load-bearing flows.** Day-guide core (schedule,
    todos, countdown, capture) runs entirely offline. LLM is optional
    enrichment where it earns its keep (yeet-thoughts categorization,
    procedural coaching) and degrades gracefully when absent.

13. **No auto-switch on device change (audio).** Bluetooth speakers
    connecting should *not* silently become the default sink. Explicit
    user selection only, via a legible quick-switch UI.

14. **Outlook as canonical for calendar + todos.** Both desktop and
    iPhone are equal clients. Sqlite stores everything Outlook can't
    hold (habits, journal, capture history). Migrate only if Outlook
    disappears or becomes ethically infeasible.

15. **No discrete modes.** The IA does not gate behavior by mode
    (focus / meeting / gaming / etc). One continuous session; sender-
    driven interruption discipline instead of mode-gating. This is
    the aspirational-modes question, resolved.

### 3.6 Flow inventory

~85 first-class flows named during grilling, grouped by pattern. Each
carries a compact shape tag. Numbering is stable so downstream tickets
can reference specific flows.

**All-day focus arcs** (occupy primary indefinitely; hyperfocus-eligible)

1. **Coding session start** — terminal-heavy, browser co-launch
   (often); primary; Monocle-planned. *Long-focus · Nothing.*
2. **Mid-session context switch** — mental re-seat; expensive.
3. **Session end** — voluntary wind-down.
4. **Gaming session start** — Steam full-screen. *Long-focus.*
5. **Meeting / call arc** — app chrome; auto-muzzle safety class fires.
6. **Reading long-form** — PDF, Obsidian, textbook (folds book study).
7. **Pure consumption** (watching a stream, not promoted) — player
   full-screen.
8. **Singing / vocal recording** — DAW-like; **hyperfocus territory**.
9. **Image edit (Krita)** — full-screen desktop app.
10. **Video edit (DaVinci Resolve)** — full-screen desktop app.
11. **Internet browsing / researching** — browser-centric,
    information-gathering.
12. **Drills** (practice / exercise, ≠ flashcards) — full-screen
    keyboard-driven.

**Session-boundary events** (system-driven or user-driven state
transitions)

13. **Boot → co-launch** *(often, not always)*.
14. **Unlock-after-lock** — auth → resume.
15. **Return-from-long-AFK** — auth + orient; distinct from short-cycle
    unlock.
16. **Voluntary lock** — deliberate step-away.
17. **Timer-based sleep** — countdown → suspend (new; user added).
18. **Power-down decision arc** — verb menu.

**Break / social**

19. **Break** (voluntary AFK) — no shell action.
20. **Comms check** — summoned or arc-shaped.
21. **Media promotion** (satellite promotion — YouTube-first head gets
    promoted to primary when a stream earns it).

**Mid-session micro-flows** (summoned overlays on primary)

22. **Launcher / project-opener** — dmenu today; extended to open a
    project directly from `~/repositories`.
23. **Password lookup** (keepassxc summon) — overlay near active field.
24. **IME switch** (fcitx) — inline; `Mod+Space`.
25. **Emoji picker** — flow-level exists independent of fulfillment
    (fcitx handles today). *The flow is user-intent; the daemon is
    implementation.*
26. **Screenshot → clipboard** — region + capture; result to clipboard.
27. **Per-window audio route** — context menu / anchored overlay on
    the target window.
28. **Screen dim** — one action.

**Quick capture** (working-memory-pressure remedy)

29. **Quick note (Outpost)** — user-directed structured capture.
30. **Yeet-thoughts** — unstructured mind-dump; auto-categorised +
    reformed into coherent notes; stored in sqlite.
31. **Journal entry** — invitation-only summoned surface; no
    measurement.
32. **Add flashcard to today's notes** — quick capture path.
33. **Add calendar event** — form summoned; syncs to Outlook.
34. **Create todo** — form summoned; unscheduled by default; syncs to
    Outlook.

**Quick retrieval** (anxiety-relief; pull-only)

35. **Search notes / vault** — fuzzy over text.
36. **"What was I doing"** — search over life-database.
37. **Check today's todos** — via day-guide surface.
38. **Check today's leftover flashcards**.
39. **Anxiety-anchored calendar summon** (= calendar peek in drawer).
40. **Read logs** (journalctl) — terminal, summoned.
41. **Diff nixos generations** — terminal, summoned.

**Habits — desk-clutter tiles** (Cintiq bento; laptop peek in drawer)

Digital habits clear by artifact detection; physical habits clear by
one-tap acknowledgment (put-away gesture, not scorekeeping).

42. **Journal (habit)** — tile clears when a real journal entry exists
    today.
43. **Kanji practice** — clears on drill artifact.
44. **Business Japanese study** — clears on drill/study artifact.
45. **Review notes** — clears when a review session artifact exists.
46. **Perform today's flashcards** — clears when today's queue emptied.
47. **Get up-to-date on news (RSS + X/Twitter)** — clears on catch-up
    action.
48. **Write things into calendar** — clears on daily "did you
    plan?" acknowledgment.
49. **Doing the dishes** — tap-to-put-away.
50. **Doing laundry** — tap-to-put-away.
51. **Clean room daily** — tap-to-put-away.

**Habit creation** is itself a flow (setup for any of #42–#51 or new):

52. **Habit creation / configuration** — one-off setup; tile appears
    on Cintiq bento thereafter.

**Time / calendar** (anti-time-blindness)

53. **Check calendar / next event** — summoned.
54. **Ambient countdown to next event** — small persistent overlay on
    primary content; single-source; still (no ticking); loudness only
    at true threshold. Overlap → visual conflict flag; close-together →
    single next-item focus.
55. **Remind-me-at-X** — fills the phone-friction gap; ping follows the
    glance-recognize-dismiss pattern.
56. **Per-event hyperfocus-penetration opt-in** — per-event flag,
    pre-authorised; fires the reserved edge (Cintiq + desktop speakers,
    off primary focus surface).
57. **Day-guide assistant / "this is next"** — surfaces the current
    planned next thing at natural transitions. Offline-first, GUI-first,
    no LLM required; LLM optional enrichment on desktop only, side
    channel.

**Day-guide surface** (integrates 34/37 with 54/57)

58. **Day-guide surface: stack + peek-timeline** (Q14-f, locked). Stack
    = current next card, decision-fatigue defense (executive-function
    axis). Peek = summoned dense timeline, anxiety-relief
    (uncertainty / confirmation axes). Every task has minimum 5-min
    duration; unscheduled cards appear as a left-to-right visual queue;
    click-drag to assign / resize / quick-increment. Todos + habits
    (when anchored) unify with calendar events into one integrated
    surface. Auto-fill and margin rules explicitly rejected —
    manual-triggered re-flow only if ever added later. Home: primary
    (see §3.10).

**Comms out** (sender-side complement to notification channel)

59. **Compose message** (Discord / Outlook DM) — deliberate outbound.
60. **Initiate call** (voice / video) — outgoing.

*(Voice memo and screen-recording-for-send deferred; not first-class
yet.)*

**Media & consumption**

Split, not lumped:

61. **Audio consumption: mpd playback** — Cintiq controls; audio
    ambient anywhere.
62. **Audio consumption: mini-player → fullscreen party mode** — e.g.
    laptop at a party through Sonos bluetooth speaker.
63. **Video consumption: stream in PIP / satellite** — YouTube-first
    on satellite head.
64. **Video consumption: promoted-to-primary** — see flow #21.

**Library-building**

65. **YouTube → mp3 → mpd** (with album art). Background download +
    notify; automation.

*(Adjacent — bookmark video, save article for later, save image — noted
but not confirmed as first-class this pass.)*

**System controls / environment** (Cintiq bento / drawer)

66. **Hyprland layout switcher on the fly** (per-monitor static buttons)
    — Cintiq-hosted; new flow surfaced during grilling.
67. **Global audio sink switcher** — no auto-switch; explicit selection.
68. **Volume adjustment** — sliders + XF86 keys.
69. **Brightness adjustment**.
70. **Wifi state + immediate retry** — see F1 friction.
71. **Bluetooth pairing / selection** — no auto-takeover.

**Audio-processing flows** (for input, singing/recording territory)

72. **EQ** — DAW-style, full-screen.
73. **Compressor**.
74. **Audio rerouting** (input).
75. **Gate**.
76. **Limiters**.

*Fulfillment currently gapped — no native Linux Reason 10 equivalent.
See §3.11.*

**Network transparency** (privacy / leakage awareness)

77. **Ambient network activity indicator** — tiny live readout,
    Cintiq monitoring cluster.
78. **Summoned network detail** — full panel, on-demand.
79. **Alert on unexpected outbound** — reclassified as *emergency* not
    ambient (fires the reserved edge alongside #56).

**Sysadmin / iteration**

80. **Sysadmin rebuild cycle** (`nixos-rebuild switch`) — terminal arc.
81. **NixOS option discovery / search** — new flow; find the right
    knob without leaving the shell.
82. **Update run** (`nix flake update` + rebuild) — terminal + wait.
83. **Onboard repo** (clone, direnv, first build) — terminal arc.
84. **Cleanup** — file / note archive.
85. **Feedback / iterate on the shell itself** — meta flow (this map
    is an example).
86. **Install a new app** — edit config + rebuild.
87. **Cut a release / push a PR** — `gh` + terminal.
88. **Configure new hardware** — investigate + edit + rebuild.
89. **Backup verification** — status check.
90. **New SSH key / credential**.
91. **Sysadmin GUI aspiration** (nice-to-have) — GUI to monitor /
    enact some sysadmin elements (rebuild status, service state,
    generation list). Not designed here.

**Rare / one-off**

92. **Reproduce dotfiles-nix on Debian** (non-NixOS) — multi-step.
93. **Reproduce this NixOS distribution on another NixOS system** —
    multi-step.

**Cross-boot / cross-device**

94. **Cross-boot to Windows for Reason 10** (audio) — reboot arc.
95. **Cross-boot to Windows for Clip Studio Paint** (art) — reboot arc.
96. **Transfer files** laptop ↔ phone ↔ desktop — multi-device.
97. **Cross-host handoff** GEN-DPC ↔ GEN-LPC — parked pending GEN-LPC
    reinstall.

**Exception / event-driven** (interruptive class)

98. **App crashed / hung** — notification + kill flow.
99. **Compositor / shell died** — TTY recovery runbook
    (`docs/maintenance.md`).
100. **Network down / degraded** — see F1.
101. **Disk near full** — warning + summoned prune.
102. **Battery critical** — ambient escalating to emergency.
103. **Build / CI failed** — notification → triage.
104. **External interruption** (phone, doorbell, IRL) — not
     shell-driven; shell degrades gracefully.

**Cintiq mode**

105. **Cintiq-as-regular-screen** — occasional mode toggle out of
     quick-access mode entirely.

**Utilities on Cintiq / drawer**

106. **Pull-down timer** (kitchen twist analog; no label — multi-timer
     labelling is a future ticket).
107. **Reminder-set** (large-button interval chips).
108. **Calculator**.

**Notification channel — three sub-channels + triage**

109. **Regular notification** (build done, download complete) — toast.
110. **Human presence ping** (Discord, Outlook DM) — *sound only, no
     visual*. Content lives in the originating app.
111. **Emergency alarm** (compositor died, battery hard threshold,
     disk-hard-fail, unexpected outbound) — reserved edge treatment.
112. **Notification triage** — the meta-flow when one lands.

**Non-flows explicitly rejected**

- **Habit tap-log tile** (single tap records event) — user rejected;
  desk-clutter reinforcement is the alternative mechanism.
- **Focus / DND / muzzle-on-call modes** — user rejected in whole
  (bucket H). Non-modes.
- **Focus / pomodoro timer** — rejected as focus-discipline; kitchen
  twist-timer (#106) is a different beast (utility, not attention
  discipline).
- **Weekly review** — rejected as a first-class flow.
- **Voice memo / screen-recording-for-send** — deferred, not yet
  first-class.
- **Search open browser tabs / clipboard history / dictionary /
  translate** — user rejected.

### 3.7 Physical/temporal context, frequency, duration

Rough characterisation per group. Every group aggregates flows with
similar shape — downstream per-flow tickets may refine. See §3.6 for
individual flow numbers.

| Group | Where | When | Frequency | Duration |
|---|---|---|---|---|
| All-day focus arcs (#1–#12) | primary; occasionally 4-way terminal split when using Claude (not default; default plan is Monocle + alt-tab) | daytime + evening; hyperfocus territories = coding, singing/recording | daily (coding, browsing); sub-daily (others) | 2–8+ hours |
| Session-boundary events (#13–#18) | primary (full-screen event surface) | daily rhythms (boot, session-end); ad-hoc (lock/unlock) | 1–several per day | seconds to <1 min |
| Break / social (#19–#21) | varies (no shell for #19); primary for #20/#21 | punctuates focus arcs | 3–10 per day | minutes |
| Mid-session micro-flows (#22–#28) | primary (summoned overlays) | mid-session | many per day (10–50) | seconds |
| Quick capture (#29–#34) | primary (summoned) | throughout day, ADHD-driven | many per day (5–20) | seconds to 2 min |
| Quick retrieval (#35–#41) | primary (summoned) or drawer (Cintiq) | anxiety-driven or plan-driven | several per day | seconds to <1 min |
| Habits — desk-clutter (#42–#52) | Cintiq bento primarily; drawer peek on laptop | daily rhythm | daily reset | variable — the *doing* varies, the tile is instant |
| Time / calendar (#53–#57) | primary overlay (#54); drawer (#53, #55); reserved edge for #56 | day-long | passive (#54 ambient); event-driven (#55–#56) | seconds |
| Day-guide surface (#58) | primary (both stack and peek) | during work | many peeks/day | seconds to minutes |
| Comms out (#59–#60) | in-app on primary | day | daily | seconds (msg) to 1 h (call) |
| Audio consumption (#61–#62) | Cintiq controls; audio ambient | most of day background; foreground for #62 | daily | hours |
| Video consumption (#63–#64) | multi-monitor (satellite + primary) | evening + background daytime | daily | minutes to hours |
| Library-building (#65) | background (system) + notify | ad-hoc | few per week | background |
| System controls (#66–#71) | Cintiq bento + drawer (both hosts) | as needed | 5–20 per day | seconds |
| Audio processing (#72–#76) | full-screen DAW-like (currently gapped) | recording sessions only | few per week when active | 30 min–hours |
| Network transparency (#77–#79) | Cintiq monitoring cluster (#77–#78); reserved edge (#79) | passive #77–#78; event-driven #79 | passive always; event rare | seconds |
| Sysadmin / iteration (#80–#91) | primary terminal (most); GUI aspiration for #91 | weekly-ish (varies) | weekly-ish | minutes to 30 min |
| Rare / one-off (#92–#93) | primary terminal + external machine | rare | <monthly | hours |
| Cross-boot / cross-device (#94–#97) | multi-device | Windows: task-driven; files: ad-hoc; handoff: parked | Windows: few/week; files: several/week | Windows: hours; files: seconds |
| Exception / event-driven (#98–#104) | wherever they fire (primary usually) | unpredictable | rare-to-often (network flaky) | seconds to minutes |
| Cintiq mode (#105) | GEN-DPC only | rare | rare | mode-switch instant |
| Utilities (#106–#108) | Cintiq bento; drawer peek on laptop | ad-hoc | few per day | seconds |
| Notification channel (#109–#112) | notification surface (currently mako pending AGS); reserved edge for #111 | event-driven | many per day (#109/#110); rare (#111) | seconds |

### 3.8 Friction inventory expansion

Each of the map's seven original frictions plus nine surfaced during
grilling, with current end-to-end experience.

**F1. Wifi state discovery.**
*Actual current flow:* connection degrades →
turn wifi off (waybar GUI) → turn iPhone hotspot off → turn iPhone
hotspot on → turn wifi back on → wait to reconnect. If perpetually
shoddy: fall back to wired USB tether. Debugging is manual terminal
(`ping`, `ifconfig`). *What breaks:* debugging is manual and terminal-
gated; a 2-click procedure for a very common problem; state discovery is
late (already stuck before user checks).

**F2. Bluetooth speaker auto-takeover.**
*Actual current flow:* Bluetooth
speaker usually auto-connects near-instantly at boot; default sink often
silently becomes the speaker. To change: `pavucontrol` or waybar toggle.
*What breaks:* no surface tells you the current active sink; auto-switch
is undesirable — *design intent for the resolution: no auto-switch on
connect, explicit user selection only via a legible quick-switch UI.*

**F3. Audio device switching + volume.**
`XF86Audio*` keys change volume
on current default sink with **no OSD feedback**. Sink change requires
`pavucontrol`; per-window routing requires `pavucontrol → Playback tab`.
*What breaks:* no OSD, no first-class per-window control, sink switch
buried three clicks deep.

**F4. Workspace navigation ("fumble to find my terminal").**
`$mod + 1..9`
jumps by number (requires remembering which workspace holds what);
`$mod + H/J/K/L` moves focus in current workspace; `$win + T` launches a
*new* kitty rather than finding the existing one. *What breaks:*
finding-existing-window is a hunt; mental model is location-first
(workspace number), not identity-first (which app).

**F5. Launcher gap.**
`dmenu_run` enumerates PATH executables. Steam
games are launched via `steam://run/appid` handlers, not PATH — they
don't appear in dmenu. Projects under `~/repositories` also not
launchable directly; user navigates manually. *What breaks:* launcher
scope is limited to PATH; games and projects are second-class.

**F6. Time awareness.**
No clock in AGS bar (workspaces only). Clock on
auth screen only visible when locked / logging in. GEN-LPC waybar has
clock. During hyperfocus, even when clock is visible, user doesn't look.
Meetings/interviews missed absent phone pings. *What breaks:* clock is
either absent or ignored during focus — the ambient countdown flow (#54)
answers this.

**F7. Discord ping (works as intended, mostly).**
Discord notification →
mako toast + sound → glance-decide-dismiss. Framework's
human-presence-ping shape (sound-only would be even more correct).
*What breaks:* one gap — **Discord is not on autostart**, so pings
before Discord launches are missed. Autostart consideration for
downstream.

**F8. Reason 10 has no Linux equivalent.**
Audio production requires
reboot to Windows. Wine tried, insufficient. *What breaks:* cross-boot
friction; session state doesn't transfer. Blocked by third-party (not
IA).

**F9. Clip Studio Paint has no Linux equivalent.**
Digital art (higher-fidelity
than Krita) requires reboot to Windows. *What breaks:* same cross-boot
friction as F8; Krita is a partial substitute.

**F10. Phone reminders too much friction to set.**
iPhone's reminder-set
requires multiple taps + Siri unreliable for the user. Reminders are
avoided → forgotten. *What breaks:* the tool that should reduce anxiety
adds friction; user avoids it. The desktop remind-me-at-X flow (#55)
answers this.

**F11. Building habits.**
No system for daily-repeating tasks; user relies
on memory + willpower; things user wants to build (journal, kanji,
dishes, laundry) drift because there's no visible reminder. *What
breaks:* memory + willpower are the wrong tools per ADHD-I. The
desk-clutter reinforcement design (§3.5, axis 6) answers this. **User's
strong "YES" on this friction — highest personal priority.**

**F12. Procedural anxiety on unfamiliar tasks.**
User avoids Japanese
phone calls / emails because cadence/vocabulary is unfamiliar. No tool
coaches through them. *Current workaround:* ad-hoc web-based LLM chat.
*What breaks:* offline-first constraint blocks a native solution;
playbooks too rigid. Pinning as unsolved gap (§3.11).

**F13. "Should I be doing something?" anxiety.**
No surface tells user
if there's something to prioritize now. User either checks phone /
calendar / todos manually (many times/day when bad) or doesn't check
and worries. *What breaks:* legible-presence gap; the day-guide anxiety
pill answers this (§3.10).

**F14. Working-memory pressure on unlogged thoughts.**
A thought arrives
mid-task. Not logging → lost. Logging costs attention from current task.
User keeps it in working memory instead, blocking the current task.
*What breaks:* capture friction directly opposes focus. Yeet-thoughts
(#30) + quick-note (#29) answer this.

**F15. Time-blindness during hyperfocus.**
Hours pass unnoticed;
meetings/interviews missed. Current mitigation: hyperawareness + phone
pings. *What breaks:* human attention system doesn't produce a
time-check prompt when hyperfocused. Ambient countdown (#54) answers.

**F16. Task-inertia against urgent-pivot.**
User knows they should stop
for X (interview prep). Keeps coding. Margin evaporates. *What breaks:*
self-trust fails under hyperfocus; per-event hyperfocus-penetration
opt-in (#56) answers.

### 3.9 Aspirational modes — rejected

The map's Users mind dump asked whether introducing mode-gating would
serve the workflow. **Answered: no.** The user rejected the entire
mode/focus/DND bucket during grilling (H bucket, Q5): no timer, no DND
toggle, no auto-muzzle-on-call as a mode. "No modes" holds hard.

Reason: the user's day has no discrete modes (one continuous session);
sender-side interruption discipline suffices; introducing modes would
gate behavior on a state the user does not naturally maintain, and would
trigger the shame axis (F) when the user forgets to change mode.

Two exceptions to "no modes" that survived grilling and are *not* modes:

- **Cintiq-as-regular-screen** (#105) is a mode toggle, but it is a
  hardware / surface toggle, not an attention-discipline mode.
- **Per-event hyperfocus-penetration opt-in** (#56) is per-*event*, not
  per-*mode* — the user pre-authorises the shell for one specific
  obligation, not for a period.

### 3.10 Surface home decisions made during grilling

These are user commitments made during the session, load-bearing on the
surface inventory ticket.

**Two-surface split for ambient state + universal actions:**

- **Drawer (universal, exists on both hosts, identical shape).**
  Contains *actions* — the things you reach for on any host, so muscle
  memory transfers. Cross-host analog: iPad Action Center → iPhone
  Control Center → Mac control drawer. Pull-up gesture on primary; also
  reachable via keybind for the keyboard-first case.

  Contents:
  - Wifi + immediate retry
  - Bluetooth pairing / selection
  - Audio sink switcher + volume
  - Brightness
  - Voluntary lock
  - Media transport (play / pause / skip)
  - Currently-playing (compact strip)
  - Pull-down timer
  - Reminder-set
  - Calculator
  - Calendar peek (Outlook view — same as anxiety-anchored summon)
  - RSS / X feeds
  - Habit peek (laptop-side view of the desk-clutter surface)

- **Cintiq bento (GEN-DPC only, ambient dashboards).** Contains
  *dashboards* — information you glance at. Cintiq is bonus, not
  required for function; laptop peek dashboard replicates equivalents
  via the drawer.

  Contents (variable-sized cells, semantic clustering, bento layout):
  - **Time + date cluster** — big clock, date
  - **Now-playing cluster** — large widget with album art
  - **System summary** — host / uptime / generation (mirrors auth-screen
    rail)
  - **Monitoring cluster** — network activity, memory, disk
  - **Info feeds cluster** — RSS + X/Twitter (tap to open reader
    drawer)
  - **Habit-clutter cluster** — the desk-clutter reinforcement tiles
    (#42–#51 for today)
  - **Hyprland layout switcher** (per-monitor static buttons, #66)
  - **Cintiq-mode toggle** — small persistent verb (switch to
    regular-screen mode, #105)
  - **Reserved edge** — hyperfocus-penetration alarm (#56) + emergency
    (#79 unexpected outbound, #111 emergency channel) — dominates when
    fires, dormant otherwise. Rare by design.

  **Layout metaphor pinned: bento box (ζ' variant, cluster + drawers).**
  Rejected: mixing console (γ' — heterogeneous inventory, not symmetric
  channels; wastes width on 16:9 4K); zoning bands (top/middle/bottom
  — same width-wasting problem).

**Primary-only surfaces (single source of truth):**

- **Safety-class ambient icons** (mic / camera / screen-share /
  recording active). Not duplicated on Cintiq. Framework says these
  belong in the ambient shortlist; the IA hosts them on primary only.
- **Ambient countdown to next event** (#54). Small persistent overlay
  over primary content. Not in drawer, not on Cintiq.
- **Day-guide stack + peek-timeline surface** (#58). Both halves on
  primary. Passive next-todo card visible; peek-timeline summoned when
  density is wanted.
- **Notification channel** (#109–#112) as it evolves post-mako. Toast /
  sound / emergency lives on primary. Reserved edge is *cross-modal*
  (Cintiq + desktop speakers) but that is the interruption-defense
  design, not a shared render surface.

**Laptop-specific:**

- **Minimal edge strip** on primary — carries load-bearing signals
  only (safety, battery, wifi, countdown, next-todo pill). Everything
  else lives behind the pull-up drawer / keybind summon.
- **Full waybar rejected** for the laptop-first target. Current waybar
  on GEN-LPC is legacy; the reforming pass will replace with the
  minimal edge strip + drawer.

**Long-focus arcs (primary, indefinite):**

- Coding, gaming, meeting/call, reading long-form, singing/recording,
  Krita, DaVinci, drills, textbook study, flashcards perform, compose
  message, initiate call — all live on primary at full-screen or in
  their own chrome. Not the IA's job to design their internal
  interaction; the IA's job is to *not interfere* while they run.

**In-app placements:**

- **Per-window audio route** (#27) — context menu / anchored overlay on
  the window itself. Not a shell surface.
- **Emoji picker** (#25) — fcitx inline. The *flow* is IA-visible; the
  *fulfillment* is in-app.

### 3.11 Unsolved gaps for future tickets

These are open questions the grilling could not close in this session.
Each should become its own ticket or feed a broader open one.

- **LLM procedural coaching (F12 axis).** The user's F-axis anxiety
  wants scaffolding for unfamiliar procedures (Japanese phone calls,
  business email). Playbooks rejected as too rigid. Current workaround
  is ad-hoc web-LLM chat. **Blocked by**: offline-first constraint +
  local-model quality. Aspirational; revisit when local models are
  strong enough or the offline-first trade re-opens.

- **Reason 10 replacement for Linux audio production.** No native
  equivalent, wine insufficient. Currently solved by dual-boot to
  Windows. Blocked by third-party market state.

- **Clip Studio Paint replacement for Linux digital art.** Krita is a
  partial substitute; user still keeps a Windows install for this.
  Blocked by third-party market state.

- **Cross-host handoff GEN-DPC ↔ GEN-LPC (#97).** Parked pending GEN-LPC
  reinstall. Feasible mechanisms: syncthing, git-backed vault, NAS
  pull. Its own ticket when GEN-LPC returns.

- **NixOS admin GUI (#91).** Aspirational. GUI to monitor / enact
  sysadmin flows (rebuild status, generation list, service state).
  Downstream ticket, not designed here.

- **Sync architecture design (Outlook target chosen — but *how*).**
  Q16 settled Outlook as canonical target. The bridge mechanism
  (CalDAV, EAS, Graph API) and conflict semantics are downstream.

- **Habit clear-mechanism edge cases.** Digital habits infer from
  artifacts; physical habits tap-to-put-away. Edge cases (skip a day,
  archive an old habit, edit a mis-clear, define an artifact for a new
  digital habit) not designed here.

- **Cintiq-mode-switch UX.** #105 exists as a flow but the *transition*
  UX (are widgets frozen? does state persist? how do you get back?) is
  not designed.

- **Multi-timer labelling.** #106 committed to no-label. Multi-timer
  disambiguation deferred as a future ticket when the need surfaces.

- **Vendor-lock risk on LLM enrichment.** When LLM enrichment lands
  (yeet-thoughts categorisation, procedural coaching), the architecture
  should be API-abstracted and local-first-fallback. Design not
  finalised.

### 3.12 Handoff to the surface inventory ticket

The surface inventory ticket ([map #95](https://github.com/gnamikawa/dotfiles-nix/issues/95)
"Not yet specified" → **surface inventory**) can now be specified. What
it should consume from this doc:

- **§3.6** — the ~85 flows are the substrate. Each flow needs a
  surface (or an in-app placement) named.
- **§3.10** — the surface homes are pre-committed. The surface
  inventory ticket enumerates the *specific surfaces* implied by these
  homes, not the homes themselves.
- **§3.5 axes** govern per-surface design (silent measurement,
  invitation without enforcement, real-world equivalents, single
  source of truth, desk-clutter, legible presence).
- **§3.8 frictions** are the audit lens: for every existing surface in
  master (§2.1), does it address a friction? does it violate an axis?
  The reforming pass rework tickets emerge from this cross-check.
- **§3.9** — no modes. Do not spawn mode-gating tickets.
- **§3.11** — do not surface-inventory the unsolved gaps.

Explicit **reforming targets** derived from §2 audited against §3:

- The **AGS bar** (#34) is workspaces-only — needs to grow only the
  passive next-todo pill, ambient countdown, and safety-class row
  (all §3.10 primary-only). Everything else stays in the drawer or on
  Cintiq.
- The **auth screen** (§2.1) already carries a status rail; its role
  doesn't change but the rail's *content* may be audited against the
  drawer's canonical shape (single-source rule).
- **mako** — will be replaced by an AGS notification surface (#109);
  the surface inventory ticket must name it and its three sub-channels.
- **waybar** — will be replaced by the minimal edge strip + drawer on
  GEN-LPC; the surface inventory ticket must name the strip and the
  drawer.
- **dmenu** — the launcher (#22) needs a native AGS replacement per
  ADR-0008; its scope expands to games (#22 F5) and projects
  (`~/repositories`).
- **hyprlock (GEN-LPC)** — will be superseded by the AGS locker
  (already used on GEN-DPC) when GEN-LPC returns.

Everything above is ready to hand off. This ticket closes.
