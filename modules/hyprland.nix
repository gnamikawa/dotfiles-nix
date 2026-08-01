# hyprland.nix — compositor package and computed slices; the config body
# lives in assets/home/.config/hypr/ (ADR-0005, ADR-0007).

{
  pkgs,
  config,
  lib,
  constants,
  ...
}:

let
  # Hyprland colors are rgb(RRGGBB) without the leading '#'.
  rgb = color: "rgb(${lib.removePrefix "#" color})";
in
{
  home.packages = [ (config.lib.nixGL.wrap pkgs.hyprland) ];

  # Theme colors from constants — the palette variables the raw config
  # references (hyprland.conf: col.active_border = $borderActive, …).
  xdg.configFile."generated/hypr/theme.conf".text = ''
    $borderActive = ${rgb constants.theme.dark.border.active.gray}
    $borderDefault = ${rgb constants.theme.dark.border.default.gray}

    $lockFont = ${rgb constants.theme.dark.text.primary.gray}
    $lockInner = ${rgb constants.theme.dark.componentBackground.active.gray}
    $lockOuter = ${rgb constants.theme.dark.background.default}

    # Hyprland treats a single # as a comment marker, including inside exec
    # arguments. The doubled spelling emits a literal # for slurp.
    $slurpBackground = ##${lib.removePrefix "#" constants.palette.black}00
    $slurpBorder = ##${lib.removePrefix "#" constants.palette.white}ff
    $slurpSelection = ##${lib.removePrefix "#" constants.theme.dark.border.active.blue}55
  '';

  # Host slices — hosts/<NAME>/hyprland-outputs.nix overrides both. The
  # empty defaults keep the raw config's `source` lines resolvable on a
  # standalone profile with no host directory.
  xdg.configFile."generated/hypr/monitors.conf".text = lib.mkDefault "";
  xdg.configFile."generated/hypr/env.conf".text = lib.mkDefault "";
}
