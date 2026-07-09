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
    ./modules/sway/sway-desktop.nix
    ./modules/sway/sway-laptop.nix
    ./modules/sway/waybar
    ./modules/sway/theme
    # ./flatpak.nix
    ./modules/packages/nvidia.nix
    ./modules/packages/base-linux.nix
    ./modules/packages/user-applications.nix
    ./modules/obsidian.nix
    ./modules/packages/etc.nix

  ];

  programs.waybar.custom =
    if osConfig.networking.hostName == "GEN-LPC" then
      {
        primaryOutput = "eDP-1";
        secondaryOutputs = [ ];
      }
    else
      {
        primaryOutput = "DP-3";
        secondaryOutputs = [
          "DP-2"
          "HDMI-A-1"
        ];
      };
  home.username = "genzo";
  home.homeDirectory = "/home/genzo";
  home.stateVersion = "25.11";
  # programs.flatpakManagement.enable = true;
  # programs.flatpakManagement.desiredFlatpaks = [
  #   "com.discordapp.Discord"
  #   "com.visualstudio.code"
  # ];

  xdg = {
    autostart.enable = true;
  };

  systemd.user.services = {
    waybar = {
      Unit = {
        Description = "top waybar";
        After = [ "graphical-session.target" ];
        PartOf = [ "graphical-session.target" ];
      };
      Service = {
        Type = "simple";
        ExecStart = "${pkgs.waybar}/bin/waybar -c %h/.config/waybar/config -s %h/.config/waybar/style.css";
        Restart = "on-failure";
      };
      Install.WantedBy = [ "graphical-session.target" ];
    };

    # keepassxc = {
    #   Unit = {
    #     Description = "Password Manager";
    #     After = [ "graphical-session.target" ];
    #     PartOf = [ "graphical-session.target" ];
    #   };
    #   Service = {
    #     Type = "simple";
    #     ExecStart = "${pkgs.keepassxc}/bin/keepassxc --minimized --keyfile /mnt/windows/Users/Genzo/Dropbox/Passwords.kbdx";
    #   };
    #   Install.WantedBy = [ "graphical-session.target" ];
    # };
  };
}
