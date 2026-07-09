{ scripts }:
{
  "custom/power_menu" = {
    format = "󰤄";
    on-click = "kitty -e ${scripts}/power-menu.sh";
    tooltip-format = "Power Menu";
  };
}
