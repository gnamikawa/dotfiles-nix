# GEN-LPC hyprland outputs — built-in display and touchpad.

{ ... }:

{
  xdg.configFile."generated/hypr/monitors.lua".text = ''
    hl.monitor({ output = "eDP-1", mode = "2560x1440@59.99800", position = "0x0", scale = 1 })

    -- Permanently disable the Synaptics touchpad. Device name to be
    -- confirmed against `hyprctl devices` during cutover verification.
    hl.device({ name = "synaptics-tm3289-002", enabled = false })
  '';

  # eDP-1 is this host's only monitor, so it is always the primary monitor
  # (CONTEXT.md) and always ~60Hz. The shared "workspaces" slide (hyprland.lua)
  # assumes a fixed animation duration renders into enough frames to read as
  # smooth; at ~60Hz it doesn't, and reads as a jump-cut instead (ADR-0012).
  xdg.configFile."generated/hypr/animations.lua".text = ''
    hl.animation({ leaf = "workspaces", enabled = false })
  '';
}
