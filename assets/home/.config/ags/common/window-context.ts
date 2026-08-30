// The window-context overlay's open/closed signal plus the placement
// primitive that pins the card to the focused client's outer edge.
//
// Piggybacks on the Alt-hold window-menu — no separate trigger. app.tsx's
// window-menu-open/close handlers flip windowContextOpen in lockstep, so
// pressing Alt pops both the Alt-Tab list and this router together, and
// releasing Alt drops both. Uses Alt (not Super) because SUPER is the drag
// modifier: holding Super to interact with a card would grab the underlying
// window instead of clicking the row.
//
// Positioning: Hyprland's socket2 does NOT emit movewindow/windowmoved
// events for interactive drags or `moveactive` dispatches — activewindow
// re-fires only when focus changes, not on spatial moves. So a
// notify-driven pulse leaves the card stuck the moment you start a drag.
// The workaround is a 32ms `hyprctl -j activewindow` poll gated on the
// menu being open — off by default, on while the peek is up, off again on
// release. Live geometry drives placement and the per-window audio filter.
//
// The surface that consumes windowContextOpen lives in desktop/Desktop.tsx
// and its content in components/WindowContext.tsx.

import { createExternal, createState } from "ags";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import AstalHyprland from "gi://AstalHyprland";
import AstalWp from "gi://AstalWp";

import { createEventCoordinator } from "./event-coordinator";

const TITLE_SETTLE_MS = 150;

/** Schedule one GLib callback and remove its source after it fires. */
function scheduleOnce(delayMs: number, callback: () => void): number {
  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, delayMs, () => {
    callback();
    return GLib.SOURCE_REMOVE;
  });
}

const [state, set] = createState(false);
export const windowContextOpen = state;
export const setWindowContextOpen = set;

// Cursor index for keyboard navigation of the router's speaker rows.
// Alt+Up/Down move it, Alt+Return activates. Consumers do their own
// modulo clamping against the row count (the max is unknown here).
const [cursor, setCursor] = createState(0);
export const cursorIndex = cursor;
export const setCursorIndex = setCursor;
/**
 * Move the cursor by `delta` without clamping.
 *
 * The cursor is unbounded on purpose — {@link wrapCursor} is applied at read
 * time, so callers can just increment and let the wrap fall out later.
 *
 * @param delta - Signed step to add to the raw cursor value.
 */
export const nudgeCursor = (delta: number) => setCursor((v) => v + delta);

const hyprland = AstalHyprland.get_default();
export const audio = AstalWp.get_default().audio;

// A pulse driven immediately by focused-client swaps and, after a short
// quiet period, by Hyprland title changes. Settled Hyprland title changes
// carry Firefox tab switches to the router (same client, same PID, different
// title), but terminal spinners can rewrite their title ten times per second.
// We do NOT depend on liveGeom (the 32ms poll) because content must not
// re-render during a drag: doing so disposes row widgets between mousedown
// and mouseup and swallows the click.
export const focusPulse = createExternal(0, (set) => {
  let tick = 0;
  /** Emit the next subscription tick, forcing a re-read by consumers. */
  const bump = () => set(++tick);
  const pulses = createEventCoordinator({
    delayMs: TITLE_SETTLE_MS,
    run: bump,
    schedule: scheduleOnce,
    cancel: (id) => GLib.source_remove(id),
  });
  const idFc = hyprland.connect("notify::focused-client", () =>
    pulses.requestImmediate(),
  );
  const idEv = hyprland.connect("event", (_h, name: string) => {
    // The v1 and v2 title events describe the same change. Hyprland also
    // re-emits activewindow for title-only changes, so focused-client notify
    // owns real focus swaps while one v2 title event owns settled renames.
    if (name === "windowtitlev2") pulses.requestDebounced();
  });
  return () => {
    hyprland.disconnect(idFc);
    hyprland.disconnect(idEv);
    pulses.dispose();
  };
});

// A pulse driven by any per-stream signal that affects our view: state
// transitions (RUNNING / IDLE / SUSPENDED) and target-endpoint reroutes.
// AstalWp doesn't fan either up to the Audio-level signals, so we
// subscribe per-stream and re-thread as streams appear and disappear.
// The "current" highlight in the picker follows the target-endpoint —
// without notify::target-endpoint it would freeze on whatever the first
// render happened to see.
export const streamPulse = createExternal(0, (set) => {
  let tick = 0;
  /** Emit the next subscription tick, forcing a re-read by consumers. */
  const bump = () => set(++tick);
  const perStream = new Map<AstalWp.Stream, number[]>();

  /**
   * Wire a single stream's state and target-endpoint notifiers into
   * {@link bump}. Idempotent — a stream already tracked is left alone.
   *
   * @param stream - AstalWp stream to observe.
   */
  function subscribe(stream: AstalWp.Stream) {
    if (perStream.has(stream)) return;
    perStream.set(stream, [
      stream.connect("notify::state", bump),
      stream.connect("notify::target-endpoint", bump),
    ]);
  }
  /**
   * Detach every notifier previously attached by {@link subscribe} and drop
   * the stream from the tracked set.
   *
   * @param stream - The stream whose notifiers should be released.
   */
  function unsubscribe(stream: AstalWp.Stream) {
    const ids = perStream.get(stream);
    if (!ids) return;
    for (const id of ids) stream.disconnect(id);
    perStream.delete(stream);
  }
  /**
   * Bring the per-stream subscriptions in line with the live stream set.
   *
   * Drops subscriptions to streams that have gone away and adds them for
   * new ones, then emits one tick so views repaint even when no
   * per-stream signal fires in the same beat.
   */
  function reconcile() {
    const live = new Set(audio.streams ?? []);
    for (const s of perStream.keys()) if (!live.has(s)) unsubscribe(s);
    for (const s of live) subscribe(s);
    bump();
  }

  reconcile();
  const h1 = audio.connect("stream-added", reconcile);
  const h2 = audio.connect("stream-removed", reconcile);
  return () => {
    audio.disconnect(h1);
    audio.disconnect(h2);
    for (const s of [...perStream.keys()]) unsubscribe(s);
  };
});

export type Geom = {
  pid: number;
  x: number;
  y: number;
  w: number;
  h: number;
  monX: number;
  monY: number;
  monW: number;
  monH: number;
  connector: string | null;
};

// Fresh focused-window geometry, sampled every 32ms while the menu is open.
// The producer only spins the poll timer when windowContextOpen is true —
// closing the peek stops the shell-outs. Nothing here reads from
// AstalHyprland's cached client state because that cache doesn't refresh
// during interactive drag; hyprctl -j is the authoritative source.
export const liveGeom = createExternal<Geom | null>(null, (mut) => {
  let source: number | null = null;
  let disposed = false;
  let inFlight = false;

  /**
   * Kick off one asynchronous `hyprctl -j activewindow` read and mutate
   * the external with the parsed geometry when it lands.
   *
   * Guards against overlap (`inFlight`) and disposal so a stale reply
   * arriving after teardown does not resurrect a null-checked closure.
   */
  function fetchOnce() {
    if (disposed || inFlight) return;
    inFlight = true;
    const proc = Gio.Subprocess.new(
      ["hyprctl", "-j", "activewindow"],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE,
    );
    proc.communicate_utf8_async(null, null, (subproc, res) => {
      inFlight = false;
      if (disposed) return;
      let text = "";
      try {
        text = subproc!.communicate_utf8_finish(res)[1] ?? "";
      } catch {
        return;
      }
      let win: Record<string, unknown>;
      try {
        win = JSON.parse(text);
      } catch {
        return;
      }
      if (!win || !Array.isArray(win.at) || !Array.isArray(win.size)) {
        mut(null);
        return;
      }
      const monitorId = win.monitor as number;
      const monitor = hyprland
        .get_monitors()
        .find((m) => m.id === monitorId);
      if (!monitor) {
        mut(null);
        return;
      }
      const [x, y] = win.at as [number, number];
      const [w, h] = win.size as [number, number];
      mut({
        pid: (win.pid as number) || 0,
        x,
        y,
        w,
        h,
        monX: monitor.x,
        monY: monitor.y,
        monW: monitor.width,
        monH: monitor.height,
        connector: monitor.name,
      });
    });
  }

  /**
   * Reconcile the 32ms poll timer with the peek's open state.
   *
   * Starts the timer (and does one immediate {@link fetchOnce}) when the
   * peek opens; tears it down and clears the last-known geometry when the
   * peek closes. Called on subscribe and again whenever
   * `windowContextOpen` changes.
   */
  function ensure() {
    const shouldRun = !disposed && windowContextOpen.peek();
    if (shouldRun && source == null) {
      fetchOnce();
      source = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 32, () => {
        if (disposed) return GLib.SOURCE_REMOVE;
        fetchOnce();
        return GLib.SOURCE_CONTINUE;
      });
    } else if (!shouldRun && source != null) {
      GLib.source_remove(source);
      source = null;
      mut(null);
    }
  }

  const unsub = windowContextOpen.subscribe(ensure);
  ensure();

  return () => {
    disposed = true;
    unsub();
    if (source != null) {
      GLib.source_remove(source);
      source = null;
    }
  };
});

// Placement hints. The layer-shell surface sizes to content, so these are
// only used to pick a side — the real width/height are whatever the child
// draws. Overshooting the hints means "fit next to window" fails-safe by
// falling through to overlay, not by clipping.
const MENU_WIDTH_HINT = 340;
const MENU_HEIGHT_HINT = 240;
const GAP = 8;

export type WindowContextPlacement = {
  connector: string | null;
  marginLeft: number;
  marginTop: number;
};

/**
 * Pick where the router card lands relative to the focused window.
 *
 * Right of window if it fits; else left of window if that fits; else
 * overlaid at the window's top-left corner. Coordinates are converted from
 * Hyprland's compositor-global frame to the target monitor's local frame
 * because layer-shell margins are output-relative.
 *
 * @param g - Live focused-window geometry from {@link liveGeom}, or `null`
 *   when no window is focused.
 * @returns Layer-shell placement for the router surface, with a `null`
 *   connector when there is nothing to place against.
 */
export function computePlacement(g: Geom | null): WindowContextPlacement {
  if (!g) return { connector: null, marginLeft: 0, marginTop: 0 };
  const localX = g.x - g.monX;
  const localY = g.y - g.monY;
  const rightEdge = localX + g.w;
  const leftGap = localX;
  const rightGap = g.monW - rightEdge;

  let marginLeft: number;
  if (rightGap >= MENU_WIDTH_HINT + GAP) {
    marginLeft = rightEdge + GAP;
  } else if (leftGap >= MENU_WIDTH_HINT + GAP) {
    marginLeft = localX - MENU_WIDTH_HINT - GAP;
  } else {
    marginLeft = localX + GAP;
  }

  const marginTop = Math.max(0, Math.min(localY, g.monH - MENU_HEIGHT_HINT));
  return { connector: g.connector, marginLeft, marginTop };
}

/**
 * Compute the set of streams the router should retarget for whatever the
 * user is looking at.
 *
 * Two-step scoping — pid first, then title-substring inside that pid.
 * See `components/WindowContext.tsx`'s header for the full rationale;
 * kept in `common/` because the Alt+Return activator needs the same
 * logic without going through the component's reactive view.
 *
 * No state filter beyond ERROR: pre-routing an IDLE stream is the whole
 * point — the user needs to steer where the audio will land before they
 * hit play, or their unmuted default speakers announce it to the room.
 *
 * @returns Streams whose target-endpoint the router should switch, or an
 *   empty array when nothing safely matches.
 */
export function focusedMatchingStreams(): AstalWp.Stream[] {
  const focused = hyprland.get_focused_client();
  const pid = focused?.pid ?? 0;
  if (pid <= 0) return [];
  const title = focused?.title ?? "";
  const info = audioStreamIndex.peek();
  const streamList = audio.streams ?? [];
  const pidStreams = streamList.filter((s) => {
    const meta = info.get(s.id);
    return meta?.pid === pid && s.state !== AstalWp.NodeState.ERROR;
  });
  const byTitle = pidStreams.filter((s) => {
    const name = info.get(s.id)?.mediaName ?? "";
    return name.length > 0 && title.includes(name);
  });
  // Narrow fallback — see the routing note in components/WindowContext.tsx.
  if (byTitle.length > 0) return byTitle;
  if (pidStreams.length === 1) return pidStreams;
  return [];
}

/**
 * Wrap a raw (possibly negative or over-length) cursor index into a valid
 * row index in `[0, length)`, or `-1` when there are no rows.
 *
 * The cursor state is unbounded on purpose ({@link nudgeCursor} just adds
 * ±1 forever), so both row rendering and Alt+Return call this to agree on
 * which row is "current".
 *
 * @param raw - The unbounded cursor value.
 * @param length - Current row count.
 * @returns A valid row index, or `-1` when `length` is zero.
 */
export function wrapCursor(raw: number, length: number): number {
  if (length <= 0) return -1;
  return ((raw % length) + length) % length;
}

/**
 * Activate the cursored speaker.
 *
 * Routes every matching stream from {@link focusedMatchingStreams} to the
 * cursored row and closes the peek. Called from the Alt+Return IPC
 * handler in `app.tsx` and mirrors what clicking the same row does.
 */
export function activateCursor(): void {
  const speakerList = audio.speakers ?? [];
  const sp = speakerList[wrapCursor(cursor.peek(), speakerList.length)];
  if (!sp) return;
  for (const stream of focusedMatchingStreams()) {
    stream.set_target_endpoint(sp);
  }
  set(false);
}

// pipewire stream id → { pid, mediaName }. AstalWp exposes neither
// `application.process.id` (which we need for per-window scoping) nor
// `media.name` (which we need to disambiguate one Firefox tab from
// another), so we shell out to `pw-dump` to enrich each stream. Refreshes
// run on subscribe, stream changes, focus changes, and settled title changes.
// Anything reading the map recomputes when set() lands the new value.
export type StreamInfo = { pid: number; mediaName: string };
export const audioStreamIndex = createExternal(
  new Map<number, StreamInfo>(),
  (mut) => {
    let disposed = false;
    /**
     * Kick off one asynchronous `pw-dump -N` read and rebuild the stream
     * index from the parsed JSON.
     *
     * Silent on parse failure — a bad snapshot leaves the previous map
     * in place, which is safer than mutating to an empty view mid-play.
     */
    function refresh(): Promise<void> {
      return new Promise((resolve) => {
        let proc: Gio.Subprocess;
        try {
          proc = Gio.Subprocess.new(
            ["pw-dump", "-N"],
            Gio.SubprocessFlags.STDOUT_PIPE |
              Gio.SubprocessFlags.STDERR_SILENCE,
          );
        } catch {
          resolve();
          return;
        }
        proc.communicate_utf8_async(null, null, (subproc, res) => {
          try {
            if (disposed) return;
            const stdout = subproc!.communicate_utf8_finish(res)[1];
            const list: unknown = JSON.parse(stdout ?? "[]");
            if (!Array.isArray(list)) return;
            const map = new Map<number, StreamInfo>();
            for (const obj of list) {
              const props = (
                obj as { info?: { props?: Record<string, unknown> } }
              )?.info?.props;
              if (!props) continue;
              if (props["media.class"] !== "Stream/Output/Audio") continue;
              const pid = Number(props["application.process.id"]);
              if (!Number.isFinite(pid) || pid <= 0) continue;
              const streamId = Number((obj as { id?: unknown }).id);
              if (!Number.isFinite(streamId)) continue;
              const mediaName = String(props["media.name"] ?? "");
              map.set(streamId, { pid, mediaName });
            }
            mut(map);
          } catch {
            return;
          } finally {
            resolve();
          }
        });
      });
    }
    const refreshes = createEventCoordinator({
      delayMs: TITLE_SETTLE_MS,
      run: refresh,
      schedule: scheduleOnce,
      cancel: (id) => GLib.source_remove(id),
    });
    refreshes.requestImmediate();
    const streamAddedId = audio.connect("stream-added", () =>
      refreshes.requestImmediate(),
    );
    const streamRemovedId = audio.connect("stream-removed", () =>
      refreshes.requestImmediate(),
    );
    // Firefox updates a stream's media.name in place when the tab title
    // changes (YouTube's notification counter, for one, rewrites the tab
    // title every few minutes). AstalWp exposes no notify::media-name to
    // hang off, so we piggyback on Hyprland's windowtitle events — they
    // fire in the same beat as the browser's rename, keeping the cached
    // mediaName in sync with the window title we substring-match against.
    // Focus swaps get an immediate refresh from focused-client notify. Title
    // updates use only the v2 event and wait for a quiet period so animated
    // terminal titles do not continuously snapshot the full PipeWire graph.
    const titleEventId = hyprland.connect("event", (_h, name: string) => {
      if (name === "windowtitlev2") refreshes.requestDebounced();
    });
    const focusedClientId = hyprland.connect("notify::focused-client", () =>
      refreshes.requestImmediate(),
    );
    return () => {
      disposed = true;
      audio.disconnect(streamAddedId);
      audio.disconnect(streamRemovedId);
      hyprland.disconnect(titleEventId);
      hyprland.disconnect(focusedClientId);
      refreshes.dispose();
    };
  },
);
