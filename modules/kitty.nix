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
      # Let Alt+left drag select text the same way plain left does.
      # Kitty's upstream defaults only bind Ctrl+Alt+left (rectangle) and
      # Alt+left triplepress (line-from-begin) — plain alt+left press
      # matches nothing, so any drag-select while the AGS Alt-hold peek is
      # held would silently do nothing. This restores the normal gesture
      # without touching the more specific double/triple-press mappings.
      mouse_map alt+left press ungrabbed mouse_selection normal

      background   ${constants.terminal.dark.normal.background}
      foreground   ${constants.terminal.dark.normal.text}
      cursor       ${constants.terminal.dark.normal.text}
      cursor_text_color  ${constants.palette.debug}
      selection_background ${constants.terminal.dark.selection.background}
      selection_foreground ${constants.terminal.dark.selection.text}

      # Normal colors
      color0  ${constants.terminal.dark.normal.background}
      color1  ${constants.terminal.dark.normal.error}
      color2  ${constants.terminal.dark.normal.success}
      color3  ${constants.terminal.dark.normal.warning}
      color4  ${constants.terminal.dark.normal.info}
      color5  ${constants.terminal.dark.normal.special}
      color6  ${constants.terminal.dark.normal.secondaryInfo}
      color7  ${constants.terminal.dark.normal.text}

      # Bright colors
      color8  ${constants.terminal.dark.bright.background}
      color9  ${constants.terminal.dark.bright.error}
      color10  ${constants.terminal.dark.bright.success}
      color11  ${constants.terminal.dark.bright.warning}
      color12  ${constants.terminal.dark.bright.info}
      color13  ${constants.terminal.dark.bright.special}
      color14  ${constants.terminal.dark.bright.secondaryInfo}
      color15  ${constants.terminal.dark.bright.text}
    '';
  };
}
