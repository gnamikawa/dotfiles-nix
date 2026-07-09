{
  pkgs,
  constants,
  config,
  osConfig,
  ...
}:
{
  imports = [
    ./programs/bash.nix
    ./programs/firefox.nix
    ./programs/git.nix
    ./programs/keepassxc.nix
    ./programs/kitty.nix
    ./programs/neovim.nix
    ./programs/yazi.nix
    ./modules/direnv.nix
    ./modules/hyprlock.nix
    ./modules/sway/sway-common.nix
    ./modules/sway/sway-desktop.nix
    ./modules/sway/sway-laptop.nix
    ./modules/sway/waybar
    ./modules/sway/theme
    # ./flatpak.nix
    ./modules/nvidia.nix
    ./modules/base-linux.nix
    ./modules/user-applications.nix
    ./modules/etc.nix
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
  home.file =
    let
      configNames = builtins.attrNames (builtins.readDir ./assets/home/.config);
      configMappings = builtins.listToAttrs (
        builtins.map (name: {
          name = ".config/${name}";
          value = {
            source = config.lib.file.mkOutOfStoreSymlink "${config.home.homeDirectory}/repositories/dotfiles-nix/assets/home/.config/${name}";
          };
        }) configNames
      );
    in
    { } // configMappings;

  # programs.flatpakManagement.enable = true;
  # programs.flatpakManagement.desiredFlatpaks = [
  #   "com.discordapp.Discord"
  #   "com.visualstudio.code"
  # ];

  xdg = {
    autostart.enable = true;
  };

  i18n.inputMethod = {
    enable = true;
    type = "fcitx5";
    fcitx5 = {
      addons = with pkgs; [
        fcitx5-gtk
        fcitx5-mozc-ut
      ];
      waylandFrontend = true;

      settings.globalOptions = {
        "Hotkey" = {
          "TriggerKeys" = "Mod+space";
        };
        "Groups/0/Items/0".Name = "keyboard-us";
        "Groups/0/Items/1".Name = "mozc";
        "GroupOrder"."0" = "Default";
      };

      settings.inputMethod = {
        "Groups/0" = {
          "Name" = "Default";
          "Default Layout" = "keyboard-us";
          "DefaultIM" = "keyboard-us";
        };
        "Groups/0/Items/0".Name = "keyboard-us";
        "Groups/0/Items/1".Name = "mozc";
        "GroupOrder"."0" = "Default";
      };
    };
  };

  services.mako = {
    enable = true;

    settings = {
      sort = "-time";
      layer = "overlay";

      width = 300;
      height = 110;

      border-size = 1;
      border-radius = 4;

      default-timeout = 5000;
      ignore-timeout = true;

      background-color = constants.theme.componentBackground.active.gray;
      border-color = constants.theme.border.active.gray;
      text-color = constants.theme.text.primary.gray;
      progress-color = constants.theme.border.active.gray;
      font = "JetBrainsMono Nerd Font,JetBrainsMono NF 10";

      max-icon-size = 64;
      icons = true;

      "urgency=low" = {
        background-color = constants.theme.componentBackground.active.teal;
        border-color = constants.theme.border.active.teal;
        text-color = constants.theme.text.primary.teal;
      };

      "urgency=normal" = {
        background-color = constants.theme.componentBackground.active.gray;
        border-color = constants.theme.border.active.gray;
        text-color = constants.theme.text.primary.gray;
      };

      "urgency=high" = {
        background-color = constants.theme.componentBackground.active.red;
        border-color = constants.theme.border.active.red;
        text-color = constants.theme.text.primary.red;
        default-timeout = 0;
      };

      "category=mpd" = {
        default-timeout = 2000;
        group-by = "category";
      };
    };
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
