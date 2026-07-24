# waybar.nix — bar package, launch unit, and the generated entry config.
# Bar bodies, module definitions, CSS, and scripts are raw assets under
# assets/home/.config/waybar/ (ADR-0005). The entry config is generated
# because the bar *list* is host-varying (waybar's include mechanism can
# fill keys inside a bar object but cannot add or remove array elements),
# so hosts override it with their own bar array.

{
  config,
  lib,
  pkgs,
  ...
}:

let
  waybarPackage = config.lib.nixGL.wrap pkgs.waybar;
in
{
  programs.waybar = {
    enable = true;
    package = waybarPackage;
    # settings/style deliberately unset: they would generate files into
    # ~/.config/waybar, which is a single out-of-store symlink to the
    # asset tree.
  };

  # Standalone-profile fallback: hosts override with output-pinned arrays.
  # No "output" key means the bars appear on every display.
  xdg.configFile."generated/waybar/config.jsonc".text = lib.mkDefault (
    builtins.toJSON [
      {
        include = [
          "~/.config/waybar/bars/top.jsonc"
          "~/.config/waybar/modules.jsonc"
        ];
      }
      {
        include = [
          "~/.config/waybar/bars/bottom.jsonc"
          "~/.config/waybar/modules.jsonc"
        ];
      }
    ]
  );

  systemd.user.services.waybar = {
    Unit = {
      Description = "waybar";
      After = [ "graphical-session.target" ];
      PartOf = [ "graphical-session.target" ];
    };
    Service = {
      Type = "simple";
      ExecStart = "${waybarPackage}/bin/waybar -c %h/.config/generated/waybar/config.jsonc -s %h/.config/waybar/style.css";
      Restart = "on-failure";
    };
    Install.WantedBy = [ "graphical-session.target" ];
  };
}
