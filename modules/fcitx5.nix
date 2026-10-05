{ pkgs, ... }:
{
  i18n.inputMethod = {
    enable = true;
    type = "fcitx5";
    fcitx5 = {
      addons = with pkgs; [
        fcitx5-gtk
        fcitx5-mozc-ut
      ];
      waylandFrontend = true;

      settings.globalOptions = {
        "Hotkey" = {
          "TriggerKeys" = "Mod+space";
        };
        "Groups/0/Items/0".Name = "keyboard-us";
        "Groups/0/Items/1".Name = "mozc";
        "GroupOrder"."0" = "Default";
      };

      settings.inputMethod = {
        "Groups/0" = {
          "Name" = "Default";
          "Default Layout" = "us";
          "DefaultIM" = "keyboard-us";
        };
        "Groups/0/Items/0".Name = "keyboard-us";
        "Groups/0/Items/1".Name = "mozc";
        "GroupOrder"."0" = "Default";
      };
    };
  };

  # The fcitx5 package ships an XDG autostart entry, which races the
  # fcitx5-daemon.service this module already installs: both start, and the
  # loser exits with "Is there another fcitx already running?". Hide the
  # entry so the service is the only launcher.
  xdg.configFile."autostart/org.fcitx.Fcitx5.desktop".text = ''
    [Desktop Entry]
    Type=Application
    Name=Fcitx 5
    Hidden=true
  '';
}
