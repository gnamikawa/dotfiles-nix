# Workspace-switch animation is guaranteed only on the primary output

Hyprland's `speed` animation parameter is a fixed wall-clock duration in
deciseconds, identical regardless of a monitor's refresh rate. The shared
`workspaces` animation leaf (`hyprland.lua`) plays a 400ms slide that renders
into roughly 58 frames at 144Hz but only roughly 24 at ~60Hz — the same
motion compressed into far fewer frames reads as a jump-cut rather than a
slide. GEN-LPC's one monitor is always its primary output (CONTEXT.md) and
always ~60Hz, so this is visible on every workspace switch there. GEN-DPC
has a ~60Hz monitor too (`EX-LDGCQ241D`), but it is GEN-DPC's media output,
not its primary output, and out of the user's forefront of attention — its
choppiness is accepted.

Decision: disable the `workspaces` leaf entirely on GEN-LPC via a new
per-host `generated/hypr/animations.lua` slice; leave GEN-DPC's global
animation config untouched. Animation-smoothness guarantees apply only to a
host's primary output.

Considered and rejected:

- **Slow the animation down instead of disabling it.** A duration long
  enough to render smoothly at ~60Hz reads as sluggish on a 144Hz primary
  output; a fully static jump straight to the target workspace was judged
  preferable to a slowed-down slide.
- **A focus-tracking daemon** listening on Hyprland's socket2 IPC
  (`focusedmon`/`focusedmonv2`) to toggle the animation on/off as focus
  crosses between primary and media outputs. Would have handled GEN-DPC's
  media output precisely, but that case turned out to be out of scope
  (above), so the added process and its undocumented behavior around
  in-flight animations bought nothing.
- **A per-workspace `workspace_rule` override** for GEN-DPC's workspace 9
  (statically bound to its media output). Not possible: `workspace_rule`'s
  `animation` field overrides style only, not the `enabled` flag or `speed`
  (confirmed against the Hyprland wiki source; unlike `layer_rule`, there is
  no `no_anim` field).

Consequences: GEN-DPC's workspace 9 keeps its current slide animation,
unchanged. `hyprland.lua` `dofile`s the per-host `monitors.lua` slice before
its own `hl.animation` calls run, so a host override placed there would be
silently clobbered by the shared defaults — `animations.lua` is a new slice
sourced after them for this reason.
