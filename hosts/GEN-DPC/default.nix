{ ... }:
{
  imports = [
    # This host's computed slices.
    ./hyprland-outputs.nix
    ./waybar.nix

    # Shell surfaces this host runs (issue #43). Spelled as paths into
    # modules/ because ./waybar.nix above is this host's bar array, not the
    # waybar module. waybar goes when the AGS bar replaces it (#34); mako goes
    # with the AGS notification surface.
    ../../modules/ags.nix
    ../../modules/mako.nix
    ../../modules/waybar.nix
  ];
}
