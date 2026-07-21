# GEN-DPC hyprland outputs — monitors, workspace bindings, wacom mapping,
# NVIDIA environment. Generated slices; live iteration goes through
# `hyprctl keyword` and the winner is encoded here.

{ ... }:

let
  # Descriptions verbatim from `hyprctl monitors`, which is the string
  # matching runs against — NOT the raw EDID: Hyprland strips commas from
  # it (the single-line monitor= syntax is comma-delimited), hence
  # "Viewteck Co. Ltd." although the EDID make says "Viewteck Co., Ltd.".
  # A desc that never matches is silent: the monitor is auto-placed at
  # preferred mode right of the rightmost output.
  cintiqDesc = "Wacom Tech Cintiq Pro 22 4DQ01C1000153";
  ioDataDesc = "I-O Data Device Inc EX-LDGCQ241D GH30106986BW";
  viewteckDesc = "Viewteck Co. Ltd. GFV22CB";
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

    # default:true is required for the binding to hold at startup — without
    # it Hyprland hands each monitor the lowest unused workspace instead.
    workspace = 8, monitor:desc:${cintiqDesc}, default:true
    workspace = 9, monitor:desc:${ioDataDesc}, default:true

    # Pen and touch both land on the Cintiq. Cutover verification
    # (hyprctl devices: wacom-cintiq-pro-22-pen / -finger): the tablet
    # binding applies — pen maps correctly regardless of focus. The
    # touchdevice binding does NOT take effect (touch follows the focused
    # monitor); open item, live-test candidates: connector instead of
    # desc:, or a per-device block for wacom-cintiq-pro-22-finger.
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
