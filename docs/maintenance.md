# Maintenance rules

Working conventions for maintaining this repository. Unlike `CONTEXT.md`
(glossary) and `docs/adr/` (decisions with trade-offs), these are standing
rules about how the code is kept.

## Module granularity

Modules are one flat file directly under `modules/`. Around 100 LOC, or when
distinct responsibilities start to tangle inside one file, is the signal to
refactor into a folder of smaller files with succinct identities — not
before.

## Generated slices

Computed slices (ADR-0005) are emitted to `~/.config/generated/<app>/…`
(e.g. `generated/hypr/`, `generated/waybar/`), never into the asset tree.
Nested structure inside `generated/<app>/` mirrors the config it joins, so
file relationships stay legible. Raw assets reference slices by that path
through the application's own include mechanism.
