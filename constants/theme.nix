let
  palette = import ./palette.nix;
  colorVariantGenerator = (
    colorIndex: builtins.mapAttrs (key: _: palette.colors.${key}.${colorIndex}) palette.colors
  );
in
rec {
  background = {
    default = palette.background."100";
    secondary = palette.background."200";
  };

  componentBackground = {
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
      background = componentBackground.active.amber;
      text = text.secondary.amber;
    };

    normal = {
      text = text.primary.gray;
      background = background.default;

      error = text.secondary.red;
      warning = text.secondary.amber;
      success = text.secondary.green;

      info = text.secondary.blue;
      secondaryInfo = text.secondary.teal;

      special = text.secondary.purple;
    };

    bright = {
      text = text.primary.gray;
      background = background.default;

      error = text.primary.red;
      warning = text.primary.amber;
      success = text.primary.green;

      info = text.primary.blue;
      secondaryInfo = text.primary.teal;

      special = text.primary.purple;
    };
  };
}
