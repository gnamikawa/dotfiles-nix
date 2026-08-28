# GEN-LPC hyprland outputs — built-in display and touchpad.

{ ... }:

{
  xdg.configFile."generated/hypr/monitors.lua".text = ''
    hl.monitor({ output = "eDP-1", mode = "2560x1440@59.998", position = "0x0", scale = 1.5 })

    -- Permanently disable the Synaptics touchpad. Device name to be
    -- confirmed against `hyprctl devices` during cutover verification.
    hl.device({ name = "synaptics-tm3289-002", enabled = false })
  '';
}
