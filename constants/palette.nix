# Uses vercel's geist design system as a base
# https://vercel.com/geist/colors
#
# Transcribed from the token stylesheet, pinned by content hash so the diff can
# be re-run against the same bytes:
# https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css
#
# The theme name sits near the front of the path — palette.dark.colors.gray."400"
# — rather than at the leaf. theme.nix's colorVariantGenerator maps over
# palette.colors assuming the leaf *is* the value, so a theme level underneath
# it would break the generator (#53).
#
# Geist publishes the ramps as integer HSL triples, not hex. The dark hexes
# below carry more precision than that: converted back to integer HSL they land
# bit-exactly on Geist's triples 69 times in 82, and one unit out in a single
# component the rest of the time — they are evidently the values Geist's triples
# were rounded *from*. No such source exists for light, whose only other
# representation in the stylesheet is a superseded generation with different
# colours entirely, so the light hexes are converted from the triples. They are
# what a browser paints for those hsl() values, and may sit 1/255 per channel
# from whatever hex Geist rounded to get them (#56).
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

  light = rec {
    background = {
      "100" = "#FFFFFF";
      "200" = "#FAFAFA";
    };

    colors = {
      gray = {
        "100" = "#F2F2F2";
        "200" = "#EBEBEB";
        "300" = "#E6E6E6";
        "400" = "#EBEBEB";
        "500" = "#C9C9C9";
        "600" = "#A8A8A8";
        "700" = "#8F8F8F";
        "800" = "#7D7D7D";
        "900" = "#4D4D4D";
        "1000" = "#171717";
      };

      # 200 and 400 are the same byte upstream, as 700/800 are in the gray ramp
      # above. Transcribed as published.
      gray-alpha = {
        "100" = "#0000000D";
        "200" = "#00000014";
        "300" = "#0000001A";
        "400" = "#00000014";
        "500" = "#00000036";
        "600" = "#00000057";
        "700" = "#00000070";
        "800" = "#00000082";
        "900" = "#000000B3";
        "1000" = "#000000E8";
      };

      blue = {
        "100" = "#F0F7FF";
        "200" = "#EBF5FF";
        "300" = "#E0F0FF";
        "400" = "#CCE6FF";
        "500" = "#99CEFF";
        "600" = "#52AEFF";
        "700" = "#0072F5";
        "800" = "#0062D1";
        "900" = "#0068D6";
        "1000" = "#00254D";
      };

      red = {
        "100" = "#FFF0F0";
        "200" = "#FFEBEB";
        "300" = "#FFE5E5";
        "400" = "#FDD8D8";
        "500" = "#F8B9B9";
        "600" = "#F87275";
        "700" = "#E5484D";
        "800" = "#DA2F35";
        "900" = "#CB2A2F";
        "1000" = "#391417";
      };

      amber = {
        "100" = "#FFF6E5";
        "200" = "#FFF4D6";
        "300" = "#FEF0CD";
        "400" = "#FFDD8F";
        "500" = "#FFC96B";
        "600" = "#F5B047";
        "700" = "#FFB224";
        "800" = "#FF990A";
        "900" = "#A35200";
        "1000" = "#4E2009";
      };

      green = {
        "100" = "#EFFBEF";
        "200" = "#EBFAEB";
        "300" = "#DAF6DA";
        "400" = "#C6F1C7";
        "500" = "#99E59E";
        "600" = "#6CDA75";
        "700" = "#45A557";
        "800" = "#398E4A";
        "900" = "#297A3A";
        "1000" = "#1B311E";
      };

      teal = {
        "100" = "#EEFCF9";
        "200" = "#E5FAF6";
        "300" = "#D4F7F0";
        "400" = "#BEF4EB";
        "500" = "#86EAD9";
        "600" = "#45DEC5";
        "700" = "#12A594";
        "800" = "#0D8C7D";
        "900" = "#067A6E";
        "1000" = "#073C34";
      };

      purple = {
        "100" = "#F9F0FF";
        "200" = "#F9F1FE";
        "300" = "#F4E8FC";
        "400" = "#EDDCF9";
        "500" = "#D5B1F1";
        "600" = "#BF89EC";
        "700" = "#8E4EC6";
        "800" = "#763DA9";
        "900" = "#7820BC";
        "1000" = "#2E004D";
      };

      pink = {
        "100" = "#FFEBF5";
        "200" = "#FEECF2";
        "300" = "#FCE3EC";
        "400" = "#F9D7E2";
        "500" = "#F5B8CC";
        "600" = "#EE87A7";
        "700" = "#EA3E83";
        "800" = "#DF2670";
        "900" = "#BD2864";
        "1000" = "#430A23";
      };
    };

    foreground = "#000000";

    selection = colors.gray."1000";
    selection-text-color = colors.gray."100";
    link-color = colors.blue."700";
  };
}
