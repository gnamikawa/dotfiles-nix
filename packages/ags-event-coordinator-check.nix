# ags-event-coordinator-check.nix — regression tests for burst coalescing and
# preventing a second AGS event-coordinator run while one is already active.

{ pkgs }:

let
  checkScript = ''
    mkdir -p assets/home/.config/ags/common tests
    cp ${../assets/home/.config/ags/common/event-coordinator.ts} \
      assets/home/.config/ags/common/event-coordinator.ts
    cp ${../tests/ags-event-coordinator.test.ts} \
      tests/ags-event-coordinator.test.ts

    node --experimental-strip-types tests/ags-event-coordinator.test.ts
    touch "$out"
  '';
in
pkgs.runCommand "ags-event-coordinator-check" {
  nativeBuildInputs = [ pkgs.nodejs ];
} checkScript
