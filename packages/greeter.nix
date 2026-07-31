# greeter.nix — the greetd greeter as an executable.
#
# This repository ships the login screen's UI and nothing else; system-nix owns
# greetd, the greeter user, and every byte that user is allowed to keep (issue
# #38). So the output here is a bin, and it declares nothing about state.
#
# It is the one AGS surface that is built rather than run from live source.
# /home/genzo is drwx------ and the greeter runs as uid 988, so it could not
# read the asset tree even if we wanted it to — and being a store path is what
# makes the fallback sound: a previous generation's greeter cannot be broken
# retroactively by an edit, so a bad login screen is answered by picking the
# previous generation in GRUB.

{
  pkgs,
  agsPackages,
}:

let
  # Only what the login screen touches. astal4 is the widget/layer-shell layer,
  # greet talks greetd's socket, io is the base library both sit on.
  astalPackages = with agsPackages; [
    io
    astal4
    greet
  ];

  inherit (pkgs) lib;
in
pkgs.stdenv.mkDerivation {
  pname = "genzo-greeter";
  version = "0.1.0";

  # The greeter half of the shared project tree, and nothing else. Narrowing it
  # to these paths is what keeps an edit to the session's app.ts — which needs
  # no rebuild at all — from changing this package's hash and with it the whole
  # system closure.
  src = lib.fileset.toSource {
    root = ../assets/home/.config/ags;
    fileset = lib.fileset.unions [
      ../assets/home/.config/ags/greeter
      ../assets/home/.config/ags/tsconfig.json
    ];
  };

  nativeBuildInputs = [
    pkgs.wrapGAppsHook3
    pkgs.gobject-introspection
    agsPackages.agsFull
    # Rasterises the icons at build time: this GTK has no SVG loader, so the
    # sources stay diffable SVG in the repository and only PNGs are shipped.
    pkgs.resvg
  ];

  buildInputs = astalPackages ++ [ pkgs.gjs ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin $out/share
    cp -r . $out/share

    for icon in $out/share/greeter/icons/*.svg; do
      # 64px for a 16px slot, so the icon stays crisp on a scaled display.
      resvg -w 64 "$icon" "''${icon%.svg}.png"
    done

    # No -d SRC: the bundler already defines it as the entry file's directory
    # (cli/lib/esbuild.go), which is where the icons sit. -r points at the tree
    # root so tsconfig.json is found — the bundler reads it, but its `paths`
    # are overridden by the framework alias esbuild sets for `ags` and `gnim`.
    ags bundle $out/share/greeter/main.tsx $out/bin/genzo-greeter -r $out/share

    runHook postInstall
  '';

  meta = {
    description = "The greetd login screen: a clock, a password prompt, and nothing to choose";
    platforms = lib.platforms.linux;
    mainProgram = "genzo-greeter";
  };
}
