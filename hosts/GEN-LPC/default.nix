{ ... }:
{
  imports = [
    # This host's computed slices.
    ./hyprland-outputs.nix
    ./waybar.nix

    # Shell surfaces this host runs (issue #43). Spelled as paths into
    # modules/ because ./waybar.nix above is this host's bar array, not the
    # waybar module. This host keeps waybar until its own migration; ags is
    # here only because ags runs on both hosts today and renders nothing yet.
    ../../modules/ags.nix
    ../../modules/mako.nix
    ../../modules/waybar.nix
  ];
}
