# Maintenance rules

Working conventions for maintaining this repository. Unlike `CONTEXT.md`
(glossary) and `docs/adr/` (decisions with trade-offs), these are standing
rules about how the code is kept.

## Manual session lock

Every desktop profile exposes one host-selected command for manual locking:

```sh
genzo-lock
```

On GEN-DPC this starts the production AGS locker through the on-demand
`genzo-session-lock.service`; on GEN-LPC it starts Hyprlock. Hypridle uses the
same command for logind lock requests and before-suspend locking.

## Recover an abandoned AGS lock from a TTY

The compositor stays fail-closed if the AGS locker dies after acquiring the
session lock. Recovery is deliberately manual; there is no restart watchdog.

1. Switch to a TTY, log in as `genzo`, and identify the active Hyprland
   instance:

   ```sh
   export XDG_RUNTIME_DIR=/run/user/$(id -u)
   export HYPRLAND_INSTANCE_SIGNATURE=$(ls -1 "$XDG_RUNTIME_DIR/hypr")
   ```

2. Allow one replacement lock client and restart the on-demand service:

   ```sh
   hyprctl keyword misc:allow_session_lock_restore true
   systemctl --user restart genzo-session-lock.service
   ```

3. Once the Geist lock screen is visible, restore the fail-closed default:

   ```sh
   hyprctl keyword misc:allow_session_lock_restore false
   ```

4. If the replacement fails again, terminate the graphical session instead
   of repeating a crash loop:

   ```sh
   systemctl --user stop wayland-wm@hyprland.desktop.service
   ```

## Module granularity

Modules are one flat file directly under `modules/`. Around 100 LOC, or when
distinct responsibilities start to tangle inside one file, is the signal to
refactor into a folder of smaller files with succinct identities — not
before.

## Generated slices

Computed slices (ADR-0005) are emitted to `~/.config/generated/<app>/…`
(e.g. `generated/hypr/`, `generated/waybar/`), never into the asset tree.
Nested structure inside `generated/<app>/` mirrors the config it joins, so
file relationships stay legible. Raw assets reference slices by that path
through the application's own include mechanism.
