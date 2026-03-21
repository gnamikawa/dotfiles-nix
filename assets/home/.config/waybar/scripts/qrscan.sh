#!/usr/bin/env bash

# Disable autofocus
v4l2-ctl --set-ctrl=focus_automatic_continuous=0

# Temporary file for zbar output
TMPFILE=$(mktemp)

# Start zbarcam in the background
zbarcam --set "disable" --set "qrcode.enable" --prescale=800x800 -1 --raw /dev/video0 --nodisplay >"$TMPFILE" &
ZBAR_PID=$!

notify-send "Scanning for QR code..."
for ((i = 0; i < 10; i++)); do
	for ((j = 0; j <= 250; j += 10)); do
		v4l2-ctl --set-ctrl=focus_absolute=$j
		sleep .01
	done
done

# Read QR code result
URL=$(cat "$TMPFILE")
rm "$TMPFILE"

if [ -n "$URL" ]; then
	notify-send "Opening URL in browser..." "$URL"
	xdg-open "$URL"
else
	notify-send "Failed to scan QR code."
	kill $ZBAR_PID
fi

# Restore autofocus
v4l2-ctl --set-ctrl=focus_automatic_continuous=1
