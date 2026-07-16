{ ... }:
{
  # The `dotfiles` flake alias used by project .envrc files
  # (`use flake dotfiles#<env>`) lives in assets/home/.config/nix/
  # registry.json — it cannot be declared here because assets.nix symlinks
  # the whole ~/.config/nix directory out-of-store.

  programs = {
    direnv = {
      enable = true;
      enableBashIntegration = true; # or whichever shell you use
      nix-direnv.enable = true;
    };
    bash.enable = true; # home-manager needs to manage your shell
  };
}
