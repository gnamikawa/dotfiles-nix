{
  "clock#time" = {
    interval = 1;
    format = "{:%I:%M:%S %p}";
    min-length = 11;
    max-length = 11;
    tooltip-format = "Military Time: {:%H:%M:%S %p}";
  };

  "clock#date" = {
    timezone = "Asia/Tokyo";
    format = "󰸗 {:%m/%d}";
    min-length = 8;
    max-length = 8;
    tooltip-format = "{calendar}";
    calendar = {
      mode = "month";
      mode-mon-col = 6;
      format = {
        months = "<span alpha='100%'><b>{}</b></span>";
        days = "<span alpha='90%'>{}</span>";
        weekdays = "<span alpha='80%'><i>{}</i></span>";
        today = "<span alpha='100%'><b><u>{}</u></b></span>";
      };
    };
    actions = {
      on-click = "mode";
    };
  };
}
