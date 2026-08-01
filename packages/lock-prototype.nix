{ pkgs, agsPackages, geistdesign }:

pkgs.stdenv.mkDerivation {
  pname = "ags-session-lock-prototype-73";
  version = "0.0.0";
  src = ../prototypes/ags-session-lock-73;

  nativeBuildInputs = [
    pkgs.wrapGAppsHook3
    pkgs.gobject-introspection
    agsPackages.agsFull
  ];

  buildInputs = [
    pkgs.gjs
    pkgs.gtk4-layer-shell
    agsPackages.io
    agsPackages.astal4
    agsPackages.auth
  ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall
    mkdir -p $out/bin $out/share/ags-session-lock-prototype-73
    cp -r . $out/share/ags-session-lock-prototype-73/source
    cp ${geistdesign}/geistdesign.css ./geistdesign.css
    substituteInPlace style.css \
      --replace-fail './geistdesign.css' 'file://${geistdesign}/geistdesign.css'
    ags bundle --gtk 4 main.tsx $out/share/ags-session-lock-prototype-73/live -r .
    ags bundle --gtk 4 simulate.ts $out/share/ags-session-lock-prototype-73/simulate -r .
    substitute run.sh $out/bin/ags-session-lock-prototype-73 \
      --subst-var-by live $out/share/ags-session-lock-prototype-73/live \
      --subst-var-by simulate $out/share/ags-session-lock-prototype-73/simulate \
      --subst-var-by sessionLockLib ${pkgs.gtk4-layer-shell}/lib/libgtk4-layer-shell.so
    chmod +x $out/bin/ags-session-lock-prototype-73
    runHook postInstall
  '';

  meta.mainProgram = "ags-session-lock-prototype-73";
}
