# Domain documentation

This project spans two repositories with a fixed dependency direction.
`dotfiles-nix` produces the user environment and can be deployed directly on
non-NixOS systems. `system-nix` is the NixOS entrypoint and consumes
`dotfiles-nix`.

Each repository owns its own domain documentation:

- `dotfiles-nix` uses `CONTEXT.md` and `docs/adr/` in this repository.
- `system-nix` uses `CONTEXT.md` and `docs/adr/` in
  `/home/genzo/repositories/system-nix`.

Read this repository's context and relevant architectural decision records
before exploring or changing it. When work affects the interface consumed by
`system-nix`, the NixOS deployment path, or a domain term shared across the
boundary, also read the relevant context and decisions in `system-nix`.

Use each repository's canonical terms. If the two repositories disagree,
surface the conflict instead of silently choosing one definition.
