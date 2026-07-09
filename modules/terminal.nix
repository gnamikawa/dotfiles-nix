# Terminal profile — everything useful on a headless machine. The graphical
# aggregator (default.nix) layers on top of this; standalone home-manager can
# activate this file directly on a non-graphical host.

{ ... }:
{
  imports = [
    ./bash.nix
    ./git.nix
    ./neovim.nix
    ./yazi.nix
    ./direnv.nix
    ./assets.nix
    ./packages/base-linux.nix
    ./packages/cli-tools.nix
  ];

  home.username = "genzo";
  home.homeDirectory = "/home/genzo";
  home.stateVersion = "25.11";
}
