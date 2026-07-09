{ constants, pkgs, ... }:
let
  yaziPluginRepoDir = pkgs.fetchFromGitHub {
    owner = "yazi-rs";
    repo = "plugins";
    rev = "196281844b8cbcac658a59013e4805300c2d6126";
    sha256 = "sha256-pAkBlodci4Yf+CTjhGuNtgLOTMNquty7xP0/HSeoLzE=";
  };
  bookmarksRepoDir = pkgs.fetchFromGitHub {
    owner = "dedukun";
    repo = "bookmarks.yazi";
    rev = "9ef1254d8afe88aba21cd56a186f4485dd532ab8";
    sha256 = "sha256-GQFBRB2aQqmmuKZ0BpcCAC4r0JFKqIANZNhUC98SlwY=";
  };
  restoreRepoDir = pkgs.fetchFromGitHub {
    owner = "boydaihungst";
    repo = "restore.yazi";
    rev = "0e0870460b9b74c5ae98b7f96c7c26a9a274ce6d";
    sha256 = "sha256-rDsyMF5IEBHx+fJ0oYTCCQAlTSquUcOkFLC4Lmbuz6k=";
  };
  clipboardRepoDir = pkgs.fetchFromGitHub {
    owner = "XYenon";
    repo = "clipboard.yazi";
    rev = "3b9681091b783d6bc5d07172afd6159060a7db63";
    sha256 = "sha256-8p2RC8F8JH1K36HebJM58stHX+lFLD+KYQxfdJm06y0=";
  };
  compressRepoDir = pkgs.fetchFromGitHub {
    owner = "KKV9";
    repo = "compress.yazi";
    rev = "46a6b9f02ff2f8aced466a1f01a3fe241f1cd45f";
    sha256 = "sha256-Mby185FCJY6nqHcHDQu+D5SLk+wGcyeUHK8yAvrd4TM=";
  };
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
      git = "${yaziPluginRepoDir}/git.yazi";
      full-border = "${yaziPluginRepoDir}/full-border.yazi";
      mount = "${yaziPluginRepoDir}/mount.yazi";
      clipboard = clipboardRepoDir;
      restore = restoreRepoDir;
      bookmarks = bookmarksRepoDir;
      compress = compressRepoDir;
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
