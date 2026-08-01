#!/usr/bin/env bash
set -eu

case "${1:-}" in
  simulate)
    shift
    exec @simulate@ "$@"
    ;;
  live)
    shift
    # The upstream example loads this before GTK/Wayland; preserve that link
    # order when the AGS launcher starts GJS.
    export LD_PRELOAD="@sessionLockLib@${LD_PRELOAD:+:$LD_PRELOAD}"
    exec @live@ "$@"
    ;;
  *)
    echo "usage: nix run .#lock-prototype -- {simulate|live}" >&2
    exit 2
    ;;
esac
