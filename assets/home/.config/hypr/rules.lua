-- rules.lua — window rules and per-surface layer rules.
--
-- Window rules: apps that must float. Firefox Picture-in-Picture
-- placement (monitor, position, size, float, pin) is owned by the AGS
-- window-orchestrator service, but PiP rounding lives here on a
-- dynamic-effect rule keyed on `float = true`. Verified against
-- Hyprland 0.55.4: dynamic effects re-evaluate every time a matched
-- property flips, so a manual `win+F` toggle or a tiler-driven re-tile
-- lands on the right radius without ags observing anything. Previous
-- rationale (that no code path emits `RULE_PROP_FLOATING`) was wrong
-- for this version.
--
-- Layer rules: per-namespace animation for AGS layer-shell surfaces —
-- this is the moment the whole config moved to Lua, since Hyprland 0.55
-- dropped the `.conf` `layerrule = animation …, name` form.

hl.window_rule({ match = { class = "nm-connection-editor" }, float = true })
hl.window_rule({ match = { class = ".blueman-manager-wrapped" }, float = true })
hl.window_rule({ match = { class = "org.pulseaudio.pavucontrol" }, float = true })
hl.window_rule({ match = { class = "Thunar", title = "^rename.*" }, float = true })
hl.window_rule({
	match = { class = "firefox", title = "Picture-in-Picture", float = true },
	rounding = 20,
})

-- Discord Flatpak briefly opens a "Discord Updater" splash window before
-- the main app materializes; hide it on a silent special workspace so it
-- never flashes on screen. The main window (title starts with "Discord")
-- is unaffected.
hl.window_rule({
	match = { class = "^com\\.discordapp\\.Discord$", title = "^Discord Updater$" },
	workspace = "special:_hidden silent",
})

-- ── AGS surfaces — physical motion per panel ─────────────────────────────
-- Two motion families:
--   Drawer — attached to an edge, slides in/out along that edge's normal.
--   HUD    — not attached to any edge, materializes in place with a fade.
--
-- Bar is a shelf: bolted to the top edge, never moves once it's there.
-- Alt-tab and runner are drawers pulled out from behind the bar — same
-- top region, same slide motion. Ws-viz is a projected HUD, transient
-- and unattached, so it fades in place.
--
-- The `layers` default in hyprland.lua is `fade`; only the drawers need
-- an explicit slide override.

hl.layer_rule({ match = { namespace = "^ags-bar$" }, no_anim = true })
hl.layer_rule({ match = { namespace = "^ags-window-menu$" }, animation = "slide" })
hl.layer_rule({ match = { namespace = "^ags-runner$" }, animation = "slide" })
hl.layer_rule({ match = { namespace = "^ags-ws-viz$" }, animation = "fade" })
