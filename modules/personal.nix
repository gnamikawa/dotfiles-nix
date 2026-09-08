# Personal profile — non-work extras layered on top of the full desktop.
# Games and anything else that belongs on a personal account but has no
# place on a work machine goes here.
#
# The boundary against apps.nix is *is this for work-adjacent use*, not *is
# this graphical*: apps.nix is the general application layer; this file is
# the layer that stays off a work profile even when the account is otherwise
# identical.

{ ... }:
{
  imports = [
    ./panelattack.nix
  ];
}
