# hypridle.nix — shared idle and pre-suspend policy. Each host selects one
# locker module that supplies the stable `genzo-lock` command used by the raw
# config at assets/home/.config/hypr/hypridle.conf.

{ pkgs, ... }:
{
  home.packages = [ pkgs.hypridle ];

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
