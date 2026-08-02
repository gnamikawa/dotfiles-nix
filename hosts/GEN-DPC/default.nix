{ ... }:
{
  imports = [
    # This host's computed slices.
    ./hyprland-outputs.nix

    # Shell surfaces this host runs (issue #43). Spelled as paths into
    # modules/. Mako stays until the AGS notification surface replaces it;
    # waybar has already been replaced by the AGS bar on this host (#34).
    ../../modules/ags.nix
    ../../modules/ags-session-lock.nix
    ../../modules/mako.nix
  ];
}
