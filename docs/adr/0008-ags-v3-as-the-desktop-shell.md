# AGS v3 as the desktop shell

The desktop shell is one AGS project owning every panel surface: bar,
notifications, launcher, OSD, action hub, and the greetd greeter. AGS v3
(Gnim JSX, GTK4) is the target, not v2 — v3 replaced the v2 frontend
wholesale, and the v2-era bindings still shipped in Astal's `lang/` tree
carry an upstream notice that they will be removed, so v2 code would be
written against a layer already scheduled for deletion. It comes from the
upstream `github:aylur/ags` flake rather than nixpkgs, which packages
v2.3.0 only and lost its principal maintainer on 2026-07-21. Every
service the shell needs — hyprland, wireplumber, network, bluetooth,
brightness, tray, notifd, apps, greet, auth — is a first-party Astal
library, so no third-party service code enters the tree.

Rejected: keeping the incumbents — waybar, mako, the dmenu bind,
sysc-greet, and every other piece AGS can absorb. Each is competent in
isolation; together they are the defect. Geist (ADR-0006) has to be
hand-rolled once per tool in a different dialect each time — jsonc plus
CSS, mako's ini, dmenu flags, sysc-greet's own config — and the surfaces
still cannot see each other, so a notification cannot dim the bar, the
power menu stays a bash script shelling out to a menu program, and
anything wanting state from two of them gets a shell pipeline between
processes. One process in one language is what makes the design system
enforceable rather than merely aspirational.

Known cost accepted: the stack is effectively one author's, and the
frontend API has been rewritten twice in two years (v1 → v2 → v3), while
the Astal service libraries underneath survived both rewrites unchanged.
This is recorded, not mitigated — no rule constrains how surfaces are
written. The flake input is pinned, so upstream churn arrives only when
asked for, and staying on the version that works is an acceptable answer
for as long as it keeps working.

The exclusion is gtk-session-lock specifically: hyprlock and hypridle
stay. It is the least mature corner of the Astal ecosystem, and a lock
screen that fails is a security hole rather than a glitch. The greetd
greeter is *not* covered by that exclusion — it is a separate surface
with its own first-party libraries (`greet`, plus `auth` for PAM), and
sysc-greet is replaced.

Consequences: under ADR-0005 the project is a raw asset at
`assets/home/.config/ags/`, live-edited with no rebuild in the loop, and
Geist constants reach it as a generated computed slice rather than as
Nix-rendered config. The greeter is the one exception on both counts —
its copy is built into the store, because it runs as the `greeter` user
which cannot read `/home/genzo`, and because a live-editable greeter
makes a typo a lockout. It is therefore also the one surface configured
outside this repo, in system-nix's `modules/desktop.nix`, rather than
through home-manager. The bundled output is nixGL-wrapped per ADR-0003
like every other GUI package here.
