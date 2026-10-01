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

{ pkgs, ... }:
{
  systemd.user.services.discord = {
    Unit = {
      Description = "Discord, started hidden";
      After = [ "graphical-session.target" ];
      PartOf = [ "graphical-session.target" ];
      # A host without the Flatpak skips the unit instead of failing it.
      ConditionPathExists = "%h/.local/share/flatpak/app/com.discordapp.Discord";
    };
    Service = {
      Type = "simple";
      ExecStart = "${pkgs.flatpak}/bin/flatpak run com.discordapp.Discord --start-minimized";
      # No Restart: quitting Discord on purpose should leave it quit.
    };
    Install.WantedBy = [ "graphical-session.target" ];
  };
}
