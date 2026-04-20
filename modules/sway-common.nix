# sway-common.nix — shared sway configuration for all hosts

{ lib, constants, ... }:

let
  mod = "Mod1"; # Alt   — primary modifier
  win = "Mod4"; # Super — secondary modifier
in
{
  wayland.windowManager.sway = {
    enable = true;

    config = {

      # ── Modifier ───────────────────────────────────────────────────────────
      modifier = mod;

      # ── Layout ─────────────────────────────────────────────────────────────
      workspaceLayout = "default";
      workspaceAutoBackAndForth = false;

      # ── Borders & gaps ─────────────────────────────────────────────────────
      window = {
        border = 1;
        titlebar = false;
        commands = [
          {
            criteria = {
              app_id = "nm-connection-editor";
            };
            command = "floating enable, border pixel 1";
          }
          {
            criteria = {
              app_id = ".blueman-manager-wrapped";
            };
            command = "floating enable, border pixel 1";
          }
          {
            criteria = {
              app_id = "org.pulseaudio.pavucontrol";
            };
            command = "floating enable, border pixel 1";
          }
          {
            criteria = {
              app_id = "firefox";
              title = "Picture-in-Picture";
            };
            command = "floating enable, border pixel 1, resize set 426 240, move position ${toString (1920 - 426 - 32)} 0, sticky enable";
          }
        ];
      };

      gaps.inner = 20;

      # ── Focus behaviour ────────────────────────────────────────────────────
      focus = {
        wrapping = "no";
        followMouse = false;
      };

      # ── Floating modifier ──────────────────────────────────────────────────
      floating.modifier = win;

      # ── Window colours ─────────────────────────────────────────────────────
      # Format: border  background  text  indicator  childBorder
      # childBorder is the colour users actually see around tiled windows.
      colors = {
        focused = {
          border = "#000000";
          background = "#000000";
          text = "#000000";
          indicator = constants.theme.border.active.gray;
          childBorder = constants.theme.border.active.gray;
        };
        focusedInactive = {
          border = "#000000";
          background = "#000000";
          text = "#000000";
          indicator = "#000000";
          childBorder = constants.theme.border.default.gray;
        };
        unfocused = {
          border = "#000000";
          background = "#444444";
          text = "#000000";
          indicator = "#444444";
          childBorder = constants.theme.border.default.gray;
        };
        urgent = {
          border = "#000000";
          background = "#000000";
          text = "#000000";
          indicator = constants.theme.componentBackground.default.amber;
          childBorder = "#000000";
        };
      };

      # ── Bars ───────────────────────────────────────────────────────────────
      # Explicitly empty — suppresses the default swaybar HM would otherwise
      # inject. Launch waybar / yambar / etc. here or via systemd.
      bars = [ ];

      # ── Keybindings ────────────────────────────────────────────────────────
      # lib.mkOptionDefault preserves sway's built-in bindings while adding ours.
      keybindings = lib.mkOptionDefault {

        # Applications
        "${mod}+r" = "exec ranger";
        "${mod}+F4" = "kill";
        "${mod}+F3" = "exec dmenu_run -m 0";
        "${mod}+Shift+e" = "exec uwsm stop";
        "${mod}+Shift+r" = "exec swaymsg reload";
        "${win}+f" = "floating toggle";
        "${win}+t" = "exec kitty -e bash -lc yazi";
        "${win}+b" = "exec $BROWSER";
        "${win}+space" = "exec fcitx5-remote -t";

        # Screenshots
        "Control+Shift+2" =
          ''exec grim -g "$(slurp -b#00000000 -c#ffffffff -s#00556655 -w1 -o)" - | wl-copy'';
        "Control+Shift+4" = ''exec grim -g "$(slurp -b#00000000 -c#ffffffff -s#00556655 -w1)" - | wl-copy'';

        # Audio
        "XF86AudioRaiseVolume" = "exec pactl set-sink-volume @DEFAULT_SINK@ +5%";
        "XF86AudioLowerVolume" = "exec pactl set-sink-volume @DEFAULT_SINK@ -5%";
        "XF86AudioMute" = "exec pactl set-sink-mute @DEFAULT_SINK@ toggle";

        # Workspace focus
        "${mod}+1" = "workspace 1";
        "${mod}+2" = "workspace 2";
        "${mod}+3" = "workspace 3";
        "${mod}+4" = "workspace 4";
        "${mod}+5" = "workspace 5";
        "${mod}+6" = "workspace 6";
        "${mod}+7" = "workspace 7";
        "${mod}+8" = "workspace 8";
        "${mod}+9" = "workspace 9";

        # Window focus (vim)
        "${mod}+h" = "focus left";
        "${mod}+j" = "focus down";
        "${mod}+k" = "focus up";
        "${mod}+l" = "focus right";

        # Window move (vim)
        "${mod}+Shift+h" = "move left";
        "${mod}+Shift+j" = "move down";
        "${mod}+Shift+k" = "move up";
        "${mod}+Shift+l" = "move right";

        # Move window to workspace
        "${win}+1" = "move window to workspace 1";
        "${win}+2" = "move window to workspace 2";
        "${win}+3" = "move window to workspace 3";
        "${win}+4" = "move window to workspace 4";
        "${win}+5" = "move window to workspace 5";
        "${win}+6" = "move window to workspace 6";
        "${win}+7" = "move window to workspace 7";
        "${win}+8" = "move window to workspace 8";
        "${win}+9" = "move window to workspace 9";

        # Move workspace to output
        "${win}+h" = "move workspace to output left";
        "${win}+j" = "move workspace to output down";
        "${win}+k" = "move workspace to output up";
        "${win}+l" = "move workspace to output right";

        # Resize (1 px steps)
        "${win}+Up" = "resize grow height 1";
        "${win}+Down" = "resize shrink height 1";
        "${win}+Right" = "resize grow width 1";
        "${win}+Left" = "resize shrink width 1";

        # Splits
        "${win}+plus" = "split h";
        "${win}+minus" = "split v";
      };

      # ── Startup ────────────────────────────────────────────────────────────
      startup = [
        # On a systemd-managed session (uwsm) this is usually handled by the
        # session launcher, but keeping it here is harmless and idempotent.
        {
          command = "dbus-update-activation-environment --systemd WAYLAND_DISPLAY SWAYSOCK XDG_CURRENT_DESKTOP";
          always = false;
        }
        # Always land on workspace 1 at login.
        {
          command = "swaymsg workspace 1";
          always = false;
        }
      ];
    };

    extraConfig = ''
      default_orientation horizontal
    '';
  };
}
