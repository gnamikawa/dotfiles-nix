# focus.nix — a transcription of Geist's --ds-focus-* family, from
# https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css
#
# Carries the theme axis: the ring is a different blue in each theme (blue-700
# light, blue-900 dark), and the outer glow of --ds-focus-border is black in
# light and white in dark.
#
# The colour is kept as the var(--ds-blue-N00) reference Geist writes rather
# than resolved to a hex — the design decision is *which step of the blue ramp*
# focus uses, and resolving it would copy a palette byte into this file. Same
# reasoning as shadow.nix.

let
  # --ds-focus-ring and --ds-focus-ring-outline are declared once each and both
  # reach the theme only through --ds-focus-color, so they are shared structure
  # rather than per-theme values.
  ring = "0 0 0 2px var(--ds-background-100), 0 0 0 4px var(--ds-focus-color)";
  ringOutline = "2px solid var(--ds-focus-color)";
in
{
  light = {
    inherit ring ringOutline;
    color = "var(--ds-blue-700)";
    border = "0 0 0 1px var(--ds-gray-alpha-600), 0px 0px 0px 4px #00000029";
  };

  dark = {
    inherit ring ringOutline;
    color = "var(--ds-blue-900)";
    border = "0 0 0 1px var(--ds-gray-alpha-600), 0px 0px 0px 4px #ffffff3d";
  };
}
