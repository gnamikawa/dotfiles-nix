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

  # Fn-row binds matching this host's physical keyboard (ThinkPad X1 Carbon
  # Gen 5). XF86AudioMute/Raise/LowerVolume (F1-F3) are generic keysyms
  # shared with every host via binds.lua; these four are specific to this
  # laptop's hardware — a desktop has no backlight, and no other host's
  # keyboard has an airplane-mode or Bluetooth Fn key.
  #
  # F9 (gear), F11 (keyboard — this unit has no keyboard backlight), and F12
  # (star/"Favorites", a blank user-programmable slot) are skipped: they
  # don't send usable input events on this keyboard generation without a
  # udev hwdb remap, which is system-level config outside this repo.
  xdg.configFile."generated/hypr/binds-host.lua".text = ''
    -- F4: mic mute
    hl.bind("XF86AudioMicMute", hl.dsp.exec_cmd("wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle"))

    -- F5/F6: brightness
    hl.bind("XF86MonBrightnessDown", hl.dsp.exec_cmd("brightnessctl set 5%-"))
    hl.bind("XF86MonBrightnessUp", hl.dsp.exec_cmd("brightnessctl set 5%+"))

    -- F8 (radio tower, slashed): toggle Wi-Fi and Bluetooth together.
    hl.bind(
    	"XF86RFKill",
    	hl.dsp.exec_cmd(
    		"bash -lc 'if nmcli radio wifi | grep -q enabled; then nmcli radio wifi off; rfkill block bluetooth; else nmcli radio wifi on; rfkill unblock bluetooth; fi'"
    	)
    )

    -- F10 (bluetooth symbol): Bluetooth only, independent of F8.
    hl.bind(
    	"XF86Bluetooth",
    	hl.dsp.exec_cmd(
    		"bash -lc 'if rfkill list bluetooth | grep -q \"Soft blocked: yes\"; then rfkill unblock bluetooth; else rfkill block bluetooth; fi'"
    	)
    )
  '';
}
