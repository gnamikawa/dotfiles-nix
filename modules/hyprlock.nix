# hyprlock.nix — lock screen and idle daemon packages. Their configs are
# raw assets (assets/home/.config/hypr/{hyprlock,hypridle}.conf); the HM
# option modules are unused because they would write generated files into
# ~/.config/hypr/, which is a single out-of-store symlink to the asset tree.

{ pkgs, config, ... }:
{
  home.packages = [
    (config.lib.nixGL.wrap pkgs.hyprlock)
    pkgs.hypridle
  ];

  systemd.user.services.hypridle = {
    Unit = {
      Description = "Hyprland idle daemon";
      After = [ "graphical-session.target" ];
      PartOf = [ "graphical-session.target" ];
    };
    Service = {
      Type = "simple";
      ExecStart = "${pkgs.hypridle}/bin/hypridle";
      Restart = "on-failure";
    };
    Install.WantedBy = [ "graphical-session.target" ];
  };
}
