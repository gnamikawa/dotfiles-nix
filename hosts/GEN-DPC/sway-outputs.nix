# GEN-DPC sway outputs — monitors and wacom input mapping

{ ... }:

let
  cintiqName = "Wacom Tech Cintiq Pro 22 4DQ01C1000153";
  ioDataName = "I-O Data Device Inc EX-LDGCQ241D GH30106986BW";
  viewtekName = "Viewteck Co., Ltd. GFV22CB             "; # trailing spaces are intentional
in
{
  wayland.windowManager.sway = {

    config.output = {
      "${ioDataName}" = {
        mode = "2560x1440@59.951Hz";
        position = "-2560,0";
      };
      "${cintiqName}" = {
        mode = "3840x2160@120Hz";
        position = "0,1080";
      };
      "${viewtekName}" = {
        mode = "1920x1080@144.001Hz";
        position = "0,0";
      };
    };

    extraConfig = ''
      workspace 8 output '${cintiqName}'
      workspace 9 output '${ioDataName}'

      input '1386:976:Wacom_Cintiq_Pro_22_Pen'    map_to_output '${cintiqName}'
      input '1386:976:Wacom_Cintiq_Pro_22_Finger' map_to_output '${cintiqName}'
    '';
  };
}
