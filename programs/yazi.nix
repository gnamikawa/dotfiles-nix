{ constants, ... }:
{
  programs.yazi = {
    shellWrapperName = "y";
    enable = true;
    enableBashIntegration = true;

    keymap = {
      mgr = {
        prepend_keymap = [
          {
            on = "<C-Enter>";
            run = "shell \"$SHELL\" --block";
            desc = "Drop down into the current directory";
          }
          {
            on = "<C-\\>";
            run = "shell --orphan --confirm kitty";
            desc = "Open the current working directory in a new window";
          }
          {
            on = "<S-k>";
            run = "spot";
            desc = "Show information about selected item";
          }
          {
            on = "q";
            run = "noop";
          }
        ];
      };
    };

    settings = {
      mgr = {
        show_hidden = true;
      };
      preview = {
        image_filter = "lanczos3";
        image_quality = 70;
        image_delay = 0;
        max_width = 3000;
        max_height = 3000;
      };
      plugin = {
        prepend_preloaders = [
          {
            mime = "image/*";
            run = "image";
          }
        ];
      };
    };

    theme = {
      app = {
        overall = {
          bg = constants.theme.blackout;
          fg = "#cccccc";
        };
      };

      mgr = {
        cwd = {
          fg = "#569cd6";
        };
        find_keyword = {
          fg = "#dcdcaa";
          bold = true;
        };
        find_position = {
          fg = constants.theme.teal;
          bg = "#264f78";
          bold = true;
        };
        symlink_target = {
          fg = constants.theme.purple;
        };

        marker_copied = {
          fg = constants.theme.teal;
        };
        marker_cut = {
          fg = "#f44747";
        };
        marker_selected = {
          fg = "#dcdcaa";
        };

        border_symbol = "│";
        border_style = {
          fg = constants.theme.lightblack;
        };
      };

      indicator = {
        parent = {
          fg = "#569cd6";
        };
        current = {
          fg = "#569cd6";
          bold = true;
        };
        preview = {
          fg = constants.theme.lightgray;
        };
        padding = {
          open = " ";
          close = " ";
        };
      };

      tabs = {
        active = {
          fg = constants.theme.blackout;
          bg = constants.theme.blue;
        };
        inactive = {
          fg = constants.theme.lightgray;
          bg = constants.theme.lightblack;
        };
        sep_inner = {
          open = " ";
          close = " ";
        };
        sep_outer = {
          open = " ";
          close = " ";
        };
      };

      mode = {
        normal_main = {
          fg = constants.theme.blackout;
          bg = "#569cd6";
          bold = true;
        };
        normal_alt = {
          fg = constants.theme.blackout;
          bg = constants.theme.blue;
        };
        select_main = {
          fg = constants.theme.blackout;
          bg = constants.theme.teal;
          bold = true;
        };
        select_alt = {
          fg = constants.theme.blackout;
          bg = "#f9f1a5";
        };
        unset_main = {
          fg = constants.theme.blackout;
          bg = "#f44747";
          bold = true;
        };
        unset_alt = {
          fg = constants.theme.blackout;
          bg = "#ff6161";
        };
      };

      status = {
        overall = {
          fg = constants.theme.lightgray;
          bg = constants.theme.blackout;
        };
        sep_left = {
          open = "";
          close = "";
        };
        sep_right = {
          open = "";
          close = "";
        };

        perm_type = {
          fg = "#569cd6";
        };
        perm_read = {
          fg = constants.theme.teal;
        };
        perm_write = {
          fg = "#dcdcaa";
        };
        perm_exec = {
          fg = "#ce9178";
        };
        perm_sep = {
          fg = "#6a9955";
        };

        progress_label = {
          fg = constants.theme.lightgray;
          bold = true;
        };
        progress_normal = {
          fg = "#569cd6";
          bg = constants.theme.lightblack;
        };
        progress_error = {
          fg = "#f44747";
          bg = constants.theme.lightblack;
        };
      };

      filetype = {
        rules = [
          {
            mime = "inode/directory";
            fg = "#5599d2";
          }
        ];
      };

      input = {
        border = {
          fg = constants.theme.blue;
        };
        title = {
          fg = constants.theme.blue;
          bold = true;
        };
        value = {
          fg = constants.theme.lightgray;
        };
        selected = {
          fg = constants.theme.blackout;
          bg = constants.theme.teal;
        };
      };

      cmp = {
        border = {
          fg = constants.theme.blue;
        };
        active = {
          fg = constants.theme.blackout;
          bg = constants.theme.blue;
          bold = true;
        };
        inactive = {
          fg = constants.theme.lightgray;
        };
      };

      tasks = {
        border = {
          fg = constants.theme.blue;
        };
        title = {
          fg = constants.theme.blue;
          bold = true;
        };
        hovered = {
          fg = constants.theme.blackout;
          bg = constants.theme.blue;
        };
      };

      help = {
        on = {
          fg = constants.theme.teal;
        };
        run = {
          fg = "#569cd6";
        };
        desc = {
          fg = constants.theme.lightgray;
        };
        hovered = {
          bg = constants.theme.lightblack;
        };
        footer = {
          fg = "#6a9955";
        };
      };
    };
  };
}
