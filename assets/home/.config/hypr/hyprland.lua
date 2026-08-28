-- hyprland.lua — config body (raw asset, live-editable; ADR-0005).
--
-- Hyprland 0.55 dropped the `.conf` `layerrule = animation …, name` form —
-- per-surface layer animations now live only in the Lua config, which is
-- why the compositor's whole configuration was ported over. Everything the
-- generated slices need a rebuild for is behind the three `dofile` lines
-- below; everything else in this tree is save + `hyprctl reload`.
--
-- Sub-files:
--   ~/.config/generated/hypr/theme.lua     — palette locals (host-agnostic)
--   ~/.config/generated/hypr/monitors.lua  — per-host outputs + tablet map
--   ~/.config/generated/hypr/env.lua       — per-host env vars + cursor knobs
--   ~/.config/hypr/binds.lua               — keybindings
--   ~/.config/hypr/rules.lua               — window + layer rules

local home = os.getenv("HOME")

-- The theme file sets globals (borderActive, borderDefault, slurp*) that
-- hyprland.lua and binds.lua read below.
dofile(home .. "/.config/generated/hypr/theme.lua")
dofile(home .. "/.config/generated/hypr/monitors.lua")
dofile(home .. "/.config/generated/hypr/env.lua")

dofile(home .. "/.config/hypr/binds.lua")
dofile(home .. "/.config/hypr/rules.lua")

hl.config({
    debug = {
        disable_logs = false,
    },

    -- ── General ──────────────────────────────────────────────────────────
    general = {
        border_size = 1,
        -- sway `gaps inner 20` measured between windows; Hyprland gaps_in is
        -- per-edge, so 10 reproduces the same 20px spacing.
        gaps_in  = 10,
        gaps_out = 20,

        col = {
            active_border   = borderActive,
            inactive_border = borderDefault,
        },

        layout = "monocle",
    },

    -- ── Input ────────────────────────────────────────────────────────────
    input = {
        -- sway: focus_follows_mouse no
        follow_mouse = 0,
    },

    -- ── Misc ─────────────────────────────────────────────────────────────
    misc = {
        disable_hyprland_logo   = true,
        force_default_wallpaper = 0,
    },

    -- ── Animations ───────────────────────────────────────────────────────
    -- Contextual motion for focus changes. The directions are chosen so the
    -- transition itself carries the story: sliding workspaces tell you which
    -- way you came from, layer surfaces slide in from whichever edge they
    -- anchor to so their entry direction is legible, and the border colour
    -- eases across the focus swap instead of snapping. Per-surface layer
    -- overrides live in rules.lua via `hl.layer_rule` — they can't be
    -- expressed in `hyprland.conf`, which is why this file is Lua.
    animations = {
        enabled = true,
    },
})

hl.curve("ease", { type = "bezier", points = { {0.16, 1}, {0.3, 1} } })

hl.animation({ leaf = "windows",    enabled = true, speed = 3, bezier = "ease", style = "popin 80%" })
hl.animation({ leaf = "workspaces", enabled = true, speed = 4, bezier = "ease", style = "slide"      })
hl.animation({ leaf = "layers",     enabled = true, speed = 3, bezier = "ease", style = "slide"      })
hl.animation({ leaf = "border",     enabled = true, speed = 6, bezier = "ease"                       })
hl.animation({ leaf = "fade",       enabled = true, speed = 3, bezier = "ease"                       })

-- Parity notes vs. the retired sway config:
-- - sway's urgent indicator color has no Hyprland equivalent; dropped.
-- - `default_orientation horizontal` has no exact dwindle equivalent;
--   dwindle's aspect-based default is close enough on landscape outputs.
-- - dbus-update-activation-environment and `workspace 1` at login are
--   handled by uwsm / Hyprland's own startup respectively.
