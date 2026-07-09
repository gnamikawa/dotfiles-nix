{ scripts }:
{
  "group/pulseaudio" = {
    orientation = "horizontal";
    modules = [
      "pulseaudio#output"
      "pulseaudio#input"
    ];
    drawer = {
      transition-left-to-right = false;
    };
  };

  "pulseaudio#output" = {
    format = "{icon} {volume}%";
    format-muted = "{icon} {volume}%";
    format-icons = {
      default = [
        "󰕿"
        "󰖀"
        "󰕾"
      ];
      default-muted = "󰝟";
      headphone = "󰋋";
      headphone-muted = "󰟎";
      headset = "󰋎";
      headset-muted = "󰋐";
    };
    min-length = 7;
    max-length = 7;
    on-click = "${scripts}/volume.sh output mute";
    on-click-right = "pavucontrol --tab=1";
    on-scroll-up = "${scripts}/volume.sh output raise";
    on-scroll-down = "${scripts}/volume.sh output lower";
    tooltip-format = "Output Device: {desc}";
  };

  "pulseaudio#input" = {
    format = "{format_source}";
    format-source = "󰍬 {volume}%";
    format-source-muted = "󰍭 {volume}%";
    min-length = 7;
    max-length = 7;
    on-click = "${scripts}/volume.sh input mute";
    on-click-right = "pavucontrol --tab=2";
    on-scroll-up = "${scripts}/volume.sh input raise";
    on-scroll-down = "${scripts}/volume.sh input lower";
    tooltip-format = "Input Device: {desc}";
  };
}
