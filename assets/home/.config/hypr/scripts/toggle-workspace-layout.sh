#!/usr/bin/env bash

set -euo pipefail

workspace="$(hyprctl activeworkspace -j)"
workspace_id="$(jq --raw-output '.id' <<<"$workspace")"
current_layout="$(jq --raw-output '.tiledLayout' <<<"$workspace")"

case "$current_layout" in
dwindle)
	next_layout=monocle
	;;
monocle)
	next_layout=dwindle
	;;
*)
	printf 'Cannot toggle unsupported workspace layout: %s\n' "$current_layout" >&2
	exit 1
	;;
esac

hyprctl keyword workspace "$workspace_id, layout:$next_layout"
