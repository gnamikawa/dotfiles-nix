{ pkgs, ... }:
{
  # GUI applications only.
  home.packages = with pkgs; [

    # ── Window Manager & Desktop ──────────────────────────────────────────
    dmenu # Dynamic menu / launcher
    mako # Wayland notification daemon

    # ── Display Management ────────────────────────────────────────────────
    wlr-randr
    wdisplays

    # ── Audio & PipeWire ──────────────────────────────────────────────────
    pavucontrol # PulseAudio / PipeWire volume control GUI
    qpwgraph # PipeWire patchbay / graph GUI

    # ── Bluetooth & Networking ────────────────────────────────────────────
    blueman # Bluetooth manager
    networkmanagerapplet

    # ── File Management ───────────────────────────────────────────────────
    pcmanfm
    file-roller

    # ── Creative & Media ──────────────────────────────────────────────────
    krita
    blender
    mpv
    audacity

    # ── Document & Office ─────────────────────────────────────────────────
    libreoffice-qt6-fresh
    zathura

    # ── Security & Passwords ──────────────────────────────────────────────
    keepassxc

    # ── Browser & Internet ────────────────────────────────────────────────
    chromium

    # ── Compatibility ─────────────────────────────────────────────────────
    wineWow64Packages.stable # 32+64-bit Wine

    # ── Tray ──────────────────────────────────────────────────────────────
    pa_applet
    crosspipe
    udiskie
    libnotify

    # ── Etc ────────────────────────────────────────────────────────────────
    feh
    playerctl
    zbar
  ];
}
