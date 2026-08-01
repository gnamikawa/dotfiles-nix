# motion.nix — a transcription of Geist's --ds-motion-* family, from
# https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css
#
# Theme-blind (#53).
#
# One curve, and it overshoots — the final control point's y is 1.1, a slight
# back-out spring. Both durations name it, so there is no second feel to pick.
#
# Durations are integer milliseconds rather than the ".3s" Geist writes,
# because this family has two consumers with different syntax: CSS takes
# `300ms`, and GTK's Revealer/Stack take transition-duration as a widget
# property in milliseconds (#39). One number, no parsing on either side.
#
# --ds-overlay-backdrop-{color,opacity} is NOT here despite sitting beside the
# overlay motion tokens. Geist groups by prefix; this repo groups by kind, which
# is why the popover lengths came here from the colour side. By that same rule
# the backdrop goes the other way: it is a colour and the opacity that modulates
# it, its colour half varies by theme (gray-100 light, background-200 dark), and
# an opacity split from the colour it applies to means nothing. Both belong in
# theme.nix.
#
# --ds-motion-overlay-scale stays here: the panel scaling from .96 is how the
# overlay moves, not what it is coloured.

let
  swift = "cubic-bezier(0.175, 0.885, 0.32, 1.1)";
in
{
  timing = {
    inherit swift;
  };

  overlay = {
    timing = swift;
    duration = 300;
    scale = 0.96;
  };

  popover = {
    timing = swift;
    duration = 200;
  };
}
