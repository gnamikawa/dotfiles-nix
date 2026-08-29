// The window-context overlay's content: a per-window audio-output router
// keyboard-navigable during the Alt-hold. Rows are the machine's sinks;
// picking one routes ONLY the stream(s) that belong to what the user is
// currently looking at — not every audio stream the app has open.
//
// Scoping (best-effort, in this order):
//   1. Match by media.name substring against the focused window title.
//      Firefox / Chromium / mpv / vlc / spotify all set media.name to
//      something the window title carries, so this pinpoints the tab the
//      user is viewing even across sibling windows of the same PID.
//   2. If no title-match survives (media.name is generic — e.g. Discord),
//      fall back to every RUNNING stream from the focused window's PID.
//
// If the focused window has no streams at all (kitty, an editor, …), the
// card shows a "This window makes no sound" hint instead of routing rows —
// deliberate signal, not a silent nothing (the surface itself stays
// mounted; deciding-and-unmounting inside Desktop.tsx would eat clicks).
//
// Keyboard: Alt+Up/Down cursor the rows, Alt+Return activates the cursored
// one. Click still works for mouse. See app.tsx for the IPC and
// hypr/binds.lua for the keybinds.

import { createBinding, createComputed, createEffect, With } from "ags";
import { Gtk } from "ags/gtk4";
import AstalHyprland from "gi://AstalHyprland";
import AstalWp from "gi://AstalWp";
import {
  audio,
  audioStreamIndex,
  cursorIndex,
  focusPulse,
  setCursorIndex,
  setWindowContextOpen,
  streamPulse,
  wrapCursor,
} from "../common/window-context";

const hyprland = AstalHyprland.get_default();

function attachClick(self: Gtk.Widget, cb: () => void) {
  const gesture = new Gtk.GestureClick();
  gesture.connect("released", () => cb());
  self.add_controller(gesture);
}

export default function WindowContext() {
  const speakers = createBinding(audio, "speakers");
  const streams = createBinding(audio, "streams");
  const defaultSpeaker = createBinding(audio, "defaultSpeaker");

  // Depend on focusPulse and streamPulse, NOT on liveGeom (which fires
  // every 32ms while open). If this recomputes on every poll tick, the
  // <With> below disposes the row widgets between mousedown and mouseup
  // and the click never registers.
  //
  // "matching" narrows to streams that plausibly belong to what the user
  // is looking at — see the file header for the two-step scoping. The
  // highlight comes from the first matching stream's target endpoint; if
  // no matches, we highlight the system default so the row still means
  // something.
  const view = createComputed(() => {
    focusPulse();
    streamPulse();
    const speakerList = speakers() ?? [];
    const streamList = streams() ?? [];
    const info = audioStreamIndex();
    const focused = hyprland.get_focused_client();
    const pid = focused?.pid ?? 0;
    const title = focused?.title ?? "";

    // No state filter — include IDLE / SUSPENDED streams too. Locking to
    // RUNNING means the user cannot pre-route audio: opening a YouTube
    // tab creates an IDLE stream, they'd need to hit play (blaring at
    // whatever the default sink is) before the router even offered a row.
    // ERROR is the only excluded state — those streams cannot accept a
    // set_target_endpoint call.
    const pidStreams = streamList.filter((s: AstalWp.Stream) => {
      const meta = info.get(s.id);
      return (
        meta?.pid === pid && pid > 0 && s.state !== AstalWp.NodeState.ERROR
      );
    });
    const byTitle = pidStreams.filter((s: AstalWp.Stream) => {
      const name = info.get(s.id)?.mediaName ?? "";
      return name.length > 0 && title.includes(name);
    });
    // Fallback is deliberately narrow: only use the "route every pid
    // stream" path when the pid has exactly one stream (single-stream
    // apps like Discord, where title-match is impossible but there's no
    // ambiguity). When Firefox has four tabs playing and the focused
    // tab's title doesn't match any of them, the tab is silent from our
    // perspective — routing all four would silently steal TETR.IO's
    // sink when the user clicked from Outlook.
    // Fallback is deliberately narrow: only use the "route every pid
    // stream" path when the pid has exactly one stream (single-stream
    // apps like Discord, where title-match is impossible but there's no
    // ambiguity). When Firefox has four tabs playing and the focused
    // tab's title doesn't match any of them, the tab is silent from our
    // perspective — routing all four would silently steal TETR.IO's
    // sink when the user clicked from Outlook.
    const matching =
      byTitle.length > 0
        ? byTitle
        : pidStreams.length === 1
          ? pidStreams
          : [];

    const currentTarget =
      matching[0]?.targetEndpoint ?? defaultSpeaker() ?? null;
    return {
      speakers: speakerList,
      matching,
      currentTargetId: currentTarget?.id ?? -1,
    };
  });

  // Reset the cursor only when the focused window changes — an accidental
  // Alt release / re-press on the same window should preserve position so
  // the user can pick up where they left off. Switching to a different
  // window is a fresh context, so start at row 0 there.
  createEffect(() => {
    focusPulse();
    setCursorIndex(0);
  });

  let card: Gtk.Widget | null = null;
  // Force GTK to recompute the card's natural size when the view swaps
  // between "route" and "silent" states. Without this the layer-shell
  // surface stays sized to the tallest content it ever showed (grow is
  // fine; GTK doesn't invalidate the cached natural size on shrink), so a
  // window that just lost its audio options keeps the wide card
  // silhouette from the previous workspace.
  createEffect(() => {
    void view();
    if (!card) return;
    card.set_size_request(-1, -1);
    const win = card.get_root();
    if (win && "set_default_size" in win) {
      // Reset the window's remembered default size so GTK re-derives it
      // from the current natural size instead of the tallest one it ever
      // showed. queue_resize alone doesn't shrink layer-shell surfaces
      // (verified: natural size updates, allocation stays large).
      (win as Gtk.Window).set_default_size(-1, -1);
    }
    card.queue_resize();
  });

  return (
    <box class="window-context-card" $={(self) => (card = self)}>
      <With value={view}>
        {(d) => {
          if (d.speakers.length === 0) {
            return (
              <box class="window-context-empty">
                <label label="No audio outputs" xalign={0} hexpand />
              </box>
            );
          }
          if (d.matching.length === 0) {
            return (
              <box
                class="window-context-empty"
                orientation={Gtk.Orientation.VERTICAL}
                spacing={2}
              >
                <label
                  class="window-context-empty-title"
                  label="This window makes no sound"
                  xalign={0}
                  hexpand
                />
                <label
                  class="window-context-empty-hint"
                  label="Focus a window with audio to route it"
                  xalign={0}
                  hexpand
                />
              </box>
            );
          }
          return (
            <box orientation={Gtk.Orientation.VERTICAL} spacing={0}>
              <box class="window-context-header">
                <label
                  class="window-context-header-label"
                  label="Route this window"
                  xalign={0}
                  hexpand
                />
                <label
                  class="window-context-header-count"
                  label={`${d.matching.length} stream${
                    d.matching.length === 1 ? "" : "s"
                  }`}
                  xalign={1}
                />
              </box>
              {d.speakers.map((sp, i) => (
                <box
                  class={`window-context-row ${
                    sp.id === d.currentTargetId ? "current" : ""
                  } ${
                    // Live cursor class from the cursorIndex accessor so
                    // Alt+Up/Down changes the highlight without a re-render
                    // that would blow away the click gestures.
                    ""
                  }`}
                  $={(self) => {
                    attachClick(self, () => {
                      for (const stream of d.matching) {
                        stream.set_target_endpoint(sp);
                      }
                      setWindowContextOpen(false);
                    });
                    // Toggle .cursored via the cursorIndex accessor, so we
                    // update classes reactively without re-rendering rows.
                    // Wraps like the activate helper: cursor is unbounded
                    // and both sides mod on speakers.length so the visible
                    // highlight and the row Alt+Return picks agree.
                    createEffect(() => {
                      const idx = wrapCursor(
                        cursorIndex(),
                        d.speakers.length,
                      );
                      const isCursored = idx === i;
                      const ctx = self.get_style_context();
                      if (isCursored) ctx.add_class("cursored");
                      else ctx.remove_class("cursored");
                    });
                  }}
                  spacing={10}
                >
                  <image
                    class="window-context-icon"
                    iconName="audio-speakers-symbolic"
                    pixelSize={20}
                  />
                  <label
                    class="window-context-label"
                    label={sp.description || sp.name || "(unknown)"}
                    xalign={0}
                    ellipsize={3}
                    maxWidthChars={40}
                    hexpand
                  />
                  {/* Explicit check-mark for the currently-routed sink
                       rather than a hover-coloured row: the hover / cursor
                       state already owns that grey, and re-using it for
                       "selected" made the two indistinguishable. */}
                  <image
                    class="window-context-check"
                    iconName="object-select-symbolic"
                    pixelSize={14}
                    visible={sp.id === d.currentTargetId}
                  />
                </box>
              ))}
            </box>
          );
        }}
      </With>
    </box>
  );
}
