// The runner's open/closed signal. Alt+F3 flips it via the runner-open IPC
// (see app.tsx); Escape and Enter (submit) flip it back via runner-close.
//
// The runner shares a surface with the alt-tab peek (see components/AltTab.tsx
// and desktop/Desktop.tsx) but its own visibility is independent — releasing
// Alt closes the peek, not the runner.

import { createState } from "ags";

const [state, set] = createState(false);
export const runnerOpen = state;
export const setRunnerOpen = set;
