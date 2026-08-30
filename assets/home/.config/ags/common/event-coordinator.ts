export type EventCoordinator = {
  requestImmediate: () => void;
  requestDebounced: () => void;
  dispose: () => void;
};

export type EventCoordinatorOptions = {
  delayMs: number;
  run: () => void | Promise<void>;
  schedule: (delayMs: number, callback: () => void) => number;
  cancel: (id: number) => void;
};

export type WindowEventSubscriptions = {
  subscribeFocusedClient: (callback: () => void) => () => void;
  subscribeEvent: (callback: (name: string) => void) => () => void;
};

/**
 * Coordinate immediate and trailing-debounced event work.
 *
 * Only one asynchronous run may be active. Immediate requests received while
 * it runs collapse into one follow-up; debounced requests reset one timer and
 * join that same single-flight path when the event burst settles.
 *
 * @param options - Work callback plus the host's timer primitives.
 * @returns Request methods and a cleanup method for the owning subscription.
 */
export function createEventCoordinator(
  options: EventCoordinatorOptions,
): EventCoordinator {
  let disposed = false;
  let running = false;
  let pending: "none" | "immediate" | "debounced" = "none";
  let timerId: number | null = null;

  /** Finish one run and start the single coalesced follow-up when needed. */
  function finish() {
    running = false;
    if (disposed || pending === "none") return;
    if (pending === "immediate" || timerId == null) {
      pending = "none";
      start();
    }
  }

  /** Start the work callback unless the coordinator has been disposed. */
  function start() {
    if (disposed) return;
    running = true;
    let result: void | Promise<void>;
    try {
      result = options.run();
    } catch {
      finish();
      return;
    }
    Promise.resolve(result).then(finish, finish);
  }

  /** Request work now, coalescing behind an active run when necessary. */
  function requestImmediate() {
    if (disposed) return;
    if (timerId != null) {
      options.cancel(timerId);
      timerId = null;
    }
    if (running) {
      pending = "immediate";
      return;
    }
    pending = "none";
    start();
  }

  /** Request work after the configured quiet period. */
  function requestDebounced() {
    if (disposed) return;
    if (pending === "immediate") return;
    if (timerId != null) options.cancel(timerId);
    pending = "debounced";
    timerId = options.schedule(options.delayMs, () => {
      timerId = null;
      if (running) return;
      pending = "none";
      start();
    });
  }

  /** Cancel scheduled work and ignore future requests or completions. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    pending = "none";
    if (timerId != null) {
      options.cancel(timerId);
      timerId = null;
    }
  }

  return { requestImmediate, requestDebounced, dispose };
}

/**
 * Route Hyprland focus and title subscriptions into a refresh coordinator.
 *
 * Focus changes run immediately. Only the v2 title event is accepted for
 * debouncing because Hyprland emits equivalent v1 and active-window events.
 *
 * @param events - Host-specific subscriptions for focus and general events.
 * @param coordinator - Refresh coordinator that receives routed requests.
 * @returns A cleanup callback that disconnects both subscriptions.
 */
export function subscribeWindowEvents(
  events: WindowEventSubscriptions,
  coordinator: EventCoordinator,
): () => void {
  const disconnectFocusedClient = events.subscribeFocusedClient(() =>
    coordinator.requestImmediate(),
  );
  const disconnectEvent = events.subscribeEvent((name) => {
    if (name === "windowtitlev2") coordinator.requestDebounced();
  });

  return () => {
    disconnectFocusedClient();
    disconnectEvent();
  };
}
