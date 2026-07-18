# Graphical profile — the full home configuration: the terminal layer plus
# the desktop session, GUI applications, and hardware bundles.

{ ... }:
{
  imports = [
    ./terminal.nix
    ./firefox.nix
    ./keepassxc.nix
    ./kitty.nix
    ./hyprland.nix
    ./hyprlock.nix
    ./fcitx5.nix
    ./mako.nix
    ./sway/sway-common.nix
    ./sway/theme
    ./waybar.nix
    # ./flatpak.nix
    ./packages/nvidia.nix
    ./packages/user-applications.nix
    ./obsidian.nix
    ./packages/etc.nix
  ];

  xdg = {
    autostart.enable = true;
  };
}
