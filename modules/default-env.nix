# The default development environment (CONTEXT.md): cross-language glue,
# present in every interactive shell at any working directory, as a
# removable layer — never part of the ambient package sets.

{ pkgs, ... }:
let
  # Built from the same package list as devShells.default — the catalog
  # file is the single source of truth for what the glue contains.
  profile = pkgs.buildEnv {
    name = "default-development-environment";
    paths = (import ../devshells/default.nix pkgs).packages;
  };
in
{
  # direnv can only reach descendants of a .envrc, so this layer rides
  # interactive shell init instead. The first interactive shell in a
  # process tree claims the layer; descendants inherit the variable and
  # leave PATH alone, so a project that shadowed or dropped the layer
  # keeps its arrangement in subshells.
  programs.bash.initExtra = ''
    if [ -z "''${DEFAULT_DEV_ENV-}" ]; then
      export DEFAULT_DEV_ENV=${profile}
      PATH=$DEFAULT_DEV_ENV/bin:$PATH
    fi
  '';

  # First-class removal: a project .envrc opts out of the default
  # development environment with this one line; ambient tools survive.
  programs.direnv.stdlib = ''
    drop_default_env() {
      PATH_rm "$DEFAULT_DEV_ENV/bin"
    }
  '';
}
