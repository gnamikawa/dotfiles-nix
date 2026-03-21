#!/usr/bin/env bash

if bluetoothctl show | grep Powered: | grep yes; then
	bluetoothctl power off
	notify-send 'Bluetooth Disabled'
else
	bluetoothctl power on
	notify-send 'Bluetooth Enabled'
fi
