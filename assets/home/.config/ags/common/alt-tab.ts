// The alt-tab overlay's open/closed signal. Hyprland's alt-hold binds toggle
// it via `ags request alt-tab-open` / `ags request alt-tab-close` — the IPC
// wiring lives in app.tsx (requestHandler) and hypr/binds.conf.
//
// State only, no view: the surface that consumes altTabOpen lives in
// desktop/Desktop.tsx and its content in components/AltTab.tsx.

import { createState } from "ags";

const [state, set] = createState(false);
export const altTabOpen = state;
export const setAltTabOpen = set;
