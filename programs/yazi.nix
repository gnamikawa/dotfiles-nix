{ constants, pkgs, ... }:
let
  yaziPluginRepoDir = pkgs.fetchFromGitHub {
    owner = "yazi-rs";
    repo = "plugins";
    rev = "196281844b8cbcac658a59013e4805300c2d6126";
    sha256 = "sha256-pAkBlodci4Yf+CTjhGuNtgLOTMNquty7xP0/HSeoLzE=";
  };
in
{
  programs.yazi = {
    shellWrapperName = "y";
    enable = true;
    enableBashIntegration = true;
    initLua = ''
      require("git"):setup({
        order = 1500
      })
      require("full-border"):setup {
      	-- Available values: ui.Border.PLAIN, ui.Border.ROUNDED
      	type = ui.Border.ROUNDED,
      }
    '';
    plugins = {
      git = "${yaziPluginRepoDir}/git.yazi";
      full-border = "${yaziPluginRepoDir}/full-border.yazi";
      mount = "${yaziPluginRepoDir}/mount.yazi";
    };

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
          {
            on = "M";
            run = "plugin mount";
            desc = "Open the mount manager";
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

        prepend_fetchers = [
          {
            id = "git";
            url = "*";
            run = "git";
          }
          {
            id = "git";
            url = "*/";
            run = "git";
          }
        ];
      };
    };

    theme = {
      app = {
        overall = {
          bg = constants.theme.componentBackground.default.gray;
          fg = constants.theme.text.primary.gray;
        };
      };

      mgr = {
        cwd = {
          fg = constants.theme.text.secondary.gray;
        };
        find_keyword = {
          fg = constants.theme.text.secondary.amber;
          bg = constants.theme.componentBackground.active.amber;
          bold = true;
        };
        find_position = {
          fg = constants.theme.text.secondary.amber;
          bg = constants.theme.componentBackground.active.amber;
          bold = true;
        };
        symlink_target = {
          fg = constants.theme.text.secondary.gray;
        };

        marker_copied = {
          fg = constants.theme.text.secondary.teal;
        };
        marker_cut = {
          fg = constants.theme.text.secondary.red;
        };
        marker_selected = {
          fg = constants.theme.text.secondary.amber;
        };

        border_symbol = "│";
        border_style = {
          fg = constants.theme.border.default.gray;
        };
      };

      indicator = {
        parent = {
          fg = constants.theme.text.secondary.gray;
          bg = constants.theme.componentBackground.hover.blue;
        };
        current = {
          fg = constants.theme.text.secondary.blue;
          bg = constants.theme.componentBackground.hover.blue;
          bold = true;
        };
        preview = {
          fg = constants.theme.text.secondary.gray;
          bg = constants.theme.componentBackground.hover.blue;
        };
        padding = {
          open = " ";
          close = " ";
        };
      };

      tabs = {
        active = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.background.default;
        };
        inactive = {
          fg = constants.theme.text.secondary.gray;
          bg = constants.theme.background.default;
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
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.highContrastBackground.default.blue;
          bold = true;
        };
        normal_alt = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.highContrastBackground.default.purple;
        };
        select_main = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.highContrastBackground.default.teal;
          bold = true;
        };
        select_alt = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.highContrastBackground.default.amber;
        };
        unset_main = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.highContrastBackground.default.red;
          bold = true;
        };
        unset_alt = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.highContrastBackground.default.pink;
        };
      };

      status = {
        overall = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.componentBackground.default.gray;
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
          fg = constants.theme.text.secondary.gray;
        };
        perm_read = {
          fg = constants.theme.text.secondary.green;
        };
        perm_write = {
          fg = constants.theme.text.secondary.blue;
        };
        perm_exec = {
          fg = constants.theme.text.secondary.amber;
        };
        perm_sep = {
          fg = constants.theme.text.secondary.gray;
        };

        progress_label = {
          fg = constants.theme.text.primary.gray;
          bold = true;
        };
        progress_normal = {
          fg = constants.theme.text.primary.blue;
          bg = constants.theme.highContrastBackground.default.gray;
        };
        progress_error = {
          fg = constants.theme.text.primary.red;
          bg = constants.theme.highContrastBackground.default.gray;
        };
      };

      filetype = {
        rules = [
          {
            mime = "inode/directory";
            fg = constants.theme.text.secondary.blue;
          }
        ];
      };

      input = {
        border = {
          fg = constants.theme.border.default.blue;
        };
        title = {
          fg = constants.theme.text.secondary.blue;
          bold = true;
        };
        value = {
          fg = constants.theme.text.primary.gray;
        };
        selected = {
          fg = constants.theme.text.secondary.amber;
          bg = constants.theme.componentBackground.active.amber;
        };
      };

      cmp = {
        border = {
          fg = constants.theme.border.default.blue;
        };
        active = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.componentBackground.active.gray;
          bold = true;
        };
        inactive = {
          fg = constants.theme.text.secondary.gray;
          bg = constants.theme.componentBackground.default.gray;
        };
      };

      tasks = {
        border = {
          fg = constants.theme.border.default.blue;
        };
        title = {
          fg = constants.theme.text.secondary.blue;
          bold = true;
        };
        hovered = {
          fg = constants.theme.text.primary.gray;
          bg = constants.theme.componentBackground.active.gray;
        };
      };

      help = {
        on = {
          fg = constants.theme.text.secondary.amber;
        };
        run = {
          fg = constants.theme.text.primary.gray;
        };
        desc = {
          fg = constants.theme.text.secondary.gray;
        };
        hovered = {
          bg = constants.theme.componentBackground.active.gray;
        };
        footer = {
          fg = constants.theme.text.secondary.green;
        };
      };
    };
  };
}
