# Apps profile — the terminal layer plus everything graphical that does not
# own the session: applications, their theming, and the hardware bundles.
# This is the layer that is safe to activate on a distribution that already
# ships a desktop of its own.
#
# The boundary against default.nix is *does a thing own the session*, not *is a
# thing graphical* (issue #43): a compositor, a bar, a notification daemon and
# a lock screen own the session; a browser, a terminal emulator and a GTK
# theme do not.

{ ... }:
{
  imports = [
    ./terminal.nix
    ./firefox.nix
    ./keepassxc.nix
    ./kitty.nix
    ./fcitx5.nix
    ./theme.nix
    ./obsidian.nix
    # ./flatpak.nix
    ./packages/nvidia.nix
    ./packages/user-applications.nix
    ./packages/etc.nix
  ];
}
