# Default development environment — prepended to PATH by every interactive
# shell as a prebuilt profile (modules/default-env.nix); also exposed as
# devShells.default. Cross-language glue only; full toolchains live in the
# named language environments beside this file.
pkgs: {
  packages = with pkgs; [
    gnumake
    python3
  ];
}
