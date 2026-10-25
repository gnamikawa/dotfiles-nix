{ constants, pkgs, ... }:
let
  # Plugins come from nixpkgs so they move in lockstep with the yazi binary;
  # hand-pinned copies drifted behind yazi's plugin API and broke at runtime.
  # Upstream bookmarks.yazi still calls `ya.mgr_emit`, which yazi renamed to
  # `ya.emit`. --replace-fail turns this into a build error once upstream
  # fixes it, which is the cue to delete the override.
  bookmarks = pkgs.yaziPlugins.bookmarks.overrideAttrs (old: {
    postPatch = (old.postPatch or "") + ''
      substituteInPlace main.lua --replace-fail "ya.mgr_emit(" "ya.emit("
    '';
  });
in
{
  programs.yazi = {
    shellWrapperName = "y";
    enable = true;
    enableBashIntegration = true;
    extraPackages = with pkgs; [
      ueberzugpp
      ffmpeg
      poppler-utils
      imagemagick
      fzf
      fd
      ripgrep
      chafa
      zoxide
      _7zz
      resvg
      jq
    ];
    initLua = ''
      require("git"):setup({
        order = 1500
      })

      require("full-border"):setup({
      	-- Available values: ui.Border.PLAIN, ui.Border.ROUNDED
      	type = ui.Border.ROUNDED,
      })

      require("restore"):setup({
        position = { "center", w = 70, h = 40 },
        show_confirm = true,
        suppress_success_notification = true,
        theme = {
          title = "blue",
          header = "green",
          header_warning = "yellow",
          list_item = { odd = "blue", even = "blue" },
        }
      })

      require("bookmarks"):setup({
        last_directory = { enable = false, persist = false, mode = "dir" },
        persist = "none",
        desc_format = "full",
        file_pick_mode = "hover",
        custom_desc_input = false,
        show_keys = false,
        notify = {
          enable = false,
          timeout = 1,
          message = {
            new = "New bookmark '<key>' -> '<folder>'",
            delete = "Deleted bookmark in '<key>'",
            delete_all = "Deleted all bookmarks",
          }
        }
      })
    '';
    plugins = {
      inherit (pkgs.yaziPlugins)
        git
        full-border
        mount
        clipboard
        restore
        compress
        ;
      inherit bookmarks;
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
            on = "q";
            run = "noop";
          }
          {
            on = "M";
            run = "plugin mount";
            desc = "Open the mount manager";
          }

          # Restore plugin
          {
            on = "u";
            run = "plugin restore";
            desc = "Restore last deleted files/folders";
          }
          {
            on = [
              "d"
              "u"
            ];
            run = "plugin restore";
            desc = "Restore last deleted files/folders";
          }
          {
            on = [
              "d"
              "U"
            ];
            run = "plugin restore -- --interactive";
            desc = "Restore deleted files/folders (Interactive)";
          }

          # Clipboard plugin
          {
            on = "y";
            run = [
              "yank"
              "plugin clipboard -- --action=copy"
            ];
          }
          {
            on = "<C-p>";
            run = "plugin clipboard -- --action=paste";
          }

          # Bookmarks plugin
          {
            on = "m";
            run = "plugin bookmarks save";
            desc = "Save current position as a bookmark";
          }
          {
            on = "'";
            run = "plugin bookmarks jump";
            desc = "Jump to a bookmark";
          }
          {
            on = [
              "b"
              "d"
            ];
            run = "plugin bookmarks delete";
            desc = "Delete a bookmark";
          }
          {
            on = [
              "b"
              "D"
            ];
            run = "plugin bookmarks delete_all";
            desc = "Delete all bookmarks";
          }

          # Compress plugin
          {
            on = [
              "c"
              "a"
              "a"
            ];
            run = "plugin compress";
            desc = "Archive selected files";
          }
          {
            on = [
              "c"
              "a"
              "p"
            ];
            run = "plugin compress -p";
            desc = "Archive selected files (password)";
          }
          {
            on = [
              "c"
              "a"
              "h"
            ];
            run = "plugin compress -ph";
            desc = "Archive selected files (password+header)";
          }
          {
            on = [
              "c"
              "a"
              "l"
            ];
            run = "plugin compress -l";
            desc = "Archive selected files (compression level)";
          }
          {
            on = [
              "c"
              "a"
              "u"
            ];
            run = "plugin compress -phl";
            desc = "Archive selected files (password+header+level)";
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
            group = "git";
          }
          {
            id = "git";
            url = "*/";
            run = "git";
            group = "git";
          }
        ];
      };
    };

    theme = {
      app = {
        overall = {
          bg = constants.theme.dark.componentBackground.default.gray;
          fg = constants.theme.dark.text.primary.gray;
        };
      };

      mgr = {
        cwd = {
          fg = constants.theme.dark.text.secondary.gray;
        };
        find_keyword = {
          fg = constants.theme.dark.text.secondary.amber;
          bg = constants.theme.dark.componentBackground.active.amber;
          bold = true;
        };
        find_position = {
          fg = constants.theme.dark.text.secondary.amber;
          bg = constants.theme.dark.componentBackground.active.amber;
          bold = true;
        };
        symlink_target = {
          fg = constants.theme.dark.text.secondary.gray;
        };

        marker_copied = {
          fg = constants.theme.dark.text.secondary.teal;
        };
        marker_cut = {
          fg = constants.theme.dark.text.secondary.red;
        };
        marker_selected = {
          fg = constants.theme.dark.text.secondary.amber;
        };

        border_symbol = "│";
        border_style = {
          fg = constants.theme.dark.border.default.gray;
        };
      };

      indicator = {
        parent = {
          fg = constants.theme.dark.text.secondary.gray;
          bg = constants.theme.dark.componentBackground.hover.blue;
        };
        current = {
          fg = constants.theme.dark.text.secondary.blue;
          bg = constants.theme.dark.componentBackground.hover.blue;
          bold = true;
        };
        preview = {
          fg = constants.theme.dark.text.secondary.gray;
          bg = constants.theme.dark.componentBackground.hover.blue;
        };
        padding = {
          open = " ";
          close = " ";
        };
      };

      tabs = {
        active = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.background.default;
        };
        inactive = {
          fg = constants.theme.dark.text.secondary.gray;
          bg = constants.theme.dark.background.default;
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
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.highContrastBackground.default.blue;
          bold = true;
        };
        normal_alt = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.highContrastBackground.default.purple;
        };
        select_main = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.highContrastBackground.default.teal;
          bold = true;
        };
        select_alt = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.highContrastBackground.default.amber;
        };
        unset_main = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.highContrastBackground.default.red;
          bold = true;
        };
        unset_alt = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.highContrastBackground.default.pink;
        };
      };

      status = {
        overall = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.componentBackground.default.gray;
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
          fg = constants.theme.dark.text.secondary.gray;
        };
        perm_read = {
          fg = constants.theme.dark.text.secondary.green;
        };
        perm_write = {
          fg = constants.theme.dark.text.secondary.blue;
        };
        perm_exec = {
          fg = constants.theme.dark.text.secondary.amber;
        };
        perm_sep = {
          fg = constants.theme.dark.text.secondary.gray;
        };

        progress_label = {
          fg = constants.theme.dark.text.primary.gray;
          bold = true;
        };
        progress_normal = {
          fg = constants.theme.dark.text.primary.blue;
          bg = constants.theme.dark.highContrastBackground.default.gray;
        };
        progress_error = {
          fg = constants.theme.dark.text.primary.red;
          bg = constants.theme.dark.highContrastBackground.default.gray;
        };
      };

      filetype = {
        rules = [
          {
            mime = "inode/directory";
            fg = constants.theme.dark.text.secondary.blue;
          }
        ];
      };

      input = {
        border = {
          fg = constants.theme.dark.border.default.blue;
        };
        title = {
          fg = constants.theme.dark.text.secondary.blue;
          bold = true;
        };
        value = {
          fg = constants.theme.dark.text.primary.gray;
        };
        selected = {
          fg = constants.theme.dark.text.secondary.amber;
          bg = constants.theme.dark.componentBackground.active.amber;
        };
      };

      cmp = {
        border = {
          fg = constants.theme.dark.border.default.blue;
        };
        active = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.componentBackground.active.gray;
          bold = true;
        };
        inactive = {
          fg = constants.theme.dark.text.secondary.gray;
          bg = constants.theme.dark.componentBackground.default.gray;
        };
      };

      tasks = {
        border = {
          fg = constants.theme.dark.border.default.blue;
        };
        title = {
          fg = constants.theme.dark.text.secondary.blue;
          bold = true;
        };
        hovered = {
          fg = constants.theme.dark.text.primary.gray;
          bg = constants.theme.dark.componentBackground.active.gray;
        };
      };

      help = {
        on = {
          fg = constants.theme.dark.text.secondary.amber;
        };
        run = {
          fg = constants.theme.dark.text.primary.gray;
        };
        desc = {
          fg = constants.theme.dark.text.secondary.gray;
        };
        hovered = {
          bg = constants.theme.dark.componentBackground.active.gray;
        };
        footer = {
          fg = constants.theme.dark.text.secondary.green;
        };
      };
    };
  };
}
