{ pkgs, ... }:
{
  imports = [
    ./programs/bash.nix
    ./programs/firefox.nix
    ./programs/git.nix
    ./programs/keepassxc.nix
    ./programs/kitty.nix
    ./programs/neovim.nix
    ./programs/yazi.nix
    ./flatpak.nix
  ];

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
            source = ./assets/home/.config/${name};
          };
        }) configNames
      );
    in
    { } // configMappings;

  programs.flatpakManagement.enable = true;
  programs.flatpakManagement.desiredFlatpaks = [
    "com.discordapp.Discord"
    "com.visualstudio.code"
  ];
  home.packages = with pkgs; [
    nix-index
    stdenv.cc.cc.lib
    playerctl
    python313Packages.ueberzug
    udiskie
    # cudaPackages.cudnn
    cudatoolkit
    bottom
    nvtopPackages.full
    gperftools
    pcmanfm
    krita
    blender
    mpv
    file-roller
    feh
    zathura
    keepassxc
    libreoffice-qt6-fresh
    home-manager
    waybar
    fastfetch
    flatpak
  ];

  xdg = {
    autostart.enable = true;
    mimeApps = {
      enable = true;
      defaultApplications = {
        "inode/directory" = "pcmanfm.desktop";
        "application/pdf" = "org.pwmt.zathura-pdf-mupdf.desktop";
        "image/*" = "feh.desktop";
      };
    };
  };

  systemd.user.services = {
    top-waybar = {
      Unit = {
        Description = "top waybar";
        After = [ "graphical-session.target" ];
        PartOf = [ "graphical-session.target" ];
      };
      Service = {
        Type = "simple";
        ExecStart = "${pkgs.waybar}/bin/waybar -c %h/.config/waybar/top.jsonc -s %h/.config/waybar/style.css";
        Restart = "on-failure";
      };
      Install.WantedBy = [ "graphical-session.target" ];
    };

    bottom-waybar = {
      Unit = {
        Description = "bottom waybar";
        After = [ "graphical-session.target" ];
        PartOf = [ "graphical-session.target" ];
      };
      Service = {
        Type = "simple";
        ExecStart = "${pkgs.waybar}/bin/waybar -c %h/.config/waybar/bottom.jsonc -s %h/.config/waybar/style.css";
        Restart = "on-failure";
      };
      Install.WantedBy = [ "graphical-session.target" ];
    };

    etc-waybar = {
      Unit = {
        Description = "waybar displayed on all sub-monitors";
        After = [ "graphical-session.target" ];
        PartOf = [ "graphical-session.target" ];
      };
      Service = {
        Type = "simple";
        ExecStart = "${pkgs.waybar}/bin/waybar -c %h/.config/waybar/etc.jsonc -s %h/.config/waybar/style.css";
        Restart = "on-failure";
      };
      Install.WantedBy = [ "graphical-session.target" ];
    };

    fcitx5-tray = {
      Unit = {
        Description = "Fcitx 5 Tray Applet";
        After = [ "graphical-session.target" ];
        PartOf = [ "graphical-session.target" ];
      };
      Service = {
        Type = "simple";
        ExecStart = "${pkgs.fcitx5}/bin/fcitx5";
      };
      Install.WantedBy = [ "graphical-session.target" ];
    };

    mako = {
      Unit = {
        Description = "Mako Notifications";
        After = [ "graphical-session.target" ];
        PartOf = [ "graphical-session.target" ];
      };
      Service = {
        Type = "simple";
        ExecStart = "${pkgs.mako}/bin/mako";
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
