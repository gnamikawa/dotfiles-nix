# ags.nix — the AGS v3 desktop shell: package, launch unit, and the editor's
# view of the framework types. The shell itself (app.tsx and every surface) is
# a raw asset under assets/home/.config/ags/, symlinked out-of-store by
# modules/assets.nix, so surfaces are edited live and picked up on restart
# (ADR-0005, refined by issue #32 — AGS has no hot reload).
#
# One process serves every user-session surface: bar, notifications,
# launcher, OSD, action hub. The greetd greeter is a separate process under a
# different user and is wired from system-nix, not here.

{
  config,
  agsFull,
  geistdesign,
  sessionLock,
  pkgs,
  ...
}:

let
  # Wrap last. agsFull already carries its Astal libraries from construction,
  # so nothing is `.override`n after this point — issue #37 measured that an
  # override applied to an already-wrapped package alters the derivation hash
  # while reaching nothing, surfacing only as a failed TSX import at runtime.
  agsPackage = config.lib.nixGL.wrap agsFull;
  # This is a complete package, so wrapping happens after its construction.
  # On NixOS the wrapper is the identity; standalone desktop profiles need it
  # to reach the host's graphics drivers.
  sessionLockPackage = config.lib.nixGL.wrap sessionLock;
in
{
  home.packages = [
    agsPackage
    sessionLockPackage
    pkgs.geist-font
  ];

  # The framework's own JS/TS library, at a path that never changes while its
  # target follows each update. assets/home/.config/ags/tsconfig.json points
  # its `paths` here so the editor can typecheck the shell; `ags run` does not
  # consult it — the CLI resolves the framework from its own store path.
  home.file.".local/share/ags".source = agsFull.jsPackage;

  # Like the framework library above, this is a stable string for the editor
  # and the live AGS bundler. Its target changes with constants/, not the
  # committed tsconfig path. The greeter cannot read this home path and takes
  # the same package directly from the store while it is bundled.
  home.file.".local/share/geistdesign".source = geistdesign;

  systemd.user.services.ags = {
    Unit = {
      Description = "AGS desktop shell";
      After = [ "graphical-session.target" ];
      PartOf = [ "graphical-session.target" ];
    };
    Service = {
      Type = "simple";
      # No -d: `ags run` searches $XDG_CONFIG_HOME/ags for an app entry file,
      # which is the asset symlink.
      ExecStart = "${agsPackage}/bin/ags run";
      Restart = "on-failure";
      # The shell spawns gjs; mixed keeps stray children from outliving it.
      KillMode = "mixed";
    };
    Install.WantedBy = [ "graphical-session.target" ];
  };
}
