# Screen-capture tooling: hyprshot + wf-recorder

Part of the Hyprland era change (#1). Screenshots use **hyprshot**
(`-m window|output|region`, `--clipboard-only`, non-freeze) on
`Ctrl+Shift+2/3/4`. Screen recording uses **wf-recorder** toggled by
`Ctrl+Shift+5` via a `record.sh`: a `slurp -o` click picks a monitor,
wf-recorder captures it through **wlr-screencopy** and encodes H.264 via
NVENC with desktop audio to a timestamped mp4 under `~/Videos`, started in
the foreground and stopped/finalised with `SIGINT`. Both install as **home
packages** in dotfiles so capture works independently of the host/system-nix
layer.

## Considered options

- **Bespoke `screenshot.sh`** (abandoned). The slurp overlay's ~500 ms fade
  baked a blue tint and the cursor into `grim -g` grabs, forcing an unbounded
  settle `sleep`. hyprshot uses the same `grim -g "$(slurp)"` mechanism, so
  **non-freeze** carries the same residual fade risk in exchange for a
  maintained tool and a live release-moment frame — verified by driving it,
  with `--freeze` as the fallback if the fade reproduces.

- **gpu-screen-recorder** for recording. Rejected. Its NVENC/NVIDIA support
  is the most reliable, but its only *unprivileged* (home-package) capture
  path is `-w portal` — the xdg-desktop-portal ScreenCast picker, a three-tab
  Screen/Window/Region GUI, not a mouse pick. Promptless direct capture needs
  the setcap'd KMS helper (`programs.gpu-screen-recorder.enable`), which
  couples recording to a system-nix module. wf-recorder instead gives a
  native `slurp` mouse pick over wlr-screencopy (the same protocol `grim`
  already uses reliably on this box) while staying a pure home package.
  Trade-off: NVENC is *not* wf-recorder's first-class path (VAAPI is its
  documented HW encoder), so `h264_nvenc` engagement is verified per-box, with
  software x264 as the fallback.

- **Portal session-restore** (pick once, reuse the token). Moot once portal
  was dropped.

## Consequences

- Screenshots are clipboard-only (ephemeral); recordings are timestamped
  files under `~/Videos`.
- `imagemagick` is dropped (only the abandoned crop used it); hyprshot pulls
  `grim`/`slurp` transitively, and `slurp` also drives the recording pick.
