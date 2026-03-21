{ pkgs, constants, ... }:
{
  programs.kitty = {
    enable = true;
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
      background   ${constants.theme.terminal.normal.background}
      foreground   ${constants.theme.terminal.normal.text}
      cursor       ${constants.theme.terminal.normal.text}
      cursor_text_color  ${constants.palette.debug}
      selection_background ${constants.theme.terminal.selection.background}
      selection_foreground ${constants.theme.terminal.selection.text}

      # Normal colors
      color0  ${constants.theme.terminal.normal.background}
      color1  ${constants.theme.terminal.normal.error}
      color2  ${constants.theme.terminal.normal.success}
      color3  ${constants.theme.terminal.normal.warning}
      color4  ${constants.theme.terminal.normal.info}
      color5  ${constants.theme.terminal.normal.special}
      color6  ${constants.theme.terminal.normal.secondaryInfo}
      color7  ${constants.theme.terminal.normal.text}

      # Bright colors
      color8  ${constants.theme.terminal.bright.background}
      color9  ${constants.theme.terminal.bright.error}
      color10  ${constants.theme.terminal.bright.success}
      color11  ${constants.theme.terminal.bright.warning}
      color12  ${constants.theme.terminal.bright.info}
      color13  ${constants.theme.terminal.bright.special}
      color14  ${constants.theme.terminal.bright.secondaryInfo}
      color15  ${constants.theme.terminal.bright.text}

      # Optional tab colors
      active_tab_background   ${constants.theme.blue} 
      active_tab_foreground   ${constants.theme.lightgray}
      inactive_tab_background ${constants.theme.lightblack}
      inactive_tab_foreground #6c6c6c
    '';
  };
}
