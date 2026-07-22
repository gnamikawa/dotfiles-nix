#!/usr/bin/env bash
# record.sh — toggle GPU-accelerated screen recording (bound to Ctrl+Shift+5).
#
# First press: pick a screen with the mouse — slurp `-o` snaps the selection to
# whole outputs, so a click selects a monitor. wf-recorder then captures that
# geometry via wlr-screencopy (the same protocol grim uses) and encodes H.264
# on the GPU (NVENC) with desktop audio to a timestamped mp4 under ~/Videos.
# wf-recorder runs in the FOREGROUND here so this script stays alive to emit the
# "saved" notification when recording ends.
#
# Second press: a fresh instance finds the running wf-recorder and sends it
# SIGINT, which stops and finalises the file; wf-recorder exits, the first
# instance resumes past the wait and notifies. Cancelling the slurp pick
# (Escape) starts nothing and stays silent.
set -uo pipefail

if pgrep -x wf-recorder >/dev/null; then
  pkill -SIGINT -x wf-recorder
  exit 0
fi

# Pick a screen with the mouse (click a monitor; Escape cancels).
geom="$(slurp -o)" || exit 0
[ -n "$geom" ] || exit 0

mkdir -p "$HOME/Videos"
out="$HOME/Videos/recording-$(date +%Y-%m-%d-%H%M%S).mp4"

# NVENC H.264, desktop audio from the default sink's monitor source. If NVENC
# does not engage on this box, drop `-c h264_nvenc -x yuv420p` for software x264.
notify-send -t 1500 "Recording" "Started"
wf-recorder -g "$geom" -r 60 -c h264_nvenc -x yuv420p \
  --audio="$(pactl get-default-sink).monitor" -f "$out"
[ -f "$out" ] && notify-send -t 2500 "Recording" "Saved → $out"
