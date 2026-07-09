{ scripts }:
{
  backlight = {
    format = "{icon} {percent}%";
    format-icons = [
      ""
      ""
      ""
      ""
      ""
      ""
      ""
      ""
      ""
    ];
    min-length = 7;
    max-length = 7;
    on-scroll-up = "${scripts}/backlight.sh up";
    on-scroll-down = "${scripts}/backlight.sh down";
    tooltip = false;
  };
}
