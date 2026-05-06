{ ... }:
{
  programs = {
    direnv = {
      enable = true;
      enableBashIntegration = true; # or whichever shell you use
      nix-direnv.enable = true;
    };
    bash.enable = true; # home-manager needs to manage your shell
  };
}
