# Uses vercel's geist design system as a base
# https://vercel.com/geist/colors
#
# Transcribed from the token stylesheet, pinned by content hash so the diff can
# be re-run against the same bytes:
# https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css
#
# Geist publishes the ramps as integer HSL triples, not hex. The hexes below
# carry more precision than that: converted back to integer HSL they land
# bit-exactly on Geist's triples 69 times in 82, and one unit out in a single
# component the rest of the time — they are evidently the values Geist's triples
# were rounded *from*.
#
# The theme name sits near the front of the path — palette.dark.colors.gray."400"
# — rather than at the leaf. theme.nix's colorVariantGenerator maps over
# palette.colors assuming the leaf *is* the value, so a theme level underneath
# it would break the generator (#53).
{
  # Not a Geist colour and not theme-varying: a sentinel meaning "this surface
  # is unstyled". It screams equally loudly in either theme, so it carries no
  # theme level and there is no light counterpart to invent.
  debug = "#ff00ff";

  # Geist declares these once, outside either theme block, and never overrides
  # them — so they carry no theme level either. contrast-fg is the text laid
  # over a saturated fill (a blue-700 button), white against both themes.
  black = "#000000";
  white = "#FFFFFF";
  contrast-fg = "#FFFFFF";

  dark = rec {
    background = {
      "100" = "#0A0A0A";
      "200" = "#000000";
    };

    colors = {
      gray = {
        "100" = "#1a1a1a";
        "200" = "#1f1f1f";
        "300" = "#292929";
        "400" = "#2E2E2E";
        "500" = "#454545";
        "600" = "#878787";
        "700" = "#8F8F8F";
        "800" = "#7D7D7D";
        "900" = "#A0A0A0";
        "1000" = "#EDEDED";
      };

      # Transcribed, never derived. The published scale is not monotonic — 800
      # is less opaque than 700, the same deliberate dip the gray ramp has —
      # so a color-mix() derivation would smooth it and get those steps
      # silently wrong (#53).
      gray-alpha = {
        "100" = "#FFFFFF0F";
        "200" = "#FFFFFF17";
        "300" = "#FFFFFF21";
        "400" = "#FFFFFF24";
        "500" = "#FFFFFF3D";
        "600" = "#FFFFFF82";
        "700" = "#FFFFFF8A";
        "800" = "#FFFFFF78";
        "900" = "#FFFFFF9C";
        "1000" = "#FFFFFFEB";
      };

      blue = {
        "100" = "#0F1B2D";
        "200" = "#10243E";
        "300" = "#0F3058";
        "400" = "#0D3868";
        "500" = "#0A4481";
        "600" = "#0091FF";
        "700" = "#0070F3";
        "800" = "#0060D1";
        "900" = "#52A9FF";
        "1000" = "#EAF6FF";
      };

      red = {
        "100" = "#2A1314";
        "200" = "#3D1719";
        "300" = "#551A1E";
        "400" = "#671E22";
        "500" = "#822025";
        "600" = "#E5484D";
        "700" = "#E5484D";
        "800" = "#DA3036";
        "900" = "#FF6369";
        "1000" = "#FEECEE";
      };

      amber = {
        "100" = "#271700";
        "200" = "#341C00";
        "300" = "#4A2900";
        "400" = "#573300";
        "500" = "#693F05";
        "600" = "#E79C13";
        "700" = "#FFB224";
        "800" = "#FF990A";
        "900" = "#F1A10D";
        "1000" = "#FEF3DD";
      };

      green = {
        "100" = "#0B2211";
        "200" = "#0F2C17";
        "300" = "#11351B";
        "400" = "#0C461B";
        "500" = "#126427";
        "600" = "#1A9338";
        "700" = "#46A758";
        "800" = "#388E4A";
        "900" = "#63C174";
        "1000" = "#E5FBEB";
      };

      teal = {
        "100" = "#04201B";
        "200" = "#062923";
        "300" = "#083A33";
        "400" = "#053C34";
        "500" = "#085E53";
        "600" = "#0C9784";
        "700" = "#12A594";
        "800" = "#0D8C7D";
        "900" = "#0AC5B3";
        "1000" = "#E1FAF4";
      };

      purple = {
        "100" = "#221527";
        # Was "#432155", which converts to hsl(279, 44%, 23%) — Geist's purple
        # *300*, so this step held the next one's colour. That is not the hex
        # on the line below: the two differ by one unit in two channels, which
        # is finer than the integer HSL Geist publishes, so they are the same
        # colour and the duplication went unseen. Geist's two generations of
        # colour tokens disagree on the real 200: the current one resolves
        # through integer-HSL indirection to hsl(281, 38%, 16%) = #2E1938,
        # while the older literal hexes and their oklch twin both say #341142.
        # We take the current generation — it wins the sRGB cascade, and every
        # other value in this ramp already matches it (#53).
        "200" = "#2E1938";
        "300" = "#422154";
        "400" = "#4E2667";
        "500" = "#5F2D84";
        "600" = "#8E4EC6";
        "700" = "#8E4EC6";
        "800" = "#763DA9";
        "900" = "#BF7AF0";
        "1000" = "#F7ECFC";
      };

      pink = {
        "100" = "#27141C";
        "200" = "#3C1827";
        "300" = "#4F1C31";
        "400" = "#541B33";
        "500" = "#6C1E3F";
        "600" = "#B21A57";
        "700" = "#E93D82";
        "800" = "#DE2670";
        "900" = "#F76190";
        "1000" = "#FEECF4";
      };
    };

    # Default text. Geist writes the literal rather than aliasing white, so
    # this is a transcription and not a reference.
    foreground = "#FFFFFF";

    # Geist aliases these into the ramps, which is the design decision worth
    # keeping: selection is the top of the gray ramp, its text the bottom.
    selection = colors.gray."1000";
    selection-text-color = colors.gray."100";
    link-color = colors.blue."900";
  };
}
