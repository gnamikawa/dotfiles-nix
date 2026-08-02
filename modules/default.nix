# Desktop profile — the apps layer plus the desktop session itself.
#
# Shell surfaces (bar, notifications, and eventually the launcher) are *not*
# here: they are staggered per host across the AGS migration, so each host
# imports the surfaces that host runs (issue #43). A surface's module is
# deleted once the last host drops it.
#
# Hyprland is deliberately not staggered, and so stays here rather than
# becoming a host's choice.

{ ... }:
{
  imports = [
    ./apps.nix
    ./hyprland.nix
    ./hypridle.nix
  ];

  xdg = {
    autostart.enable = true;
  };
}
