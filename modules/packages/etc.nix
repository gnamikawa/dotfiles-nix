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
    grimblast
    inotify-tools
    v4l-utils

  ];
}
