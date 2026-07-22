{ pkgs, ... }:
{
  home.packages = with pkgs; [

    # ── System ────────────────────────────────────────────────────────────────
    stdenv.cc.cc.lib
    pciutils
    hwinfo
    libwacom
    xf86_input_wacom
    evtest
    libimobiledevice
    ifuse
    grim
    slurp
    wl-clipboard
    hyprshot # screenshot: window/output/region → clipboard (Ctrl+Shift+2/3/4)
    # screen recording is gpu-screen-recorder, enabled system-side (setcap KMS
    # wrapper) via programs.gpu-screen-recorder in system-nix modules/desktop.nix
    inotify-tools
    v4l-utils

  ];
}
