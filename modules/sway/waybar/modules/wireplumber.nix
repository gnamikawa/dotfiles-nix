{ scripts }:
{
  "group/wireplumber" = {
    orientation = "horizontal";
    modules = [
      "wireplumber#output"
      "wireplumber#input"
    ];
    drawer = {
      transition-left-to-right = false;
    };
  };

  "wireplumber#output" = {
    format = "{icon} {volume}%";
    format-muted = "󰝟 {volume}%";
    format-icons = [
      "󰕿"
      "󰖀"
      "󰕾"
    ];
    min-length = 7;
    max-length = 7;
    on-click = "${scripts}/volume.sh output mute";
    on-scroll-up = "${scripts}/volume.sh output raise";
    on-scroll-down = "${scripts}/volume.sh output lower";
    tooltip-format = "Device: {node_name}";
    node-type = "Audio/Sink";
  };

  "wireplumber#input" = {
    format = "󰍬 {volume}%";
    format-muted = "󰍭 {volume}%";
    min-length = 7;
    max-length = 7;
    on-click = "${scripts}/volume.sh input mute";
    on-scroll-up = "${scripts}/volume.sh input raise";
    on-scroll-down = "${scripts}/volume.sh input lower";
    tooltip-format = "Device: {node_name}";
    node-type = "Audio/Source";
  };
}
