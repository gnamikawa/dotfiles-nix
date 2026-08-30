import { describe, expect, test, vi } from "vitest";

import {
  type EventCoordinator,
  subscribeWindowEvents,
} from "../../assets/home/.config/ags/common/event-coordinator";

describe("window event routing", () => {
  test("refreshes focus immediately and only debounces v2 title events", () => {
    let focusedClientCallback!: () => void;
    let eventCallback!: (name: string) => void;
    const disconnectFocusedClient = vi.fn();
    const disconnectEvent = vi.fn();
    const events = {
      /** Capture the focus callback for this routing test. */
      subscribeFocusedClient: (callback: () => void) => {
        focusedClientCallback = callback;
        return disconnectFocusedClient;
      },
      /** Capture the general event callback for this routing test. */
      subscribeEvent: (callback: (name: string) => void) => {
        eventCallback = callback;
        return disconnectEvent;
      },
    };
    const coordinator: EventCoordinator = {
      requestImmediate: vi.fn(),
      requestDebounced: vi.fn(),
      dispose: vi.fn(),
    };

    const disconnect = subscribeWindowEvents(events, coordinator);
    focusedClientCallback();
    eventCallback("windowtitlev2");
    eventCallback("windowtitle");
    eventCallback("activewindow");
    eventCallback("activewindowv2");

    expect(coordinator.requestImmediate).toHaveBeenCalledOnce();
    expect(coordinator.requestDebounced).toHaveBeenCalledOnce();

    disconnect();
    expect(disconnectFocusedClient).toHaveBeenCalledOnce();
    expect(disconnectEvent).toHaveBeenCalledOnce();
  });
});
