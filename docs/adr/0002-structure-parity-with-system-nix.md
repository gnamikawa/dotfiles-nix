# Structure parity with system-nix

This repository mirrors the project structure of its consumer, system-nix,
so that both repos answer "where does X live?" with the same rule. The twin
of this decision lives in system-nix as
`docs/adr/0002-structure-parity-with-dotfiles-nix.md`; a structural change
in either repository should be reflected in the other.

Shared conventions:

- `modules/` — flat, one concern per file, shared by all hosts, aggregated
  by `modules/default.nix` (which also holds the small top-level settings:
  stateVersion, identity).
- `modules/packages/` — install-only package bundles.
- `hosts/<NAME>/` — everything host-specific, one directory per machine,
  `default.nix` plus per-concern files. Host selection is by hostname and
  fails loudly for unknown hosts.
- `CONTEXT.md` — canonical glossary; `docs/adr/` — numbered decisions.

Deliberate deviations (dotfiles-nix only):

- `assets/` — out-of-store symlinked raw configs; no system-nix analogue.
- `constants/` — theme/palette data injected via `extraSpecialArgs`.
- `modules/sway/` — a module directory rather than a file, because it
  carries its waybar/theme asset tree.
- No `tests/` — system-nix's VM tests exercise the real host configurations
  including this flake (its ADR 0001), so guarantees are proven there.
