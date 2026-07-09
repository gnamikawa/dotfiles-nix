# sway-laptop.nix — GEN-LPC specific sway configuration

{ ... }:

{
  wayland.windowManager.sway.config = {

    output = {
      "eDP-1" = {
        mode = "2560x1440@59.998Hz";
        scale = "1.5";
        position = "0,0";
      };
    };

    # Permanently disable the Synaptics touchpad.
    input = {
      "1739:0:Synaptics_TM3289-002" = {
        events = "disabled";
      };
    };

  };
}
