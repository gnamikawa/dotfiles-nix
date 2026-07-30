# terminal.nix — ours, not a transcription: kitty's 16 ANSI slots mapped onto
# the role vocabulary. Geist publishes no ANSI palette, so this block has no
# upstream counterpart to diff against, which is why it does not belong in a
# file meant to diff against Geist (#53). Lifted out of theme.nix unchanged.
#
# Mapped over every theme rather than naming one, so this file needs no edit
# when a second theme appears — unlike theme.nix, whose source attrset also
# holds non-theme keys.

let
  theme = import ./theme.nix;

  ansiSlots = t: {
    selection = {
      background = t.componentBackground.active.amber;
      text = t.text.secondary.amber;
    };

    normal = {
      text = t.text.primary.gray;
      background = t.background.default;

      error = t.text.secondary.red;
      warning = t.text.secondary.amber;
      success = t.text.secondary.green;

      info = t.text.secondary.blue;
      secondaryInfo = t.text.secondary.teal;

      special = t.text.secondary.purple;
    };

    bright = {
      text = t.text.primary.gray;
      background = t.background.default;

      error = t.text.primary.red;
      warning = t.text.primary.amber;
      success = t.text.primary.green;

      info = t.text.primary.blue;
      secondaryInfo = t.text.primary.teal;

      special = t.text.primary.purple;
    };
  };
in
builtins.mapAttrs (_: ansiSlots) theme
