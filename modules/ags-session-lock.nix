# ags-session-lock.nix — the production host-selected lock implementation.
# The user service is deliberately on-demand and has no restart policy:
# process death remains fail-closed until the operator follows the TTY runbook.

{
  config,
  pkgs,
  sessionLock,
  ...
}:

let
  # Wrap only after the complete lock package has been constructed. NixOS
  # leaves it unchanged; standalone desktop profiles gain their GL closure.
  sessionLockPackage = config.lib.nixGL.wrap sessionLock;
  lockCommand = pkgs.writeShellScriptBin "genzo-lock" ''
    exec ${pkgs.systemd}/bin/systemctl --user start genzo-session-lock.service
  '';
in
{
  home.packages = [
    lockCommand
  ];

  systemd.user.services.genzo-session-lock = {
    Unit = {
      Description = "Geist-styled AGS session lock";
      After = [ "graphical-session.target" ];
      PartOf = [ "graphical-session.target" ];
    };
    Service = {
      Type = "exec";
      ExecStart = "${sessionLockPackage}/bin/genzo-session-lock";
      Restart = "no";
    };
  };
}
