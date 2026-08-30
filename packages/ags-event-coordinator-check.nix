# ags-event-coordinator-check.nix — regression tests for burst coalescing and
# preventing a second AGS event-coordinator run while one is already active.

{ pkgs }:

let
  inherit (pkgs) lib;
  testFiles = lib.fileset.unions [
    ../assets/home/.config/ags/common/event-coordinator.ts
    ../tests/ags/event-coordinator.test.ts
    ../tests/ags/window-context-wiring.test.ts
    ../tests/ags/package.json
    ../tests/ags/package-lock.json
    ../tests/ags/vitest.config.ts
  ];
  testSource = lib.fileset.toSource {
    root = ../.;
    fileset = testFiles;
  };
  npmSource = lib.fileset.toSource {
    root = ../tests/ags;
    fileset = lib.fileset.unions [
      ../tests/ags/package.json
      ../tests/ags/package-lock.json
    ];
  };
  npmDependencies = pkgs.fetchNpmDeps {
    name = "ags-event-coordinator-check-npm-deps";
    src = npmSource;
    hash = "sha256-1fFldoCPSQj+0CTTwLHCe6NSg80YpnvDOWFJSXdXmdk=";
  };
in
pkgs.buildNpmPackage {
  pname = "ags-event-coordinator-check";
  version = "1";
  src = testSource;
  npmRoot = "tests/ags";
  npmDeps = npmDependencies;
  dontNpmBuild = true;

  installPhase = ''
    runHook preInstall

    npm --prefix tests/ags test
    touch "$out"

    runHook postInstall
  '';
}
