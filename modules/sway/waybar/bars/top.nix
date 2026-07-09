{ primaryOutput, scripts }:

let
  workspaces = import ../modules/workspaces.nix;
  windowcount = import ../modules/windowcount.nix;
  memory = import ../modules/memory.nix;
  cpu = import ../modules/cpu.nix;
  clock = import ../modules/clock.nix;
  network = import ../modules/network.nix { inherit scripts; };
  bluetooth = import ../modules/bluetooth.nix { inherit scripts; };
  backlight = import ../modules/backlight.nix { inherit scripts; };
  pulseaudio = import ../modules/pulseaudio.nix { inherit scripts; };
  wireplumber = import ../modules/wireplumber.nix { inherit scripts; };
  user = import ../modules/user.nix;
  dividers = import ../modules/dividers.nix;
  taskbar = import ../modules/taskbar.nix;
  tray = import ../modules/tray.nix;
in

workspaces
// windowcount
// memory
// cpu
// clock
// network
// bluetooth
// backlight
// pulseaudio
// wireplumber
// user
// dividers
// taskbar
// tray
// {
  layer = "top";
  output = [ primaryOutput ];
  height = 0;
  width = 0;
  margin = "0";
  spacing = "0";
  mode = "dock";
  reload_style_on_change = true;

  "modules-left" = [
    "sway/workspaces"
    "custom/right_div#1"
  ];

  "modules-right" = [
    "custom/left_div#1"
    "group/pulseaudio"
    "network"
    "bluetooth"
    "backlight"
    "clock#time"
  ];
}
