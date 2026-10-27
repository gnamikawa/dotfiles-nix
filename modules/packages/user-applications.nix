{ pkgs, config, ... }:
{
  # GUI applications only, routed through the nixGL wrapper so they can run
  # on non-NixOS distributions (identity under NixOS / when nixGL is unset).
  home.packages = map config.lib.nixGL.wrap (
    (with pkgs; [

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
      # Staging Full, not stable: the same Wine the clip-studio launcher runs,
      # so the Clip Studio prefix is never opened by two different versions.
      # Full also carries the Gecko and Mono installers, so a new prefix gets
      # them without a download or a prompt.
      wineWow64Packages.stagingFull # 32+64-bit Wine
      winetricks

      # ── Tray ──────────────────────────────────────────────────────────────
      pa_applet
      crosspipe
      udiskie
      libnotify

      # ── Etc ────────────────────────────────────────────────────────────────
      feh
      playerctl
      zbar
    ])
  );
}
