# hyprland.nix — compositor package and computed slices; the config body
# lives in assets/home/.config/hypr/ (ADR-0005, ADR-0007).
#
# Hyprland 0.55 moved per-namespace layer animations to Lua-only, so the
# compositor's own config is a set of `.lua` slices `dofile`'d from
# hyprland.lua. Hyprlock still parses `.conf`, so its lock colours land in
# a separate `hyprlock-theme.conf` slice sourced from hyprlock.conf.

{
  pkgs,
  config,
  lib,
  constants,
  ...
}:

let
  # Hyprland colors are rgb(RRGGBB) without the leading '#'; the Lua strings
  # keep that same literal so borderActive / borderDefault drop straight into
  # `hl.config({ general = { col = { active_border = borderActive, … } } })`.
  rgb = color: "rgb(${lib.removePrefix "#" color})";
in
{
  home.packages = [ (config.lib.nixGL.wrap pkgs.hyprland) ];

  # Theme globals for hyprland.lua and binds.lua (Lua). The three lock
  # colours live in a companion `.conf` slice below, since hyprlock hasn't
  # moved to Lua.
  xdg.configFile."generated/hypr/theme.lua".text = ''
    borderActive    = "${rgb constants.theme.dark.border.active.gray}"
    borderDefault   = "${rgb constants.theme.dark.border.default.gray}"

    slurpBackground = "#${lib.removePrefix "#" constants.palette.black}00"
    slurpBorder     = "#${lib.removePrefix "#" constants.palette.white}ff"
    slurpSelection  = "#${lib.removePrefix "#" constants.theme.dark.border.active.blue}55"
  '';

  # Hyprlock still parses .conf and hyprlock.conf sources this file for
  # $lockFont / $lockInner / $lockOuter.
  xdg.configFile."generated/hypr/hyprlock-theme.conf".text = ''
    $lockFont  = ${rgb constants.theme.dark.text.primary.gray}
    $lockInner = ${rgb constants.theme.dark.componentBackground.active.gray}
    $lockOuter = ${rgb constants.theme.dark.background.default}
  '';

  # Host slices — hosts/<NAME>/hyprland-outputs.nix overrides both. The
  # empty defaults keep hyprland.lua's `dofile` calls resolvable on a
  # standalone profile with no host directory.
  xdg.configFile."generated/hypr/monitors.lua".text = lib.mkDefault "";
  xdg.configFile."generated/hypr/env.lua".text = lib.mkDefault "";
}
