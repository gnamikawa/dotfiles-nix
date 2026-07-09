{ secondaryOutputs, scripts }:

let
  workspaces = import ../modules/workspaces.nix;
  dividers = import ../modules/dividers.nix;
in

workspaces
// dividers
// {
  layer = "top";
  position = "top";
  output = secondaryOutputs;
  spacing = "0";

  "modules-left" = [
    "sway/workspaces"
    "custom/right_div#1"
  ];
}
