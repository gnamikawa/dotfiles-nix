# dotfiles-nix

Home-manager configuration for Genzo's machines (desktop and laptop), organised
as importable modules plus raw config assets symlinked into `~/.config`.

## Language

### Package modules

**Base Linux packages** (`modules/base-linux.nix`):
The standard Linux userland that mainstream distributions (e.g. Debian) ship
preinstalled but NixOS deliberately leaves to the user — coreutils, grep, curl,
vim, and kin.
_Avoid_: core packages, essentials

**Etc packages** (`modules/etc.nix`):
The grab-bag of system-adjacent packages with no better home yet: hardware
enablement (wacom, v4l, iOS devices), Wayland utilities, and Nix glue. Known
to be fuzzy; tolerated deliberately.

**User applications** (`modules/user-applications.nix`):
Desktop/GUI applications and development tools chosen by the user, as opposed
to packages a system needs to function.
