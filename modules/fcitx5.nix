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
          "Default Layout" = "keyboard-us";
          "DefaultIM" = "keyboard-us";
        };
        "Groups/0/Items/0".Name = "keyboard-us";
        "Groups/0/Items/1".Name = "mozc";
        "GroupOrder"."0" = "Default";
      };
    };
  };
}
