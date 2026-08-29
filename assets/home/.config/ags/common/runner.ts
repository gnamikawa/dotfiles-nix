// The runner's open/closed signal. Alt+F3 flips it via the runner-open IPC
// (see app.tsx); Escape and Enter (submit) flip it back via runner-close.
//
// The runner sits at the same top slot as the window-menu peek (see
// components/WindowMenu.tsx and desktop/Desktop.tsx) but on its own
// layer-shell surface — releasing Alt closes the peek, not the runner.

import { createState } from "ags";

const [state, set] = createState(false);
export const runnerOpen = state;
export const setRunnerOpen = set;
