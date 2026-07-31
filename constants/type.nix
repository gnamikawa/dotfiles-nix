# type.nix — a transcription of Geist's type scale, from the @layer utilities
# rules of
# https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css
#
# Theme-blind: the scale is the same in both themes, so this file carries no
# theme level (#53).
#
# Geist publishes no --ds-text-* or --ds-font-* custom properties. The scale
# exists only as thirty utility classes, so the layer transcribed is the class:
# each key here is the class-name suffix (`.text-heading-16` → heading."16",
# `.text-copy-13-mono` → copy."13-mono"), which is what lets the generated
# stylesheet emit the class names back without a lookup table.
#
# All thirty classes are transcribed, not the subset the shell will use (#53).
#
# Only headings carry letter-spacing; the other three families have no
# letter-spacing declaration at all, so they have no key for it rather than a
# key holding "normal". Nor is the `> strong` rule each class pairs with
# transcribed: it styles an HTML child element, which has no GTK counterpart.

let
  # Geist's fallback chains are deliberately dropped. They answer "what if the
  # receiving machine lacks the font", which Nix answers at the package level by
  # installing it; keeping them would let a broken install land on DejaVu Sans
  # Mono or Cantarell and look almost right rather than obviously wrong (#53).
  sans = "Geist";
  mono = "Geist Mono";

  # --font-weight-{normal,medium,semibold}. Integers, not lengths: font-weight
  # takes a number, and the fonts ship a 100-900 axis of which Geist names three.
  normal = 400;
  medium = 500;
  semibold = 600;

  # Letter-spacing is written with a leading zero (Geist writes -.28px); same
  # length, spelled the way the rest of this repo spells decimals.
  headingClass = size: lineHeight: letterSpacing: {
    family = sans;
    inherit size lineHeight letterSpacing;
    weight = semibold;
  };

  textClass = family: weight: size: lineHeight: {
    inherit family size lineHeight weight;
  };
in
{
  family = { inherit sans mono; };
  weight = { inherit normal medium semibold; };

  heading = {
    "14" = headingClass "14px" "20px" "-0.28px";
    "16" = headingClass "16px" "24px" "-0.32px";
    "20" = headingClass "20px" "26px" "-0.4px";
    "24" = headingClass "24px" "32px" "-0.96px";
    "32" = headingClass "32px" "40px" "-1.28px";
    "40" = headingClass "40px" "48px" "-2.4px";
    "48" = headingClass "48px" "56px" "-2.88px";
    "56" = headingClass "56px" "56px" "-3.36px";
    "64" = headingClass "64px" "64px" "-3.84px";
    "72" = headingClass "72px" "72px" "-4.32px";
  };

  copy = {
    "13" = textClass sans normal "13px" "18px";
    "13-mono" = textClass mono normal "13px" "18px";
    "14" = textClass sans normal "14px" "20px";
    "14-mono" = textClass mono normal "14px" "20px";
    "16" = textClass sans normal "16px" "24px";
    "18" = textClass sans normal "18px" "28px";
    "20" = textClass sans normal "20px" "36px";
    "24" = textClass sans normal "24px" "36px";
  };

  label = {
    "12" = textClass sans normal "12px" "16px";
    "12-mono" = textClass mono normal "12px" "16px";
    "13" = textClass sans normal "13px" "16px";
    # Not a transcription slip: label-13-mono leads at 20px where label-13 leads
    # at 16px. The mono variants are not a font swap on the same metrics.
    "13-mono" = textClass mono normal "13px" "20px";
    "14" = textClass sans normal "14px" "20px";
    "14-mono" = textClass mono normal "14px" "20px";
    "16" = textClass sans normal "16px" "20px";
    "18" = textClass sans normal "18px" "20px";
    "20" = textClass sans normal "20px" "32px";
  };

  button = {
    "12" = textClass sans medium "12px" "16px";
    "14" = textClass sans medium "14px" "20px";
    "16" = textClass sans medium "16px" "20px";
  };
}
