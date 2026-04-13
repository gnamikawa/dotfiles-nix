{ primaryOutput, scripts }:

let
  cpu = import ../modules/cpu.nix;
  memory = import ../modules/memory.nix;
  idle_inhibitor = import ../modules/idle_inhibitor.nix;
  power_menu = import ../modules/power_menu.nix { inherit scripts; };
  dividers = import ../modules/dividers.nix;
  tray = import ../modules/tray.nix;
in

cpu
// memory
// idle_inhibitor
// power_menu
// dividers
// tray
// {
  layer = "top";
  position = "bottom";
  output = [ primaryOutput ];
  spacing = "0";

  "modules-right" = [
    "custom/left_div#1"
    "tray"
    "cpu"
    "memory"
    "idle_inhibitor"
    "custom/power_menu"
  ];
}
