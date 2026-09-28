# treefmt-nix configuration. Runs one formatter per language across the
# whole tree via `nix fmt`. The pre-commit hook at `.githooks/pre-commit`
# invokes treefmt against staged files only and fails the commit when
# any of them had to be rewritten.
{ pkgs, ... }:
{
  projectRootFile = "flake.nix";

  # Nix files use nixfmt (RFC 166), matching the community default that
  # every `.nix` file in this repo already targets.
  programs.nixfmt.enable = true;

  # TypeScript, TSX, JavaScript, CSS, JSON, YAML, and Markdown all pass
  # through prettier — one formatter, seven extensions.
  programs.prettier.enable = true;

  # Hard-wrap Markdown prose at prettier's default 80 columns, matching the
  # `--prose-wrap always` the Neovim conform config passes when saving.
  programs.prettier.settings.overrides = [
    {
      files = [ "*.md" ];
      options.proseWrap = "always";
    }
  ];

  # Lua config (Hyprland binds/rules, Neovim).
  programs.stylua.enable = true;

  # POSIX shell scripts under assets/.
  programs.shfmt.enable = true;

  # ShellCheck and actionlint never rewrite files — `nix fmt` runs them as a
  # no-op pass, and `formatting`'s pre/post-content diff (empty either way)
  # never fails; a lint finding still fails treefmt outright, so both catch
  # issues under `nix fmt`, the pre-commit hook, and the `formatting` check
  # alike. shfmt only sees `*.sh`/`*.bash`, so the two extensionless scripts
  # are named explicitly.
  programs.shellcheck.enable = true;
  programs.shellcheck.includes = [
    "*.sh"
    "*.bash"
    "*.envrc"
    "*.envrc.*"
    ".bashrc"
    ".githooks/pre-commit"
    ".githooks/pre-push"
  ];

  programs.actionlint.enable = true;

  # No `programs.markdownlint` preset exists in treefmt-nix; markdownlint-cli2
  # reads this repo's `.markdownlint.yaml` on its own, so no `--config` flag
  # is needed. `--fix` covers the mechanically-fixable rules (spacing, marker
  # style); everything else (heading structure, list numbering) is a content
  # decision `nix fmt` cannot make and fails instead.
  settings.formatter.markdownlint = {
    command = "${pkgs.markdownlint-cli2}/bin/markdownlint-cli2";
    options = [ "--fix" ];
    includes = [ "*.md" ];
  };

  # Vendored and generated trees are out of scope. The @girs directory is
  # regenerated from GObject introspection; formatting it churns on every
  # regeneration. The node_modules tree is third-party.
  settings.global.excludes = [
    "flake.lock"
    ".gitignore"
    "assets/home/.config/ags/@girs/**"
    "tests/ags/node_modules/**"
    "tests/ags/package-lock.json"
    ".claude/**"
    ".codex/**"
    ".agents/**"
  ];
}
