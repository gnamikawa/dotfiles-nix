{ pkgs, ... }:
{
  imports = [
    # This host's computed slices.
    ./hyprland-outputs.nix

    # Shell surfaces this host runs (issue #43). Spelled as paths into
    # modules/. Mako stays until the AGS notification surface replaces it;
    # Hyprlock has been replaced by the AGS session lock, matching
    # GEN-DPC (#34).
    ../../modules/ags.nix
    ../../modules/ags-session-lock.nix
    ../../modules/mako.nix
  ];

  # Backlight control for the Fn-row brightness keys (hyprland-outputs.nix).
  # Modern brightnessctl talks to systemd-logind for the actual write, so no
  # udev rule is needed — just the package.
  home.packages = [ pkgs.brightnessctl ];
}
