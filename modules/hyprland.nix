# hyprland.nix — compositor package and computed slices; the config body
# lives in assets/home/.config/hypr/ (ADR-0005, ADR-0007).
#
# Hyprland 0.55 moved per-namespace layer animations to Lua-only, so the
# compositor's own config is a set of `.lua` slices `dofile`'d from
# hyprland.lua.

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

  # Theme globals for hyprland.lua and binds.lua (Lua).
  xdg.configFile."generated/hypr/theme.lua".text = ''
    borderActive    = "${rgb constants.theme.dark.border.active.gray}"
    borderDefault   = "${rgb constants.theme.dark.border.default.gray}"

    slurpBackground = "#${lib.removePrefix "#" constants.palette.black}00"
    slurpBorder     = "#${lib.removePrefix "#" constants.palette.white}ff"
    slurpSelection  = "#${lib.removePrefix "#" constants.theme.dark.border.active.blue}55"
  '';

  # Host slices — hosts/<NAME>/hyprland-outputs.nix overrides any of the
  # three. The empty defaults keep hyprland.lua's `dofile` calls resolvable
  # on a standalone profile with no host directory.
  xdg.configFile."generated/hypr/monitors.lua".text = lib.mkDefault "";
  xdg.configFile."generated/hypr/env.lua".text = lib.mkDefault "";
  # Sourced after hyprland.lua's own hl.animation calls (see that file) so a
  # host can override a leaf without being clobbered by the shared defaults.
  xdg.configFile."generated/hypr/animations.lua".text = lib.mkDefault "";
}
