# Screen-capture tooling: hyprshot + gpu-screen-recorder

Part of the Hyprland era change (#1). Screenshots use **hyprshot**
(`-m window|output|region`, `--clipboard-only`, non-freeze) on
`Ctrl+Shift+2/3/4`, installed as a dotfiles home package. Screen recording
uses **gpu-screen-recorder** toggled by `Ctrl+Shift+5` via a `record.sh`: a
`slurp -o -f '%o'` click yields the chosen monitor's name, gpu-screen-recorder
captures it over **KMS/NVENC** with desktop audio (`-a default_output`) to a
timestamped mp4 under `~/Videos`, and `SIGINT` stops and finalises it.
gpu-screen-recorder is enabled **system-side** via
`programs.gpu-screen-recorder.enable` (system-nix `modules/desktop.nix`),
which ships the setcap'd `gsr-kms-server` needed for promptless capture.

## Considered options

- **Bespoke `screenshot.sh`** (abandoned). The slurp overlay's ~500 ms fade
  baked a blue tint and the cursor into `grim -g` grabs. hyprshot uses the
  same mechanism, so **non-freeze** carries the same residual risk, with
  `--freeze` as the fallback if it reproduces.

- **Recording as a home package** (portal or wlroots recorders) — the
  preferred shape, rejected after it proved unworkable on this NVIDIA box:
  - **gpu-screen-recorder `-w portal`** is unprivileged, but the
    xdg-desktop-portal ScreenCast picker is a three-tab Screen/Window/Region
    GUI, not a mouse pick.
  - **wf-recorder** captures via wlr-screencopy but its `h264_nvenc` path is
    broken/unmaintained (garbled output); the project only endorses VAAPI.
  - **wl-screenrec** is VAAPI-only and explicitly Intel/AMD — unsupported on
    NVIDIA.

  Root cause: every home-package wlroots recorder hardware-encodes via VAAPI,
  and **NVIDIA has no VAAPI encode** (the nvidia-vaapi-driver does decode
  only). The one tool that does real NVENC on NVIDIA Wayland is
  gpu-screen-recorder, whose promptless (GUI-free) capture requires the
  setcap KMS helper — hence the system-nix module. We traded the
  home-package/system-independence preference for a recorder that actually
  works on the hardware.

## Consequences

- Recording is coupled to system-nix (`programs.gpu-screen-recorder.enable`);
  it is not purely a home-package feature. Enabled in shared `desktop.nix`, so
  both Hyprland hosts get it (NVENC on GEN-DPC, VAAPI on the GEN-LPC iGPU).
- Screenshots stay clipboard-only (ephemeral); recordings are timestamped
  files under `~/Videos`.
- `record.sh` matches the process with `pgrep/pkill -f` because the kernel
  truncates the 18-char `gpu-screen-recorder` comm to 15, breaking `-x`.
- `imagemagick` was dropped with the abandoned screenshot crop; `slurp`
  (via hyprshot, and the recording monitor-pick) remains.
