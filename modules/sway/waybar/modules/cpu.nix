{
  cpu = {
    interval = 10;
    format = "󰍛 {usage}%";
    format-warning = "󰀨 {usage}%";
    format-critical = "󰀨 {usage}%";
    states = {
      warning = 75;
      critical = 90;
    };
    min-length = 7;
    max-length = 7;
    tooltip = false;
  };
}
