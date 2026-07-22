#!/usr/bin/env bash
# record.sh — toggle GPU screen recording (bound to Ctrl+Shift+5).
#
# First press: pick a screen with the mouse — slurp `-o` snaps the selection to
# whole outputs and `-f '%o'` prints the chosen monitor's name, which is handed
# to gpu-screen-recorder's `-w`. It captures that monitor via KMS/NVFBC (the
# setcap'd gsr-kms-server from the system-nix programs.gpu-screen-recorder
# module — no xdg-desktop-portal picker), encodes H.264 on the GPU (NVENC) with
# desktop audio, and writes a timestamped mp4 under ~/Videos. gpu-screen-recorder
# runs in the FOREGROUND here so this script stays alive to emit the "saved"
# notification once the file is finalised.
#
# Second press: a fresh instance sends SIGINT, which stops and finalises the
# file; gpu-screen-recorder exits and the first instance resumes to notify.
#
# NOTE: "gpu-screen-recorder" is 18 chars but the kernel truncates process names
# to 15, so pgrep/pkill must match the full command line (-f), not the comm (-x).
set -uo pipefail

if pgrep -f gpu-screen-recorder >/dev/null; then
  pkill -SIGINT -f gpu-screen-recorder
  exit 0
fi

# Pick a screen with the mouse (click a monitor; Escape cancels).
mon="$(slurp -o -f '%o')" || exit 0
[ -n "$mon" ] || exit 0

mkdir -p "$HOME/Videos"
out="$HOME/Videos/recording-$(date +%Y-%m-%d-%H%M%S).mp4"

notify-send -t 1500 "Recording" "Started"
gpu-screen-recorder -w "$mon" -f 60 -a default_output -q very_high -k h264 -o "$out"
[ -f "$out" ] && notify-send -t 2500 "Recording" "Saved → $out"
