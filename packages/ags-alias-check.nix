# ags-alias-check.nix — proves AGS resolves the geistdesign tsconfig alias
# during bundling. The session is live-run, so this build is the regression
# gate for its one generated import.

{
  pkgs,
  agsPackages,
  geistdesign,
}:

let
  inherit (pkgs) lib;
in
pkgs.stdenv.mkDerivation {
  pname = "ags-geistdesign-alias-check";
  version = "1";

  src = lib.fileset.toSource {
    root = ../assets/home/.config/ags;
    fileset = lib.fileset.unions [
      ../assets/home/.config/ags/app.ts
      ../assets/home/.config/ags/env.d.ts
      ../assets/home/.config/ags/tsconfig.json
    ];
  };

  nativeBuildInputs = [ agsPackages.agsFull ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    mkdir -p "$out/bin"
    substituteInPlace tsconfig.json \
      --replace-fail /home/genzo/.local/share/geistdesign ${geistdesign}
    ags bundle app.ts "$out/bin/ags-alias-check" -r .

    runHook postInstall
  '';
}
