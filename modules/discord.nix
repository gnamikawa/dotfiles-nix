# discord.nix — start Discord at login, in the background, with no window.
#
# Discord itself is a user-installed Flatpak this repository does not manage
# (ADR-0001), so this module only launches it. Two pieces keep the launch off
# the screen, both measured against Discord 0.0.133:
#
#   - `--start-minimized` stops the main window from ever opening.
#   - The splash window still opens for a few seconds; the window rule in
#     assets/home/.config/hypr/rules.lua parks it on a hidden workspace.
#
# There is no tray to click, so the window is summoned by launching Discord
# again: the second launch hands over to the running one, which opens its
# main window. Closing that window leaves Discord running.
#
# That handover is also why the unit has to kill Discord itself. Flatpak moves
# the app into its own `app-flatpak-…` scope, outside this unit, so systemd's
# own stop reaches nothing: Discord lives on, and the next start hands over to
# it — the window opens and the unit exits. `flatpak kill` before every start
# and on every stop makes sure a start is always a fresh, hidden Discord.

{ pkgs, ... }:
let
  # `-`: nothing to kill is the normal case at login, not a failure.
  killDiscord = "-${pkgs.flatpak}/bin/flatpak kill com.discordapp.Discord";
in
{
  systemd.user.services.discord = {
    Unit = {
      Description = "Discord, started hidden";
      After = [ "graphical-session.target" ];
      PartOf = [ "graphical-session.target" ];
      # A host without the Flatpak skips the unit instead of failing it.
      ConditionPathExists = "%h/.local/share/flatpak/app/com.discordapp.Discord";
      # Give up after five failed starts in a minute instead of retrying forever.
      StartLimitIntervalSec = 60;
      StartLimitBurst = 5;
    };
    Service = {
      Type = "simple";
      # Also covers a Discord left running outside the unit (launched by hand).
      ExecStartPre = killDiscord;
      ExecStart = "${pkgs.flatpak}/bin/flatpak run com.discordapp.Discord --start-minimized";
      ExecStop = killDiscord;
      # Retry a failed launch, but leave Discord quit when it was quit on
      # purpose. Flatpak 1.18.1 sometimes refuses to start an app while the
      # login rush is still mounting things ("Extension
      # org.freedesktop.Platform.GL.default has invalid merge-dirs", exit 1);
      # the same launch works a moment later. Measured exit codes of the unit
      # on 2026-10-11:
      #
      #   - that failed launch: 1, so it is retried.
      #   - Ctrl+Q inside Discord: 0, a clean exit, so no retry.
      #   - `flatpak kill` by hand: 137, excluded below, so no retry.
      #   - `systemctl --user stop`: systemd never retries its own stops.
      Restart = "on-failure";
      RestartSec = 2;
      RestartPreventExitStatus = 137;
    };
    Install.WantedBy = [ "graphical-session.target" ];
  };
}
