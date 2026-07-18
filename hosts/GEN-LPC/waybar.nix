# GEN-LPC waybar entry — single display, no etc bar.

{ ... }:
{
  xdg.configFile."generated/waybar/config.jsonc".text = builtins.toJSON [
    {
      include = [
        "~/.config/waybar/bars/top.jsonc"
        "~/.config/waybar/modules.jsonc"
      ];
      output = [ "eDP-1" ];
    }
    {
      include = [
        "~/.config/waybar/bars/bottom.jsonc"
        "~/.config/waybar/modules.jsonc"
      ];
      output = [ "eDP-1" ];
    }
  ];
}
