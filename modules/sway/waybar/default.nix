{
  config,
  lib,
  pkgs,
  ...
}:

let
  cfg = config.programs.waybar.custom;
  scripts = ./scripts;

  topBar = import ./bars/top.nix {
    inherit (cfg) primaryOutput;
    inherit scripts;
  };
  bottomBar = import ./bars/bottom.nix {
    inherit (cfg) primaryOutput;
    inherit scripts;
  };
  etcBar = import ./bars/etc.nix {
    inherit (cfg) secondaryOutputs;
    inherit scripts;
  };

  # Only include the etc bar when there are secondary outputs to target.
  # An empty list would make waybar appear on all displays.
  bars = [
    topBar
    bottomBar
  ]
  ++ lib.optional (cfg.secondaryOutputs != [ ]) etcBar;

in
{
  # ── Options ──────────────────────────────────────────────────────────────────
  #
  # Set these per host in your home.nix (or any host-specific module):
  #
  #   programs.waybar.custom.primaryOutput    = "eDP-1";
  #   programs.waybar.custom.secondaryOutputs = [];
  #
  # To query output names on the running system:
  #   swaymsg -t get_outputs | grep name
  #
  options.programs.waybar.custom = {

    primaryOutput = lib.mkOption {
      type = lib.types.str;
      default = "DP-1";
      description = "Output name for the primary display (hosts the top and bottom bars).";
      example = "eDP-1";
    };

    secondaryOutputs = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [ ];
      description = ''
        Output names for secondary displays (hosts the etc bar with workspaces).
        Set to an empty list on single-display setups — the etc bar will be
        omitted entirely.
      '';
      example = [
        "DP-2"
        "HDMI-A-1"
      ];
    };

  };

  config = {
    systemd.user.services.waybar = {
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


    programs.waybar = {
      enable = true;
      settings = bars;

      # CSS is assembled by concatenating all source files in the same order
      # the original style.css @imports them. The leading reset is kept inline
      # since it is the only content in style.css itself.
      style = ''
        /* ignore GTK theme */
        * {
          all: initial;
        }
      ''
      + builtins.readFile ./theme.css
      + builtins.readFile ./styles/fonts.css
      + builtins.readFile ./styles/global.css
      + builtins.readFile ./styles/modules-center.css
      + builtins.readFile ./styles/modules-left.css
      + builtins.readFile ./styles/modules-right.css
      + builtins.readFile ./styles/modules-dividers.css
      + builtins.readFile ./styles/states.css;
    };

    xdg.configFile = {
      "waybar/scripts/backlight.sh" = {
        executable = true;
        source = ./scripts/backlight.sh;
      };

      "waybar/scripts/bluetooth.sh" = {
        executable = true;
        source = ./scripts/bluetooth.sh;
      };

      "waybar/scripts/bluetoothtoggle.sh" = {
        executable = true;
        source = ./scripts/bluetoothtoggle.sh;
      };

      "waybar/scripts/fzf-colors.sh" = {
        executable = true;
        source = ./scripts/fzf-colors.sh;
      };

      "waybar/scripts/network.sh" = {
        executable = true;
        source = ./scripts/network.sh;
      };

      "waybar/scripts/networktoggle.sh" = {
        executable = true;
        source = ./scripts/networktoggle.sh;
      };

      "waybar/scripts/power-menu.sh" = {
        executable = true;
        source = ./scripts/power-menu.sh;
      };

      "waybar/scripts/qrscan.sh" = {
        executable = true;
        source = ./scripts/qrscan.sh;
      };

      "waybar/scripts/volume.sh" = {
        executable = true;
        source = ./scripts/volume.sh;
      };
    };
  };

}
