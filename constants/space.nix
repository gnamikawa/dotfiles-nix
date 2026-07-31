# space.nix — a transcription of Geist's spacing, gap, control-height and form
# families, from the :root,:host rule of
# https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css
#
# Theme-blind: every value here is the same in both themes, so this file carries
# no theme level (#53).
#
# Four families Geist names separately live here because they are one scale seen
# four ways: --geist-space-* is the 4px base scale, --geist-gap-* is a set of
# aliases into it, --ds-size-* is another set of aliases into it (control
# heights), and --geist-form-* pins a font size and line height to each control
# height. Aliases are written as Nix references so the alias stays visible
# rather than being flattened into a repeated literal.

let
  scale = {
    base = "4px"; # --geist-space
    "2x" = "8px";
    "3x" = "12px";
    "4x" = "16px";
    "6x" = "24px";
    "8x" = "32px";
    "10x" = "40px";
    "16x" = "64px";
    "24x" = "96px";
    "32x" = "128px";
    "48x" = "192px";
    "64x" = "256px";

    # --geist-space-{small,medium,large}. The same three numbers as the control
    # heights below: --ds-size-small is a straight alias of --geist-space-small.
    small = "32px";
    medium = "36px";
    large = "40px";
  };

  # Geist publishes a *-negative twin for most, not all, of the scale: 3x, 6x
  # and 10x have none. Transcribed as published — inventing the three missing
  # ones would be designing the design system.
  negative = {
    base = "-4px";
    "2x" = "-8px";
    "4x" = "-16px";
    "8x" = "-32px";
    "16x" = "-64px";
    "24x" = "-96px";
    "32x" = "-128px";
    "48x" = "-192px";
    "64x" = "-256px";

    small = "-32px";
    medium = "-36px";
    large = "-40px";
  };
in
scale
// {
  inherit negative;

  # --geist-gap-*, the spelling that has all five members. Three of them
  # (base, half, quarter) are also published as --geist-space-gap-*, which is
  # where their values are actually written; double and section exist only in
  # this spelling. One family under two names, transcribed once.
  gap = {
    base = "24px";
    half = "12px";
    quarter = scale."2x";
    double = scale.large;
    section = scale.small;
  };

  # No --geist-gap-section-negative exists.
  gapNegative = {
    base = "-24px";
    half = "-12px";
    quarter = negative."2x";
    double = negative.large;
  };

  # --ds-size-*: the height of a control, spelled as an alias of named spacing.
  controlHeight = {
    small = scale.small;
    medium = scale.medium;
    large = scale.large;
  };

  # --geist-form-*, the type that goes inside a control of each height. Geist
  # writes these in rem against a 16px root; converted to px here, since rem in
  # GTK multiplies gtk-font-name rather than a root font size (#53).
  #
  # Geist spells the middle size with no suffix at all (--geist-form-font); it
  # is named `medium` here because its height is --geist-space-medium.
  form = {
    small = {
      font = "14px";
      lineHeight = "14px";
      height = scale.small;
    };
    medium = {
      font = "14px";
      lineHeight = "20px";
      height = scale.medium;
    };
    large = {
      font = "16px";
      lineHeight = "24px";
      height = scale.large;
    };
  };

  # The length half of --ds-popover-*, handed over from the colour pass because
  # these are lengths and not colours. --ds-popover-row-height gets no entry: it
  # is var(--geist-space-medium), which is `medium` above. The radius half is in
  # radius.nix.
  popover = {
    padding = "6px";
    rowPadding = "0 8px";
  };
}
