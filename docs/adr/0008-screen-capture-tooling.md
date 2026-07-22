# Screen-capture tooling: hyprshot + gpu-screen-recorder

Part of the Hyprland era change (#1). Screenshots use **hyprshot**
(`-m window|output|region`, `--clipboard-only`, non-freeze) on
`Ctrl+Shift+2/3/4`; screen recording uses **gpu-screen-recorder** (NVENC)
toggled by `Ctrl+5` through a `record.sh` that captures via the
xdg-desktop-portal ScreenCast picker with desktop audio to `~/Videos`,
started in the foreground and stopped/finalised with `SIGINT`. Both install
as **home packages** in dotfiles so capture works independently of the
host/system-nix layer. This replaces an abandoned bespoke pipeline
(slurp → settle → `grim -l 0` full-layout grab → `magick` crop) that fought
slurp's ~500 ms overlay fade.

## Considered options

- **Bespoke `screenshot.sh`** (the abandoned pipeline). The slurp overlay's
  ~500 ms fade baked a blue tint (and the cursor) into the grab, forcing an
  unbounded settle `sleep`; freezing the frame on keypress was rejected as
  the wrong capture moment. hyprshot uses the same `grim -g "$(slurp)"`
  mechanism, so **non-freeze** carries the same residual fade risk in
  exchange for a maintained tool and a live release-moment frame — verified
  by driving it, with `--freeze` as the fallback if the fade reproduces.

- **gpu-screen-recorder via the NixOS `programs.gpu-screen-recorder.enable`
  module** (setcap'd KMS helper). Rejected in favour of a plain home
  package: portal capture needs no elevated caps, and keeping recording in
  dotfiles avoids coupling it to a system-nix change. Cost: KMS /
  focused-monitor capture (which *does* need the helper) is unavailable
  until/unless the module is added.

- **Portal session-restore** (pick once, reuse the token). Rejected —
  pick-every-time was preferred so each recording's source is chosen
  explicitly.

## Consequences

- Screenshots are clipboard-only (ephemeral); recordings are timestamped
  files under `~/Videos`.
- `imagemagick` is dropped (only the abandoned crop used it); hyprshot pulls
  `grim`/`slurp` transitively.
