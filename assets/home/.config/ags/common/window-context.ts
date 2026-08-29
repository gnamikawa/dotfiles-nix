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

const [state, set] = createState(false);
export const windowContextOpen = state;
export const setWindowContextOpen = set;

// Cursor index for keyboard navigation of the router's speaker rows.
// Alt+Up/Down move it, Alt+Return activates. Consumers do their own
// modulo clamping against the row count (the max is unknown here).
const [cursor, setCursor] = createState(0);
export const cursorIndex = cursor;
export const setCursorIndex = setCursor;
export const nudgeCursor = (delta: number) => setCursor((v) => v + delta);

const hyprland = AstalHyprland.get_default();
export const audio = AstalWp.get_default().audio;

// A pulse driven by focused-client swaps AND Hyprland's `activewindow`
// event, which Hyprland re-emits when a window's title changes — that's
// how Firefox tab switches reach us (same client, same PID, different
// title, and our title-substring routing needs the new title). We do NOT
// depend on liveGeom (the 32ms poll) because content must not re-render
// during a drag: doing so disposes row widgets between mousedown and
// mouseup and swallows the click. `event` fires on many things; we filter
// to activewindow/activewindowv2 so unrelated Hyprland traffic doesn't
// churn the router.
export const focusPulse = createExternal(0, (set) => {
  let tick = 0;
  const bump = () => set(++tick);
  const idFc = hyprland.connect("notify::focused-client", bump);
  const idEv = hyprland.connect("event", (_h, name: string) => {
    // activewindow / v2 fire on focus swaps; windowtitle / v2 fire when a
    // window's own title changes (Firefox tab switch inside the same
    // window). Hyprland does NOT re-emit activewindow on title change, so
    // we must listen to both families for the router to react to a tab
    // swap without waiting for the user to alt-tab away and back.
    if (
      name === "activewindow" ||
      name === "activewindowv2" ||
      name === "windowtitle" ||
      name === "windowtitlev2"
    )
      bump();
  });
  return () => {
    hyprland.disconnect(idFc);
    hyprland.disconnect(idEv);
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
  const bump = () => set(++tick);
  const perStream = new Map<AstalWp.Stream, number[]>();

  function subscribe(stream: AstalWp.Stream) {
    if (perStream.has(stream)) return;
    perStream.set(stream, [
      stream.connect("notify::state", bump),
      stream.connect("notify::target-endpoint", bump),
    ]);
  }
  function unsubscribe(stream: AstalWp.Stream) {
    const ids = perStream.get(stream);
    if (!ids) return;
    for (const id of ids) stream.disconnect(id);
    perStream.delete(stream);
  }
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

// Right of window if it fits; else left of window if that fits; else
// overlaid at the window's top-left corner. Coordinates are converted from
// Hyprland's compositor-global frame to the target monitor's local frame
// because layer-shell margins are output-relative.
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

// Compute the set of streams to route for whatever the user is looking at.
// Two-step scoping — see components/WindowContext.tsx header for the full
// rationale; kept in common/ because the Alt+Return activator needs the
// same logic without going through the component's reactive view.
//
// No state filter beyond ERROR: pre-routing an IDLE stream is the whole
// point — the user needs to steer where the audio will land before they
// hit play, or their unmuted default speakers announce it to the room.
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

// Wrap a raw cursor index into a valid row index. The cursor state is
// unbounded (nudgeCursor just adds ±1 forever) so both this and the row
// rendering wrap the same way for cycling; keeping the wrap here means
// the render effect and Alt+Return agree on which row is "current".
export function wrapCursor(raw: number, length: number): number {
  if (length <= 0) return -1;
  return ((raw % length) + length) % length;
}

// Activate the cursored speaker: route every matching stream to it and
// close the peek. Called from the Alt+Return IPC handler in app.tsx and
// mirrors what clicking the same row would do.
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
// another), so we shell out to `pw-dump` to enrich each stream. Refresh
// fires whenever the audio stream set changes, plus once on subscribe.
// Anything reading the map recomputes when set() lands the new value.
export type StreamInfo = { pid: number; mediaName: string };
export const audioStreamIndex = createExternal(
  new Map<number, StreamInfo>(),
  (mut) => {
    let disposed = false;
    function refresh() {
      const proc = Gio.Subprocess.new(
        ["pw-dump", "-N"],
        Gio.SubprocessFlags.STDOUT_PIPE,
      );
      proc.communicate_utf8_async(null, null, (subproc, res) => {
        if (disposed) return;
        let stdout: string | null = "";
        try {
          const finished = subproc!.communicate_utf8_finish(res);
          stdout = finished[1];
        } catch {
          return;
        }
        let list: unknown;
        try {
          list = JSON.parse(stdout ?? "[]");
        } catch {
          return;
        }
        if (!Array.isArray(list)) return;
        const map = new Map<number, StreamInfo>();
        for (const obj of list) {
          const props = (obj as { info?: { props?: Record<string, unknown> } })
            ?.info?.props;
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
      });
    }
    refresh();
    const h1 = audio.connect("stream-added", refresh);
    const h2 = audio.connect("stream-removed", refresh);
    // Firefox updates a stream's media.name in place when the tab title
    // changes (YouTube's notification counter, for one, rewrites the tab
    // title every few minutes). AstalWp exposes no notify::media-name to
    // hang off, so we piggyback on Hyprland's windowtitle events — they
    // fire in the same beat as the browser's rename, keeping the cached
    // mediaName in sync with the window title we substring-match against.
    // activewindow is included so focus-swap always gets a fresh read.
    const h3 = hyprland.connect("event", (_h, name: string) => {
      if (
        name === "windowtitle" ||
        name === "windowtitlev2" ||
        name === "activewindow" ||
        name === "activewindowv2"
      )
        refresh();
    });
    return () => {
      disposed = true;
      audio.disconnect(h1);
      audio.disconnect(h2);
      hyprland.disconnect(h3);
    };
  },
);
