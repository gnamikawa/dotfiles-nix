{ ... }:
{
  programs.waybar.custom = {
    primaryOutput = "DP-3";
    secondaryOutputs = [
      "DP-2"
      "HDMI-A-1"
    ];
  };
}
