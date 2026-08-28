-- rules.lua — window rules and per-surface layer rules.
--
-- Window rules: apps that must float. Firefox PiP is pinned across
-- workspaces and parked top-right of the primary output.
--
-- Layer rules: per-namespace animation for AGS layer-shell surfaces —
-- this is the moment the whole config moved to Lua, since Hyprland 0.55
-- dropped the `.conf` `layerrule = animation …, name` form.

hl.window_rule({ match = { class = "nm-connection-editor"       }, float = true })
hl.window_rule({ match = { class = ".blueman-manager-wrapped"   }, float = true })
hl.window_rule({ match = { class = "org.pulseaudio.pavucontrol" }, float = true })
hl.window_rule({ match = { class = "Thunar", title = "^rename.*" }, float = true })

-- Firefox Picture-in-Picture: parked top-right of the primary output,
-- visible on every workspace (sway: sticky enable).
hl.window_rule({ match = { class = "firefox", title = "Picture-in-Picture" }, float = true                  })
hl.window_rule({ match = { class = "firefox", title = "Picture-in-Picture" }, size  = "426 240"             })
hl.window_rule({ match = { class = "firefox", title = "Picture-in-Picture" }, move  = "1462 0"              })
hl.window_rule({ match = { class = "firefox", title = "Picture-in-Picture" }, pin   = true                  })
