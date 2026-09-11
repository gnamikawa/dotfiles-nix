# treefmt-nix configuration. Runs one formatter per language across the
# whole tree via `nix fmt`. The pre-commit hook at `.githooks/pre-commit`
# invokes treefmt against staged files only and fails the commit when
# any of them had to be rewritten.
{
  projectRootFile = "flake.nix";

  # Nix files use nixfmt (RFC 166), matching the community default that
  # every `.nix` file in this repo already targets.
  programs.nixfmt.enable = true;

  # TypeScript, TSX, JavaScript, CSS, JSON, YAML, and Markdown all pass
  # through prettier — one formatter, seven extensions.
  programs.prettier.enable = true;

  # Lua config (Hyprland binds/rules, Neovim).
  programs.stylua.enable = true;

  # POSIX shell scripts under assets/.
  programs.shfmt.enable = true;

  # Vendored and generated trees are out of scope. The @girs directory is
  # regenerated from GObject introspection; formatting it churns on every
  # regeneration. The Mozilla and node_modules trees are third-party.
  settings.global.excludes = [
    "flake.lock"
    ".gitignore"
    "assets/home/.config/ags/@girs/**"
    "assets/home/.mozilla/**"
    "tests/ags/node_modules/**"
    "tests/ags/package-lock.json"
    ".claude/**"
    ".codex/**"
    ".agents/**"
  ];
}
