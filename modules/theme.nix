# ============================================================
# Baseline theming — covers GTK 2/3/4, Qt 5/6, fonts,
# cursors, icons, Electron, XDG portals, and Java/SDL.
# Swap the name/package pairs for whichever theme you prefer.
# ============================================================
{ pkgs, config, ... }:

{
  imports = [
    ./gtk.nix
    ./qt.nix
  ];

  # ----------------------------------------------------------
  # Fonts (affects every toolkit)
  # ----------------------------------------------------------
  fonts.fontconfig.enable = true;

  home.packages = with pkgs; [
    # Sans-serif (UI & reading)
    inter
    noto-fonts
    noto-fonts-cjk-sans # CJK support — important for many users
    noto-fonts-color-emoji

    # Monospace (terminal, code editors, IDEs)
    nerd-fonts.jetbrains-mono
    ricty # Optional, good monospaced font for coding

    # Icon font (used by many Electron/web-based apps)
    font-awesome

    # Qt platform integrations
    libsForQt5.qt5ct # Qt 5 theme configurator
    qt6Packages.qt6ct # Qt 6 theme configurator
    libsForQt5.qtstyleplugin-kvantum # Kvantum engine (optional)
    qt6Packages.qtstyleplugin-kvantum

    # XDG desktop portal backends (required for Wayland theming)
    xdg-desktop-portal
    xdg-desktop-portal-gtk # GTK portal (GNOME / most compositors)
  ];

  # ----------------------------------------------------------
  # Environment variables
  #  This is the glue layer — many toolkits ignore every
  #  config file above unless these are set correctly.
  # ----------------------------------------------------------
  home.sessionVariables = {
    # --- Cursor (applies to SDL, Electron, Java, and anything
    #     that doesn't inherit from GTK/Qt directly) ---
    XCURSOR_THEME = "Adwaita";
    XCURSOR_SIZE = "24";

    # --- Electron / Chromium-based apps (VS Code, Discord,
    #     Slack, Obsidian, etc.) ---
    # These apps respect the GTK theme for file dialogs but
    # use their own renderer. Force native title bar + Wayland:
    ELECTRON_OZONE_PLATFORM_HINT = "auto"; # Wayland if available
    # You can also drop a ~/.config/electron-flags.conf:
    # --enable-features=WaylandWindowDecorations
    # --ozone-platform-hint=auto

    # --- Java / AWT / Swing (IntelliJ, JetBrains, etc.) ---
    # JetBrains IDEs have their own theme system, but this
    # improves font rendering and HiDPI scaling:
    _JAVA_AWT_WM_NONREPARENTING = "1"; # fixes windows in tiling WMs
    # JDK_JAVA_OPTIONS = "-Dawt.useSystemAAFontSettings=on -Dswing.aatext=true";

    # --- SDL (games, RetroArch, etc.) ---
    SDL_VIDEODRIVER = "wayland,x11"; # prefer Wayland

    # --- Firefox (uses GTK natively, but respects this) ---
    MOZ_ENABLE_WAYLAND = "1";
  };

  # ----------------------------------------------------------
  # XDG user dirs (prevents apps from creating ~/Desktop etc.)
  # ----------------------------------------------------------
  xdg = {
    enable = true;
    userDirs = {
      enable = true;
      createDirectories = true;
      desktop = "${config.home.homeDirectory}/Desktop";
      documents = "${config.home.homeDirectory}/Documents";
      download = "${config.home.homeDirectory}/Downloads";
      music = "${config.home.homeDirectory}/Music";
      pictures = "${config.home.homeDirectory}/Pictures";
      videos = "${config.home.homeDirectory}/Videos";
      templates = "${config.home.homeDirectory}/Templates";
      publicShare = "${config.home.homeDirectory}/Public";
    };
  };
}
