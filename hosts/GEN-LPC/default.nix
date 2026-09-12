{ ... }:
{
  imports = [
    # This host's computed slices.
    ./hyprland-outputs.nix

    # Shell surfaces this host runs (issue #43). Spelled as paths into
    # modules/. This host keeps Hyprlock until its own migration; waybar
    # has been dropped in favor of the AGS bar, matching GEN-DPC (#34).
    ../../modules/ags.nix
    ../../modules/hyprlock.nix
    ../../modules/mako.nix
  ];
}
