# Assets by default, Nix only for computed slices

Raw files under `assets/` are the default home for all configuration; a
config earns Nix management only where it needs a power raw files lack —
injected values (constants), store-path references, or host/profile
branching — and then only as a **computed slice**: the minimal generated
portion, joined to its asset through the application's own include
mechanism (sway `include`, waybar `"include"`, CSS `@import`).

Why this shape:

- Editability is the dominant cost. Assets are symlinked out-of-store, so
  the edit→observe loop is seconds (save, reload); Nix-managed config
  puts a full rebuild between every tweak. Almost every config here is
  hand-tuned at some point, so live editability must be the default, not
  the escape hatch.
- The repo already ran the experiment in the other direction. Commit
  `ed82a30` converted ~2000 lines of static sway/waybar assets into
  ~1600 lines of Nix to fix one real limitation: host branching (the
  static `top.jsonc` hardcoded the desktop's `"output": ["DP-3"]`, wrong
  on the laptop, plus a bar that should exist only on multi-display
  hosts). The host-varying slice was ~10 lines; everything else — ~30
  waybar module fragments, 8 CSS files, the sway config body — was
  re-encoded for zero expressiveness gain and became rebuild-gated churn.
  A rationale admits only the slice that needs it, never the whole config.
- Rejected: full Nix management via home-manager option modules. Its
  eval-time validation is real but mislocated for interactively tuned
  config — errors are cheapest at the app's own reload, inside the same
  fast loop the tuning uses. Also rejected: keeping the old strict asset
  definition ("only for programs that rewrite their own config"), which
  made assets the exception and rebuild-gating the default, inverting the
  actual cost structure.

Consequences: the sway/waybar tree under `modules/sway/` is on the wrong
side of this line and is expected to migrate back to assets plus computed
slices (theme colors from `constants`, per-host output names) — per
ADR-0007, that migration happens once, in Hyprland syntax: the sway tree
is retired, not converted. Raw config
errors surface at application reload rather than `nix flake check`;
host-specific content inside raw assets must go through a computed slice
or per-host asset files, never by branching the asset itself.
