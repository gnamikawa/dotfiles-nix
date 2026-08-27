// The bar's content: a single clock, and deliberately nothing else. The
// layer-shell surface that hosts it lives in desktop/Desktop.tsx, so Bar
// takes no props of its own and grows in place as later components land
// beside it.

import { createPoll } from "ags/time";

export default function Bar() {
  const time = createPoll("", 1000, () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  );

  return (
    <box class="bar-content">
      <label class="text-button-14" label={time} />
    </box>
  );
}
