{ pkgs, config, claude-desktop, ... }:
{
  # GUI applications only, routed through the nixGL wrapper so they can run
  # on non-NixOS distributions (identity under NixOS / when nixGL is unset).
  home.packages = map config.lib.nixGL.wrap ([

    # Claude Desktop, from claude-desktop-nix (official .deb, Cowork-enabled).
    claude-desktop
  ] ++ (with pkgs; [

    # ── Window Manager & Desktop ──────────────────────────────────────────
    dmenu # Dynamic menu / launcher

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
  ]));
}
