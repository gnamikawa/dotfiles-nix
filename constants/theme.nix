let
  palette = import ./palette.nix;
  colorVariantGenerator = (
    colorIndex: builtins.mapAttrs (key: _: palette.colors.${key}.${colorIndex}) palette.colors
  );
in
rec {
  backgrounds = {
    default = palette.background."100";
    secondary = palette.background."200";
  };

  componentBackgrounds = {
    default = colorVariantGenerator "100";
    hover = colorVariantGenerator "200";
    active = colorVariantGenerator "300";
  };

  border = {
    default = colorVariantGenerator "400";
    hover = colorVariantGenerator "500";
    active = colorVariantGenerator "600";
  };

  highContrastBackground = {
    default = colorVariantGenerator "700";
    hover = colorVariantGenerator "800";
  };

  text = {
    secondary = colorVariantGenerator "900";
    primary = colorVariantGenerator "1000";
  };

  terminal = {
    selection = {
      background = componentBackgrounds.active.amber;
      text = text.secondary.amber;
    };

    normal = {
      text = text.primary.gray;
      background = backgrounds.default;

      error = text.secondary.red;
      warning = text.secondary.amber;
      success = text.secondary.green;

      info = text.secondary.blue;
      secondaryInfo = text.secondary.teal;

      special = text.secondary.purple;
    };

    bright = {
      text = text.primary.gray;
      background = backgrounds.default;

      error = text.primary.red;
      warning = text.primary.amber;
      success = text.primary.green;

      info = text.primary.blue;
      secondaryInfo = text.primary.teal;

      special = text.primary.purple;
    };
  };

  lightblack = "#2d2d2d"; # deprecated
  lightgray = "#d4d4d4"; # deprecated
  blackout = "#1e1e1e"; # deprecated

  purple = "#c183bc"; # deprecated
  teal = "#4ec9b0"; # deprecated
  blue = "#007acc"; # deprecated

  # extraConfig = ''
  #   background   ${constants.theme.blackout}
  #   foreground   ${constants.theme.lightgray}
  #   cursor       ${constants.theme.lightgray}
  #   cursor_text_color  ${constants.theme.blackout}
  #   selection_background #264f78
  #   selection_foreground ${constants.theme.lightgray}
  #
  #   # Normal colors
  #   color0  ${constants.theme.blackout}
  #   color1  #f44747
  #   color2  #4ec9b0
  #   color3  #dcdcaa
  #   color4  #569cd6
  #   color5  #c586c0
  #   color6  #4ec9b0
  #   color7  ${constants.theme.lightgray}
  #
  #   # Bright colors
  #   color8  ${constants.theme.lightblack}
  #   color9  #f44747
  #   color10 #4ec9b0
  #   color11 #dcdcaa
  #   color12 #569cd6
  #   color13 #c586c0
  #   color14 #4ec9b0
  #   color15 ${constants.theme.white}
  #
  #   # Optional tab colors
  #   active_tab_background   ${constants.theme.blue}
  #   active_tab_foreground   ${constants.theme.lightgray}
  #   inactive_tab_background ${constants.theme.lightblack}
  #   inactive_tab_foreground #6c6c6c
  # '';
}
