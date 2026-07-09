{
  pkgs,
  constants,
  config,
  osConfig,
  ...
}:
{
  imports = [
    ./bash.nix
    ./firefox.nix
    ./git.nix
    ./keepassxc.nix
    ./kitty.nix
    ./neovim.nix
    ./yazi.nix
    ./direnv.nix
    ./hyprlock.nix
    ./fcitx5.nix
    ./mako.nix
    ./assets.nix
    ./sway/sway-common.nix
    ./sway/waybar
    ./sway/theme
    # ./flatpak.nix
    ./packages/nvidia.nix
    ./packages/base-linux.nix
    ./packages/user-applications.nix
    ./packages/cli-tools.nix
    ./obsidian.nix
    ./packages/etc.nix

  ];

  home.username = "genzo";
  home.homeDirectory = "/home/genzo";
  home.stateVersion = "25.11";
  xdg = {
    autostart.enable = true;
  };

}
