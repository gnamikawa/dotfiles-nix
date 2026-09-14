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
  # shared with every host via binds.lua; these five are specific to this
  # laptop's hardware — a desktop has no backlight, no external-display Fn
  # key, and no airplane-mode or Bluetooth Fn key.
  #
  # F9 (gear), F11 (keyboard — this unit has no keyboard backlight), and F12
  # (star/"Favorites", a blank user-programmable slot) are skipped: they
  # don't send usable input events on this keyboard generation without a
  # udev hwdb remap, which is system-level config outside this repo.
  # `locked = true` (F4-F6) matches Hyprland's own shipped reference config
  # for these exact hardware keys — they work from the lock screen. F8/F10
  # get the same treatment for consistency; `repeating` is omitted there
  # since a held toggle key re-flipping state on every key-repeat tick isn't
  # useful the way a held volume/brightness ramp is.
  xdg.configFile."generated/hypr/binds-host.lua".text = ''
    -- F4: mic mute. Same "read back, forward verbatim to the OSD" shape as
    -- binds.lua's audio binds — app.tsx's "osd-mic" case just checks for
    -- "MUTED" in the line, ignoring the volume number.
    hl.bind(
    	"XF86AudioMicMute",
    	hl.dsp.exec_cmd(
    		"bash -lc 'wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle; ags request osd-mic \"$(wpctl get-volume @DEFAULT_AUDIO_SOURCE@)\"'"
    	),
    	{ locked = true, repeating = true }
    )

    -- F5/F6: brightness. -e4 perceptually linearizes the percentage steps;
    -- -n2 floors brightness above zero so the screen never goes pitch black.
    -- `brightnessctl -m i` after the change is machine-readable
    -- "device,class,current,percent%,max" — app.tsx's "osd-brightness" case
    -- reads the percent field back out of it.
    hl.bind(
    	"XF86MonBrightnessDown",
    	hl.dsp.exec_cmd(
    		"bash -lc 'brightnessctl -e4 -n2 set 5%-; ags request osd-brightness \"$(brightnessctl -m i)\"'"
    	),
    	{ locked = true, repeating = true }
    )
    hl.bind(
    	"XF86MonBrightnessUp",
    	hl.dsp.exec_cmd(
    		"bash -lc 'brightnessctl -e4 -n2 set 5%+; ags request osd-brightness \"$(brightnessctl -m i)\"'"
    	),
    	{ locked = true, repeating = true }
    )

    -- F7 (external display / project): toggle the external monitor between
    -- extended and mirrored. No-ops if nothing is plugged in; only considers
    -- the first non-eDP-1 output, since this host has no multi-external-
    -- monitor dock scenario today.
    --
    -- Field names are HL.MonitorSpec's `mirror` (setter, a string: a
    -- monitor name to mirror, or "none") — confirmed from the Lua API's own
    -- type stub, share/hypr/stubs/hl.meta.lua, shipped in the Hyprland
    -- package itself. Both branches fully specify mode/position/scale
    -- rather than setting only `mirror` — real Hyprland monitor rules
    -- aren't incremental (each one fully replaces the prior rule for that
    -- output).
    --
    -- The actual bug (diagnosed live against real hardware, isolating
    -- hl.get_monitors() via a scratch instrumented bind): once a monitor is
    -- mirroring, `hl.get_monitors()` stops listing it at all — same
    -- behavior as `hyprctl monitors` (without `all`) excluding mirrored
    -- outputs. So the mirror→extend branch's own lookup loop could never
    -- find the monitor it needed to un-mirror, and silently no-op'd every
    -- time. Fixed by remembering the monitor's name locally the one time
    -- it's discoverable (while extended, before it starts mirroring) and
    -- reusing that name to un-mirror it later, instead of re-discovering it
    -- via hl.get_monitors() on every call. `externalDisplayMirrored` still
    -- tracks direction in a local rather than reading state back from the
    -- API, same reasoning and same pattern as `workspaceLayouts` above in
    -- binds.lua (HL.Workspace doesn't expose a reliably-fresh tiledLayout
    -- either). This does mean a monitor unplug/replug or an external change
    -- via `hyprctl` directly can desync this from reality; acceptable for a
    -- single-external-monitor best effort.
    --
    -- Two earlier "fixes" here (a 400ms debounce guard against a suspected
    -- hardware double-fire, and reading `external.is_mirror` back to detect
    -- state) were both disproven by the same instrumentation: a single
    -- physical press reliably fires the bind exactly once, and local state
    -- persists correctly across separate presses. Removed rather than left
    -- in as speculative defense against problems that don't exist.
    local externalDisplayName = nil
    local externalDisplayMirrored = false
    local function toggleExternalDisplay()
    	if not externalDisplayMirrored then
    		local external = nil
    		for _, monitor in ipairs(hl.get_monitors()) do
    			if monitor.name ~= "eDP-1" then
    				external = monitor
    				break
    			end
    		end
    		if not external then
    			return
    		end
    		externalDisplayName = external.name
    		externalDisplayMirrored = true
    		hl.monitor({
    			output = externalDisplayName,
    			mode = "preferred",
    			position = "auto",
    			scale = "auto",
    			mirror = "eDP-1",
    		})
    	else
    		if not externalDisplayName then
    			return
    		end
    		externalDisplayMirrored = false
    		hl.monitor({
    			output = externalDisplayName,
    			mode = "preferred",
    			position = "auto-right",
    			scale = "auto",
    			mirror = "none",
    		})
    	end
    end
    hl.bind("XF86Display", toggleExternalDisplay, { locked = true })

    -- F8 (radio tower, slashed): toggle Wi-Fi and Bluetooth together. Both
    -- branches already know the resulting state, so the OSD gets a plain
    -- 0/1 rather than needing to re-query anything (app.tsx's "osd-radio").
    hl.bind(
    	"XF86RFKill",
    	hl.dsp.exec_cmd(
    		"bash -lc 'if nmcli radio wifi | grep -q enabled; then nmcli radio wifi off; rfkill block bluetooth; ags request osd-radio 0; else nmcli radio wifi on; rfkill unblock bluetooth; ags request osd-radio 1; fi'"
    	),
    	{ locked = true }
    )

    -- F10 (bluetooth symbol): Bluetooth only, independent of F8. Same 0/1
    -- shape as F8 (app.tsx's "osd-bluetooth").
    hl.bind(
    	"XF86Bluetooth",
    	hl.dsp.exec_cmd(
    		"bash -lc 'if rfkill list bluetooth | grep -q \"Soft blocked: yes\"; then rfkill unblock bluetooth; ags request osd-bluetooth 1; else rfkill block bluetooth; ags request osd-bluetooth 0; fi'"
    	),
    	{ locked = true }
    )
  '';
}
