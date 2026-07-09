{ pkgs, ... }:
{
  home.packages = with pkgs; [

    # ── System ────────────────────────────────────────────────────────────────
    stdenv.cc.cc.lib
    busybox
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
    inotify-tools
    v4l-utils
    home-manager

  ];
}
