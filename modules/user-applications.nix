{ pkgs, ... }:
{
  home.packages = with pkgs; [

    # ── Window Manager & Desktop ──────────────────────────────────────────────
    dmenu # Dynamic menu / launcher
    mako # Wayland notification daemon

    # ── Display Management ────────────────────────────────────────────────────
    wlr-randr
    wdisplays

    # ── Audio & PipeWire ──────────────────────────────────────────────────────
    pavucontrol # PulseAudio / PipeWire volume control GUI
    qpwgraph # PipeWire patchbay / graph GUI

    # ── Bluetooth & Networking ────────────────────────────────────────────────
    blueman # Bluetooth manager
    networkmanagerapplet

    # ── File Management ───────────────────────────────────────────────────────
    pcmanfm
    file-roller

    # ── Creative & Media ──────────────────────────────────────────────────────
    krita
    blender
    mpv

    # ── Document & Office ─────────────────────────────────────────────────────
    libreoffice-qt6-fresh
    zathura

    # ── Security & Passwords ──────────────────────────────────────────────────
    keepassxc

    # ── Browser & Internet ────────────────────────────────────────────────────
    chromium

    # ── Compatibility ─────────────────────────────────────────────────────────
    wineWow64Packages.stable # 32+64-bit Wine

    # ── System Monitors ───────────────────────────────────────────────────────
    htop
    bottom

    # ── Tray ──────────────────────────────────────────────────────────────────
    pa_applet
    crosspipe
    udiskie
    libnotify
    # ── Development ───────────────────────────────────────────────────────────
    clang
    cargo
    rust-analyzer
    nix-index

    # ── Etc ───────────────────────────────────────────────────────────────────
    fzf
    ripgrep
    xclip
    bat
    fastfetch
    feh
    playerctl
    zbar
    atool
    unrar
    p7zip
    stow
    poppler-utils
    odt2txt
    ueberzug
    libcaca
    exiftool
  ];
}
