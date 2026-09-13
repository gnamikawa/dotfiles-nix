# Module sources live beside their module, never under `assets/`

`modules/firefox.nix` read `userChrome.css` via `builtins.readFile` from
`assets/home/.mozilla/firefox/minimal.default/chrome/userChrome.css` — a path
chosen to mimic Firefox's own on-disk profile layout, even though nothing
ever symlinks a file there (`programs.firefox` owns writing the real profile
itself). We decided that a `readFile`-only source belongs beside the module
that reads it (`modules/firefox/{default.nix,userChrome.css}`), not under
`assets/`: `assets/` exists specifically to give raw config a rebuild-free
edit→observe loop (ADR-0005), and a file consumed via `readFile` into a Nix
option's string value never gets that benefit regardless of where it sits —
placing it under `assets/` implies a live-editability and a home-directory
placement it doesn't have. This generalizes to any future case of embedded
CSS/shell/HTML/TS content in a `.nix` module: pull it into a real,
syntax-highlighted, correctly-extensioned file named **Module source** next
to its module, promoting that module to a directory regardless of its line
count (a second trigger alongside the existing LOC/tangling one in
`docs/maintenance.md`).

Considered and rejected: keeping the file under `assets/` in a path shaped
like the target application's real config layout. Rejected because the
resemblance is misleading — the file is never placed there, so the path
implies a location and a live-edit workflow that don't exist. Also rejected:
inlining the content directly as a Nix string literal in the module, which
was the status quo problem — it loses editor syntax highlighting, treefmt
formatting, and any tooling that operates on the source language.
