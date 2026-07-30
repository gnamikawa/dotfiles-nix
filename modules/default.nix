# Desktop profile — the apps layer plus the desktop session itself.

{ ... }:
{
  imports = [
    ./apps.nix
    ./hyprland.nix
    ./hyprlock.nix
    ./mako.nix
    ./waybar.nix
    ./ags.nix
  ];

  xdg = {
    autostart.enable = true;
  };
}
