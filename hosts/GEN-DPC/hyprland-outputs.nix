# GEN-DPC hyprland outputs — monitors, workspace bindings, wacom mapping,
# NVIDIA environment. Generated slices; live iteration goes through
# `hyprctl keyword` and the winner is encoded here.

{ ... }:

let
  # monitorv2 blocks instead of monitor= lines: the Viewteck description
  # contains a comma, which would break the single-line syntax.
  cintiqDesc = "Wacom Tech Cintiq Pro 22 4DQ01C1000153";
  ioDataDesc = "I-O Data Device Inc EX-LDGCQ241D GH30106986BW";
  viewteckDesc = "Viewteck Co., Ltd. GFV22CB"; # trailing spaces in the EDID are trimmed by Hyprland
in
{
  xdg.configFile."generated/hypr/monitors.conf".text = ''
    monitorv2 {
        output = desc:${ioDataDesc}
        mode = 2560x1440@59.951
        position = -2560x0
        scale = 1
    }

    monitorv2 {
        output = desc:${cintiqDesc}
        mode = 3840x2160@120
        position = 0x1080
        scale = 1
    }

    monitorv2 {
        output = desc:${viewteckDesc}
        mode = 1920x1080@144.001
        position = 0x0
        scale = 1
    }

    workspace = 8, monitor:desc:${cintiqDesc}
    workspace = 9, monitor:desc:${ioDataDesc}

    # Pen and touch both land on the Cintiq. Device names to be confirmed
    # against `hyprctl devices` during cutover verification.
    input {
        tablet {
            output = desc:${cintiqDesc}
        }
        touchdevice {
            output = desc:${cintiqDesc}
        }
    }
  '';

  # The usual Hyprland-on-NVIDIA setup (ADR-0007 accepted this work).
  xdg.configFile."generated/hypr/env.conf".text = ''
    env = LIBVA_DRIVER_NAME,nvidia
    env = __GLX_VENDOR_LIBRARY_NAME,nvidia
    env = NVD_BACKEND,direct

    cursor {
        no_hardware_cursors = true
    }
  '';
}
