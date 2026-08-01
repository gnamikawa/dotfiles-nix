# theme.nix — ours, not a transcription: Geist's role vocabulary laid over the
# ramps in palette.nix. Ten roles for ten steps.
#
# Each theme is built by applying roleVocabulary to one theme's palette, so the
# theme name lands near the front of the path (theme.dark.border.default.gray)
# and colorVariantGenerator still sees a leaf that is the value.

let
  palette = import ./palette.nix;

  roleVocabulary =
    p: overlayBackdropColor:
    let
      colorVariantGenerator = (
        colorIndex: builtins.mapAttrs (key: _: p.colors.${key}.${colorIndex}) p.colors
      );
    in
    {
      background = {
        default = p.background."100";
        secondary = p.background."200";
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

      # Geist keeps the opacity separate so consumers can apply the backdrop
      # colour and its strength through their native properties. The colour's
      # alias changes with the theme; the scalar itself does not.
      overlay.backdrop = {
        color = overlayBackdropColor;
        opacity = 0.8;
      };
    };
in
{
  # Named one theme at a time rather than mapped over palette: palette's top
  # level also holds `debug` and the theme-invariant black/white/contrast-fg,
  # which are not themes.
  dark = roleVocabulary palette.dark "var(--ds-background-200)";
  light = roleVocabulary palette.light "var(--ds-gray-100)";
}
