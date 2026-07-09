{ pkgs, ... }:
{
  gtk = {
    enable = true;

    theme = {
      name = "Marwaita-Teal";
      package = pkgs.marwaita-teal;
    };

    iconTheme = {
      name = "Papirus-Dark";
      package = pkgs.papirus-icon-theme;
    };

    cursorTheme = {
      name = "Adwaita";
      package = pkgs.adwaita-icon-theme;
      size = 24;
    };

    # GTK 2 — legacy apps (GIMP 2.x, older Xfce widgets, etc.)
    gtk2.extraConfig = ''
      gtk-application-prefer-dark-theme = 1
    '';

    # GTK 3 — the majority of GTK apps still in use
    gtk3.extraConfig = {
      gtk-application-prefer-dark-theme = true;
      gtk-button-images = false; # cleaner look
      gtk-menu-images = false;
      gtk-enable-event-sounds = false;
    };

    # GTK 4 — newer GNOME-stack apps (Files, Text Editor, etc.)
    # Note: GTK4 largely ignores full themes; color-scheme is what matters.
    gtk4.extraConfig = {
      gtk-application-prefer-dark-theme = true;
    };
  };

  # ----------------------------------------------------------
  # dconf / gsettings
  #   Controls GNOME settings daemon — picked up by GTK apps
  #   even outside a full GNOME session.
  # ----------------------------------------------------------
  dconf.settings = {
    "org/gnome/desktop/interface" = {
      color-scheme = "prefer-dark"; # GTK 4 dark-mode signal
      cursor-size = 24;
      font-name = "Noto Sans 10";
      document-font-name = "Noto Sans 10";
      monospace-font-name = "JetBrainsMono Nerd Font 10";
      text-scaling-factor = 1.0;
      enable-animations = true;
    };

    # Applies to apps that check window manager accent color
    "org/gnome/desktop/wm/preferences" = {
      titlebar-font = "Inter Bold 11";
    };
  };

  home.sessionVariables = {
    # Forces GTK to use the Wayland backend; fall back to X11 via XWayland if needed.
    GDK_BACKEND = "wayland,x11";
  };
}
