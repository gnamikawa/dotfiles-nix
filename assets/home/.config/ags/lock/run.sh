#!/usr/bin/env bash
set -eu

# Gtk4SessionLock must be loaded before GTK/Wayland, matching the upstream
# session-lock examples and the validated prototype.
export LD_PRELOAD="@sessionLockLib@${LD_PRELOAD:+:$LD_PRELOAD}"
export FONTCONFIG_FILE="@fontconfigFile@"
exec @lock@ "$@"
