{
  battery = {
    states = {
      warning = 20;
      critical = 10;
    };
    format = "{icon} {capacity}%";
    format-time = "{H} hr {M} min";
    format-charging = "󰉁 {capacity}%";
    format-icons = [
      "󰂎"
      "󰁻"
      "󰁼"
      "󰁽"
      "󰁾"
      "󰁿"
      "󰂀"
      "󰂁"
      "󰂂"
      "󰁹"
    ];
    min-length = 7;
    max-length = 7;
    tooltip-format = "Discharging: {time}";
    tooltip-format-charging = "Charging: {time}";
    events = {
      on-discharging-warning = "notify-send 'Battery Low (20%)' -i 'battery-020'";
      on-discharging-critical = "notify-send 'Battery Critical (10%)' -u critical -i 'battery-010'";
      on-charging-100 = "notify-send 'Battery Full (100%)' -i 'battery-100-charged'";
    };
  };
}
