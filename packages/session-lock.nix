# session-lock.nix — the production, on-demand AGS session-lock executable.
# It is deliberately separate from the persistent desktop-shell process and
# has no service or restart policy: process death is fail-closed and recovery
# is a deliberate TTY procedure (issue #73).

{
  pkgs,
  agsPackages,
  constants,
  geistdesign,
}:

let
  inherit (pkgs) lib;
  fontconfigFile = pkgs.makeFontsConf {
    fontDirectories = [ pkgs.geist-font ];
    # The host's newer Fontconfig fragments use constructs the pinned Nix
    # library rejects. The lock needs only its packaged fonts, not host aliases.
    includes = [ ];
    impureFontDirectories = [ ];
  };
in
pkgs.stdenv.mkDerivation {
  pname = "genzo-session-lock";
  version = "0.1.0";

  src = lib.fileset.toSource {
    root = ../assets/home/.config/ags;
    fileset = lib.fileset.unions [
      ../assets/home/.config/ags/lock
      ../assets/home/.config/ags/greeter/icons
      ../assets/home/.config/ags/greeter/power.ts
      ../assets/home/.config/ags/greeter/style.css
      ../assets/home/.config/ags/greeter/sysinfo.ts
      ../assets/home/.config/ags/tsconfig.json
    ];
  };

  nativeBuildInputs = [
    pkgs.wrapGAppsHook3
    pkgs.gobject-introspection
    agsPackages.agsFull
    pkgs.resvg
  ];

  buildInputs = [
    pkgs.gjs
    pkgs.gtk4-layer-shell
    pkgs.geist-font
    agsPackages.io
    agsPackages.astal4
    agsPackages.auth
  ];

  dontConfigure = true;
  dontBuild = true;
  doCheck = true;

  checkPhase = ''
    runHook preCheck

    test_bundle="$NIX_BUILD_TOP/session-lock-machine-test"
    ags bundle lock/machine.test.ts "$test_bundle" -r . --gtk 4
    "$test_bundle"

    runHook postCheck
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin $out/share/genzo-session-lock
    cp -r . $out/share/genzo-session-lock/source
    # The stylesheet is imported as text into a generated script, so GTK has
    # no source-file base from which to resolve a relative CSS import. Point it
    # at the immutable token sheet before bundling, as the prototype did.
    substituteInPlace $out/share/genzo-session-lock/source/greeter/style.css \
      --replace-fail '../geistdesign.css' 'file://${geistdesign}/geistdesign.css'

    for icon in $out/share/genzo-session-lock/source/greeter/icons/*.svg; do
      substituteInPlace "$icon" \
        --replace-fail 'stroke="currentColor"' 'stroke="${constants.palette.dark.colors.amber."1000"}"'
      resvg -w 64 "$icon" "''${icon%.svg}.png"
    done

    ags bundle \
      $out/share/genzo-session-lock/source/lock/main.tsx \
      $out/share/genzo-session-lock/lock \
      -r $out/share/genzo-session-lock/source

    substitute $out/share/genzo-session-lock/source/lock/run.sh $out/bin/genzo-session-lock \
      --subst-var-by lock $out/share/genzo-session-lock/lock \
      --subst-var-by sessionLockLib ${pkgs.gtk4-layer-shell}/lib/libgtk4-layer-shell.so \
      --subst-var-by fontconfigFile ${fontconfigFile}
    chmod +x $out/bin/genzo-session-lock

    runHook postInstall
  '';

  meta = {
    description = "Geist-styled AGS session lock using Astal Auth and Gtk4SessionLock";
    platforms = lib.platforms.linux;
    mainProgram = "genzo-session-lock";
  };
}
