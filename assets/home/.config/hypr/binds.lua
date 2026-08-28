-- binds.lua — keybindings (raw asset, live-editable).
--
-- Reads the theme globals set in ~/.config/generated/hypr/theme.lua so the
-- screenshot bind can inline the slurp colours.

local mod = "ALT"
local win = "SUPER"

-- ── Applications ─────────────────────────────────────────────────────────
hl.bind(mod .. " + R",         hl.dsp.exec_cmd("ranger"))
hl.bind(mod .. " + F4",        hl.dsp.window.close())
hl.bind(mod .. " + F3",        hl.dsp.exec_cmd("ags request runner-open"))
hl.bind(win .. " + F",         hl.dsp.window.float({ action = "toggle" }))
hl.bind(win .. " + T",         hl.dsp.exec_cmd("kitty -e bash -lc yazi"))
hl.bind(win .. " + B",         hl.dsp.exec_cmd(os.getenv("BROWSER") or "xdg-open about:blank"))
hl.bind(win .. " + SPACE",     hl.dsp.exec_cmd("fcitx5-remote -t"))

-- ── System menu (Alt+Shift hold) ─────────────────────────────────────────
-- Holding Alt+Shift shades the whole screen and pops the AGS system menu
-- (components/SystemMenu.tsx). Each row's chord stands on its own bind
-- below so the action fires whether or not the menu is currently up —
-- the menu is a legend, not a gate.
--
-- The open/close pattern mirrors the alt-tab peek: the modifier state at
-- press excludes the key being pressed, so ADD-Shift-while-Alt-held is
-- `ALT + Shift_L`, and ADD-Alt-while-Shift-held is `SHIFT + Alt_L`. At
-- release the released key still contributes to the mask, so the release
-- pattern is the full `ALT + SHIFT + <key>`.
hl.bind(mod .. " + Shift_L", hl.dsp.exec_cmd("ags request system-menu-open"))
hl.bind(mod .. " + Shift_R", hl.dsp.exec_cmd("ags request system-menu-open"))
hl.bind("SHIFT + Alt_L",     hl.dsp.exec_cmd("ags request system-menu-open"))
hl.bind("SHIFT + Alt_R",     hl.dsp.exec_cmd("ags request system-menu-open"))
hl.bind(mod .. " + SHIFT + Shift_L", hl.dsp.exec_cmd("ags request system-menu-close"), { release = true, transparent = true })
hl.bind(mod .. " + SHIFT + Shift_R", hl.dsp.exec_cmd("ags request system-menu-close"), { release = true, transparent = true })
hl.bind(mod .. " + SHIFT + Alt_L",   hl.dsp.exec_cmd("ags request system-menu-close"), { release = true, transparent = true })
hl.bind(mod .. " + SHIFT + Alt_R",   hl.dsp.exec_cmd("ags request system-menu-close"), { release = true, transparent = true })

-- Verbs listed in the menu. Kept in the same order as common/system-menu.ts
-- VERBS so the labels and chords stay in lockstep.
hl.bind(mod .. " + SHIFT + R",  hl.dsp.exec_cmd("systemctl restart --user ags.service"))
hl.bind(mod .. " + SHIFT + E",  hl.dsp.exec_cmd("hyprctl dispatch exit"))
hl.bind(mod .. " + SHIFT + W",  hl.dsp.exec_cmd("loginctl lock-session"))
hl.bind(mod .. " + SHIFT + F1",  hl.dsp.exec_cmd("bash -lc 'nmcli radio wifi off && sleep 0.5 && nmcli radio wifi on'"))
hl.bind(mod .. " + SHIFT + F2",  hl.dsp.exec_cmd("bash -lc 'rfkill block bluetooth && sleep 0.5 && rfkill unblock bluetooth'"))
hl.bind(mod .. " + SHIFT + F11", hl.dsp.exec_cmd("systemctl hibernate"))
hl.bind(mod .. " + SHIFT + F12", hl.dsp.exec_cmd("systemctl poweroff"))

-- ── Screenshots ──────────────────────────────────────────────────────────
hl.bind("CTRL + SHIFT + 2", hl.dsp.exec_cmd("grimblast copy output"))
hl.bind("CTRL + SHIFT + 3", hl.dsp.exec_cmd("grimblast copy active"))
hl.bind("CTRL + SHIFT + 4", hl.dsp.exec_cmd(
    'SLURP_ARGS="-b' .. slurpBackground ..
    ' -c' .. slurpBorder ..
    ' -s' .. slurpSelection ..
    ' -w1" grimblast copy area'
))

-- ── Audio ────────────────────────────────────────────────────────────────
hl.bind("XF86AudioRaiseVolume", hl.dsp.exec_cmd("pactl set-sink-volume @DEFAULT_SINK@ +5%"))
hl.bind("XF86AudioLowerVolume", hl.dsp.exec_cmd("pactl set-sink-volume @DEFAULT_SINK@ -5%"))
hl.bind("XF86AudioMute",        hl.dsp.exec_cmd("pactl set-sink-mute @DEFAULT_SINK@ toggle"))

-- ── Workspace layout ─────────────────────────────────────────────────
hl.bind(mod .. " + GRAVE", hl.dsp.exec_cmd(os.getenv("HOME") .. "/.config/hypr/scripts/toggle-workspace-layout.sh"))

-- ── Workspace focus ──────────────────────────────────────────────────────
for i = 1, 9 do
    hl.bind(mod .. " + " .. i, hl.dsp.focus({ workspace = i }))
end

-- ── Window focus (vim) ───────────────────────────────────────────────────
hl.bind(mod .. " + H",         hl.dsp.focus({ direction = "left"  }))
hl.bind(mod .. " + J",         hl.dsp.focus({ direction = "down"  }))
hl.bind(mod .. " + K",         hl.dsp.focus({ direction = "up"    }))
hl.bind(mod .. " + L",         hl.dsp.focus({ direction = "right" }))
-- Cycle through the alt-tab overlay's list in its exact display order.
-- `layoutmsg cyclenext` walks the layout tree, which doesn't match what the
-- overlay renders — see common/alt-tab.ts for the shared sort.
hl.bind(mod .. " + TAB",         hl.dsp.exec_cmd("ags request alt-tab-next"))
hl.bind(mod .. " + SHIFT + TAB", hl.dsp.exec_cmd("ags request alt-tab-prev"))

-- ── Alt-hold alt-tab overlay ─────────────────────────────────────────────
-- Pressing Alt alone pops the AGS alt-tab overlay (the current workspace's
-- clients); releasing Alt closes it.
--
-- On release, Hyprland reports the modifier state at the moment of the
-- release event — Alt is still held at that instant, which is why the
-- release bind needs the ALT modifier in the pattern (bare-modifier
-- release-only binds don't fire in this Hyprland build). Both Alt_L and
-- Alt_R are covered so either physical Alt key closes it.
hl.bind("Alt_L", hl.dsp.exec_cmd("ags request alt-tab-open"))
hl.bind("Alt_R", hl.dsp.exec_cmd("ags request alt-tab-open"))
hl.bind(mod .. " + Alt_L", hl.dsp.exec_cmd("ags request alt-tab-close"), { release = true, transparent = true })
hl.bind(mod .. " + Alt_R", hl.dsp.exec_cmd("ags request alt-tab-close"), { release = true, transparent = true })

-- ── Window move (vim) ────────────────────────────────────────────────────
hl.bind(mod .. " + SHIFT + H", hl.dsp.window.move({ direction = "l" }))
hl.bind(mod .. " + SHIFT + J", hl.dsp.window.move({ direction = "d" }))
hl.bind(mod .. " + SHIFT + K", hl.dsp.window.move({ direction = "u" }))
hl.bind(mod .. " + SHIFT + L", hl.dsp.window.move({ direction = "r" }))

-- ── Move window to workspace (stay put, like sway's move) ────────────────
for i = 1, 9 do
    hl.bind(win .. " + " .. i, hl.dsp.window.move({ workspace = i, silent = true }))
end

-- ── Move workspace to output ─────────────────────────────────────────────
hl.bind(win .. " + H", hl.dsp.workspace.move({ monitor = "l" }))
hl.bind(win .. " + J", hl.dsp.workspace.move({ monitor = "d" }))
hl.bind(win .. " + K", hl.dsp.workspace.move({ monitor = "u" }))
hl.bind(win .. " + L", hl.dsp.workspace.move({ monitor = "r" }))

-- ── Resize (1 px steps) ──────────────────────────────────────────────────
hl.bind(win .. " + UP",    hl.dsp.window.resize({ x = 0,  y = 1  }))
hl.bind(win .. " + DOWN",  hl.dsp.window.resize({ x = 0,  y = -1 }))
hl.bind(win .. " + RIGHT", hl.dsp.window.resize({ x = 1,  y = 0  }))
hl.bind(win .. " + LEFT",  hl.dsp.window.resize({ x = -1, y = 0  }))

-- ── Splits (nearest dwindle equivalent of sway's split h/v) ──────────────
hl.bind(win .. " + PLUS",  hl.dsp.layout("preselect r"))
hl.bind(win .. " + MINUS", hl.dsp.layout("preselect d"))

-- ── Floating drag (sway floating_modifier) ───────────────────────────────
hl.bind(win .. " + mouse:272", hl.dsp.window.drag(),   { mouse = true })
hl.bind(win .. " + mouse:273", hl.dsp.window.resize(), { mouse = true })
