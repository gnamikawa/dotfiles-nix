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
    gpu-screen-recorder # NVENC screen recording, portal capture (Ctrl+5 toggle)
    inotify-tools
    v4l-utils

  ];
}
