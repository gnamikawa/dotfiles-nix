# Repository-maintenance environment: every formatter and linter `nix fmt`
# and the git hooks call directly, so a contributor can run them without
# reaching for `nix fmt`/`nix flake check` first. Entering this shell points
# git at `.githooks`, installing the pre-commit and pre-push hooks for this
# checkout — see AGENTS.md "Formatting" for what each hook runs.
#
# Repository-specific on purpose: these tools never join the shared default
# development environment (devshells/default.nix), which stays project-
# agnostic.
pkgs: {
  packages = with pkgs; [
    nixfmt
    prettier
    stylua
    shfmt
    shellcheck
    actionlint
    markdownlint-cli2
  ];

  shellHook = ''
    git config core.hooksPath .githooks
  '';
}
