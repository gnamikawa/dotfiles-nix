// The system-menu overlay's open signal and its verb table.
//
// Sibling of the alt-tab peek: Alt held alone peeks the workspace's clients;
// Alt+Shift held together shades the whole screen and shows a menu of uncommon
// session actions (reload UI, logout, lock, reconnect wifi, reconnect
// bluetooth). Each row's chord is Alt+Shift+<key> — pressed once the modifiers
// are already held, the letter/F-key fires the action without dismissing the
// menu, so the user can visually confirm the chord before releasing.
//
// The two peeks are mutually exclusive. Opening this one closes alt-tab
// (see app.tsx); the letter/F-key binds themselves are ordinary Hyprland binds
// that stand on their own even when the menu isn't up.
//
// The surface that consumes systemMenuOpen lives in desktop/Desktop.tsx and
// its content in components/SystemMenu.tsx.

import { createState } from "ags";

const [state, set] = createState(false);
export const systemMenuOpen = state;
export const setSystemMenuOpen = set;

export interface Verb {
  // Human chord as shown on the row, e.g. "Alt+Shift+R". The Hyprland bind
  // that actually fires it lives in hypr/binds.lua; the string here is purely
  // for the label.
  chord: string;
  label: string;
  description: string;
}

export const VERBS: Verb[] = [
  {
    chord: "Alt+Shift+R",
    label: "Reload UI",
    description: "Restart the AGS session shell",
  },
  {
    chord: "Alt+Shift+E",
    label: "Log out",
    description: "Exit the Hyprland session",
  },
  {
    chord: "Alt+Shift+W",
    label: "Lock",
    description: "Lock the current session",
  },
  {
    chord: "Alt+Shift+F1",
    label: "Reconnect Wi-Fi",
    description: "Cycle the Wi-Fi radio off then on",
  },
  {
    chord: "Alt+Shift+F2",
    label: "Reconnect Bluetooth",
    description: "Cycle the Bluetooth radio off then on",
  },
  {
    chord: "Alt+Shift+F11",
    label: "Hibernate",
    description: "Suspend to disk",
  },
  {
    chord: "Alt+Shift+F12",
    label: "Power off",
    description: "Shut down the machine",
  },
];
