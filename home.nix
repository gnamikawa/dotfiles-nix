{
  pkgs,
  constants,
  config,
  osConfig,
  ...
}:
{
  imports = [
    ./modules/bash.nix
    ./modules/firefox.nix
    ./modules/git.nix
    ./modules/keepassxc.nix
    ./modules/kitty.nix
    ./modules/neovim.nix
    ./modules/yazi.nix
    ./modules/direnv.nix
    ./modules/hyprlock.nix
    ./modules/fcitx5.nix
    ./modules/mako.nix
    ./modules/assets.nix
    ./modules/sway/sway-common.nix
    ./modules/sway/waybar
    ./modules/sway/theme
    # ./modules/flatpak.nix
    ./modules/packages/nvidia.nix
    ./modules/packages/base-linux.nix
    ./modules/packages/user-applications.nix
    ./modules/obsidian.nix
    ./modules/packages/etc.nix

  ];

  home.username = "genzo";
  home.homeDirectory = "/home/genzo";
  home.stateVersion = "25.11";
  xdg = {
    autostart.enable = true;
  };

}
