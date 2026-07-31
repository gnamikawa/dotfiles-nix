# shadow.nix — a transcription of Geist's --ds-shadow-* family, from
# https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css
#
# This family DOES carry the theme axis, unlike the other non-colour families:
# Geist restates the whole set inside its dark rule, and seven of the nineteen
# values differ. Those seven are the arguments to `family` below, so the diff
# between the themes is exactly the argument list; everything else is shared
# structure. (#57's body called focus the only themed family here — it is not.)
#
# Composites are composed here rather than left as var() references to sibling
# shadow tokens, so each value is a complete box-shadow. Two references are
# kept verbatim, both to colour tokens rather than to other shadows:
# var(--ds-background-200) and var(--ds-gray-alpha-400). They stay symbolic
# because resolving them would put a copy of a palette byte in this file, and
# the light half of the palette does not exist in constants/ yet. GTK CSS has
# had real var() since 4.16 and this repo builds 4.20.3 (#46), so the generated
# stylesheet resolves them the same way Geist's does.
#
# Geist's older, unprefixed --shadow-{smallest,extra-small,small,medium,large,
# hover,sticky} family is not transcribed: it is superseded by this one, and in
# dark every member of it collapses to a flat 1px ring.

let
  family =
    {
      borderBase,
      borderInset,
      xxs,
      xs,
      small,
      medium,
      modalElevated,
    }:
    let
      backgroundBorder = "0 0 0 1px var(--ds-background-200)";

      # The composite shape Geist uses for every material: a hairline border,
      # the shadow proper, then a ring in the page background.
      ringed = layers: "${borderBase}, ${layers}, ${backgroundBorder}";
    in
    {
      inherit
        backgroundBorder
        borderBase
        borderInset
        small
        medium
        modalElevated
        ;

      "2xs" = xxs;
      inherit xs;

      border = "${borderBase}, ${backgroundBorder}";
      borderSmall = ringed small;
      borderMedium = ringed medium;

      large = "0px 2px 2px #0000000a, 0px 8px 16px -4px #0000000a";
      borderLarge = ringed "0px 2px 2px #0000000a, 0px 8px 16px -4px #0000000a";

      xl = "0px 1px 1px #00000005, 0px 4px 8px -4px #0000000a, 0px 16px 24px -8px #0000000f";
      "2xl" = "0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a, 0px 24px 32px -8px #0000000f";

      tooltip = ringed "0px 1px 1px #00000005, 0px 4px 8px #0000000a";
      menu = ringed "0px 1px 1px #00000005, 0px 4px 8px -4px #0000000a, 0px 16px 24px -8px #0000000f";

      # modal and fullscreen are byte-identical in Geist; both are kept because
      # both are published names, and radius.nix distinguishes the two materials.
      modal = ringed "0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a, 0px 24px 32px -8px #0000000f";
      fullscreen = ringed "0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a, 0px 24px 32px -8px #0000000f";
    };
in
{
  light = family {
    borderBase = "0 0 0 1px #00000014";
    borderInset = "inset 0 0 0 1px #00000014";
    xxs = "0px 1px 1px #0000000a";
    xs = "0px 1px 2px #0000000a";
    small = "0px 2px 2px #0000000a";
    medium = "0px 2px 2px #0000000a, 0px 8px 8px -8px #0000000a";
    modalElevated = "0px 0px 0px 1px #00000014, 0px 32px 72px -12px #0000000f, 0px 8px 32px -12px #00000014, 0px 8px 24px -12px #0000001f";
  };

  dark = family {
    borderBase = "0 0 0 1px #ffffff25";
    borderInset = "inset 0 0 0 1px #ffffff1a";
    xxs = "0px 1px 1px #00000029";
    xs = "0px 1px 2px #00000029";
    small = "0px 1px 2px #00000029";
    medium = "0px 2px 2px #00000052, 0px 8px 8px -8px #00000029";
    modalElevated = "0 0 0 1px var(--ds-gray-alpha-400), 0px 32px 72px -12px #0000000f, 0px 8px 32px -12px #00000014, 0px 8px 24px -12px #0000001f";
  };
}
