#!/usr/bin/env bash
engine=$(ibus engine)
if [ "${engine}" == "mozc-on" ]; then
	ibus engine xkb:us::eng
else
	ibus engine mozc-on
fi
