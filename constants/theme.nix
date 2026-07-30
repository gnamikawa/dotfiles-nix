# theme.nix — ours, not a transcription: Geist's role vocabulary laid over the
# ramps in palette.nix. Ten roles for ten steps.

let
  palette = import ./palette.nix;
  colorVariantGenerator = (
    colorIndex: builtins.mapAttrs (key: _: palette.colors.${key}.${colorIndex}) palette.colors
  );
in
{
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
}
