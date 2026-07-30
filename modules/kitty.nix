{ pkgs, config, constants, ... }:
{
  programs.kitty = {
    enable = true;
    package = config.lib.nixGL.wrap pkgs.kitty;
    enableGitIntegration = true;
    shellIntegration.enableBashIntegration = true;
    settings = {
      "confirm_os_window_close" = 0;
    };

    font = {
      name = "JetBrainsMono Nerd Font";
      package = pkgs.nerd-fonts.jetbrains-mono;
      size = 10;
    };

    extraConfig = ''
      background   ${constants.terminal.normal.background}
      foreground   ${constants.terminal.normal.text}
      cursor       ${constants.terminal.normal.text}
      cursor_text_color  ${constants.palette.debug}
      selection_background ${constants.terminal.selection.background}
      selection_foreground ${constants.terminal.selection.text}

      # Normal colors
      color0  ${constants.terminal.normal.background}
      color1  ${constants.terminal.normal.error}
      color2  ${constants.terminal.normal.success}
      color3  ${constants.terminal.normal.warning}
      color4  ${constants.terminal.normal.info}
      color5  ${constants.terminal.normal.special}
      color6  ${constants.terminal.normal.secondaryInfo}
      color7  ${constants.terminal.normal.text}

      # Bright colors
      color8  ${constants.terminal.bright.background}
      color9  ${constants.terminal.bright.error}
      color10  ${constants.terminal.bright.success}
      color11  ${constants.terminal.bright.warning}
      color12  ${constants.terminal.bright.info}
      color13  ${constants.terminal.bright.special}
      color14  ${constants.terminal.bright.secondaryInfo}
      color15  ${constants.terminal.bright.text}
    '';
  };
}
