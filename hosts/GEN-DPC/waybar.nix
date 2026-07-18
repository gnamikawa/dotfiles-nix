# GEN-DPC waybar entry — the host-varying bar array: which bars exist and
# which outputs they pin to. Bodies and module definitions are raw assets.

{ ... }:
{
  xdg.configFile."generated/waybar/config.jsonc".text = builtins.toJSON [
    {
      include = [
        "~/.config/waybar/bars/top.jsonc"
        "~/.config/waybar/modules.jsonc"
      ];
      output = [ "DP-3" ];
    }
    {
      include = [
        "~/.config/waybar/bars/bottom.jsonc"
        "~/.config/waybar/modules.jsonc"
      ];
      output = [ "DP-3" ];
    }
    {
      include = [
        "~/.config/waybar/bars/etc.jsonc"
        "~/.config/waybar/modules.jsonc"
      ];
      output = [
        "DP-2"
        "HDMI-A-1"
      ];
    }
  ];
}
