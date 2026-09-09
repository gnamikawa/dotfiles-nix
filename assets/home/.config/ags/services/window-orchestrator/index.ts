// Window-orchestrator service.
//
// Single subscriber to Hyprland's `client-added` signal that runs a list of
// registered policies against every new window. Each policy owns one
// window class (or family): it decides whether to act, and if so, dispatches
// the compositor operations that place the window. Adding a new policy is a
// one-liner in the `POLICIES` array below plus one file in `policies/`.

import AstalHyprland from "gi://AstalHyprland";
import { handle as handleFirefoxPip } from "./policies/firefox-pip";

/**
 * A window-placement policy: a pure handler over one Hyprland client that
 * mutates the compositor's state if the client matches the policy.
 *
 * Policies are stateless — count-so-far and other cross-window context is
 * queried from `AstalHyprland` inside each call, so restart-order and
 * policy-order do not matter.
 */
type Policy = (client: AstalHyprland.Client) => void;

/**
 * The active policy list. Order is not observable — every policy inspects
 * the client independently and only one is expected to match a given
 * window class.
 */
const POLICIES: Policy[] = [handleFirefoxPip];

let started = false;

/**
 * Subscribe to `client-added` and route each new client through every
 * registered policy.
 *
 * Idempotent: repeated calls short-circuit after the first subscription.
 * Called once from `app.tsx` after the shell mounts.
 */
export function startWindowOrchestrator(): void {
  if (started) return;
  started = true;

  const hyprland = AstalHyprland.get_default();
  hyprland.connect("client-added", (_h, client: AstalHyprland.Client) => {
    for (const policy of POLICIES) {
      try {
        policy(client);
      } catch (err) {
        console.error("window-orchestrator: policy threw", err);
      }
    }
  });
}
