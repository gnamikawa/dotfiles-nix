# radius.nix — a transcription of Geist's radii, from
# https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css
#
# Theme-blind: the same radii in both themes, so no theme level (#53).
#
# Geist publishes exactly one radius custom property, --geist-radius. The rest
# of the scale is not a token at all: the .material-* utility classes pin a
# radius per elevation, and those are the numbers a surface actually uses. Both
# layers are transcribed, because the elevation rule is the design decision —
# a radius is chosen by how high the surface floats, not freely.
#
# --geist-marketing-radius (8px) is deliberately absent: it belongs to the
# marketing-* family, which does not transcribe (#53).

{
  # --geist-radius
  base = "6px";

  # Radius per material, read off the .material-* rules. Each material also
  # pins a background (--ds-background-100) and a shadow; the shadow half is in
  # shadow.nix under the matching name.
  elevation = {
    base = "6px";
    small = "6px";
    tooltip = "6px";

    medium = "12px";
    large = "12px";
    menu = "12px";
    modal = "12px";

    fullscreen = "16px";
  };

  # --ds-popover-row-radius, handed over from the colour pass for the same
  # reason as the popover lengths in space.nix: it is a radius, not a colour.
  popoverRow = "6px";
}
