# hyprlock.nix — the legacy host-selected lock implementation. Hypridle is
# shared separately; this module supplies its stable `genzo-lock` command.

{ pkgs, config, ... }:

let
  hyprlock = config.lib.nixGL.wrap pkgs.hyprlock;
  lockCommand = pkgs.writeShellScriptBin "genzo-lock" ''
    exec ${hyprlock}/bin/hyprlock "$@"
  '';
in
{
  home.packages = [
    hyprlock
    lockCommand
  ];
}
