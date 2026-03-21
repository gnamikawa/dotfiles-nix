#!/usr/bin/env bash

STATE=$(nmcli networking)

if [ "$STATE" = "enabled" ]; then
	nmcli networking off
	notify-send 'Wi-Fi Disabled'
else
	nmcli networking on
	notify-send 'Wi-Fi Enabled'
fi
