#!/usr/bin/env bash
# record.sh — toggle GPU-accelerated screen recording (bound to Ctrl+5).
#
# First press: start gpu-screen-recorder capturing through the
# xdg-desktop-portal ScreenCast picker (pick a source each time), with desktop
# audio, encoding H.264 via NVENC to a timestamped mp4 under ~/Videos. gsr runs
# in the FOREGROUND here so this script stays alive to emit the "saved"
# notification once the file is finalised.
#
# Second press: a fresh instance finds the running gsr and sends it SIGINT,
# which stops and finalises the recording. gsr then exits, the first instance
# resumes past the wait and notifies with the saved path. A cancelled portal
# picker leaves no file, so the guard keeps that case silent.
set -uo pipefail

if pgrep -x gpu-screen-recorder >/dev/null; then
  pkill -SIGINT -x gpu-screen-recorder
  exit 0
fi

mkdir -p "$HOME/Videos"
out="$HOME/Videos/recording-$(date +%Y-%m-%d-%H%M%S).mp4"

notify-send -t 1500 "Recording" "Started"
gpu-screen-recorder -w portal -f 60 -a default_output -q very_high -o "$out"
[ -f "$out" ] && notify-send -t 2500 "Recording" "Saved → $out"
