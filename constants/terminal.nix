# terminal.nix — ours, not a transcription: kitty's 16 ANSI slots mapped onto
# the role vocabulary. Geist publishes no ANSI palette, so this block has no
# upstream counterpart to diff against, which is why it does not belong in a
# file meant to diff against Geist (#53). Lifted out of theme.nix unchanged.

let
  theme = import ./theme.nix;
in
{
  selection = {
    background = theme.componentBackground.active.amber;
    text = theme.text.secondary.amber;
  };

  normal = {
    text = theme.text.primary.gray;
    background = theme.background.default;

    error = theme.text.secondary.red;
    warning = theme.text.secondary.amber;
    success = theme.text.secondary.green;

    info = theme.text.secondary.blue;
    secondaryInfo = theme.text.secondary.teal;

    special = theme.text.secondary.purple;
  };

  bright = {
    text = theme.text.primary.gray;
    background = theme.background.default;

    error = theme.text.primary.red;
    warning = theme.text.primary.amber;
    success = theme.text.primary.green;

    info = theme.text.primary.blue;
    secondaryInfo = theme.text.primary.teal;

    special = theme.text.primary.purple;
  };
}
