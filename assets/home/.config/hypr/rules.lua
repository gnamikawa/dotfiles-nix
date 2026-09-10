-- rules.lua — window rules and per-surface layer rules.
--
-- Window rules: apps that must float. Firefox Picture-in-Picture
-- placement (monitor, position, size, float, pin, and rounding) is
-- owned end-to-end by the AGS window-orchestrator service — there is
-- deliberately no static rule for it, so a single authority decides
-- them all. A declarative `rounding` rule scoped to `float = true` was
-- tried and rejected: Hyprland's rule engine only re-evaluates a rule
-- when a property in the rule's own match set fires `propertiesChanged`,
-- and no code path in Hyprland 0.55 emits `RULE_PROP_FLOATING`. Setting
-- rounding from ags on both branches of the swap keeps it in sync with
-- the visible state.
--
-- Layer rules: per-namespace animation for AGS layer-shell surfaces —
-- this is the moment the whole config moved to Lua, since Hyprland 0.55
-- dropped the `.conf` `layerrule = animation …, name` form.

hl.window_rule({ match = { class = "nm-connection-editor"       }, float = true })
hl.window_rule({ match = { class = ".blueman-manager-wrapped"   }, float = true })
hl.window_rule({ match = { class = "org.pulseaudio.pavucontrol" }, float = true })
hl.window_rule({ match = { class = "Thunar", title = "^rename.*" }, float = true })

-- Discord Flatpak briefly opens a "Discord Updater" splash window before
-- the main app materializes; hide it on a silent special workspace so it
-- never flashes on screen. The main window (title starts with "Discord")
-- is unaffected.
hl.window_rule({ match = { class = "^com\\.discordapp\\.Discord$", title = "^Discord Updater$" }, workspace = "special:_hidden silent" })

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

hl.layer_rule({ match = { namespace = "^ags-bar$"     }, no_anim   = true    })
hl.layer_rule({ match = { namespace = "^ags-window-menu$" }, animation = "slide" })
hl.layer_rule({ match = { namespace = "^ags-runner$"  }, animation = "slide" })
hl.layer_rule({ match = { namespace = "^ags-ws-viz$"  }, animation = "fade"  })
