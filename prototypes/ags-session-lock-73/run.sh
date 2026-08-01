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
    test_dir="$(mktemp -d -p "${XDG_RUNTIME_DIR:?}" lock-prototype-73.XXXXXX)"
    trap 'rm -r "$test_dir"' EXIT
    export LOCK_PROTOTYPE_ACQUIRED_MARKER="$test_dir/acquired"
    export LOCK_PROTOTYPE_RELEASED_MARKER="$test_dir/released"

    set +e
    @live@ "$@"
    status=$?
    set -e

    # A client death after acquisition but before a completed Wayland
    # roundtrip is fail-closed. Prepare and launch the known-good incumbent
    # without needing a command or permission prompt from the locked session.
    if [[ -e "$LOCK_PROTOTYPE_ACQUIRED_MARKER" && ! -e "$LOCK_PROTOTYPE_RELEASED_MARKER" ]]; then
      echo "prototype died while locked; restoring with hyprlock" >&2
      /run/current-system/sw/bin/hyprctl keyword misc:allow_session_lock_restore 1
      if /etc/profiles/per-user/genzo/bin/hyprlock; then
        /run/current-system/sw/bin/hyprctl keyword misc:allow_session_lock_restore 0
      else
        echo "hyprlock recovery failed; session-lock restore remains enabled for TTY recovery" >&2
      fi
    fi
    exit "$status"
    ;;
  *)
    echo "usage: nix run .#lock-prototype -- {simulate|live}" >&2
    exit 2
    ;;
esac
