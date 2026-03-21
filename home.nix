let
  constants = import ./constants.nix;
in
{
  home-manager.useGlobalPkgs = true;
  home-manager.useUserPackages = true;
  home-manager.users.genzo =
    { pkgs, ... }:
    {
      xdg = {
        autostart.enable = true;
        mimeApps = {
          enable = true;
          defaultApplications = {
            "inode/directory" = "pcmanfm.desktop";
            "application/pdf" = "org.pwmt.zathura-pdf-mupdf.desktop";
            "image/*" = "feh.desktop";
          };
        };
      };
      home.username = "genzo";
      home.homeDirectory = "/home/genzo";
      home.stateVersion = "25.11";
      home.file =
        let
          configNames = builtins.attrNames (builtins.readDir ./assets/home/.config);
          configMappings = builtins.listToAttrs (
            builtins.map (name: {
              name = ".config/${name}";
              value = {
                source = ./assets/home/.config/${name};
              };
            }) configNames
          );
        in
        { } // configMappings;

      home.packages = with pkgs; [
        nix-index
        stdenv.cc.cc.lib
        playerctl
        python313Packages.ueberzug
        udiskie
        # cudaPackages.cudnn
        cudatoolkit
        bottom
        nvtopPackages.full
        gperftools
        pcmanfm
        krita
        blender
        mpv
        file-roller
        feh
        zathura
        keepassxc
        libreoffice-qt6-fresh
        home-manager
        waybar
      ];

      programs = {
        kitty = {
          enable = true;
          enableGitIntegration = true;
          shellIntegration.enableBashIntegration = true;
          settings = {
            "confirm_os_window_close" = 0;
          };

          font = {
            name = "JetBrainsMono Nerd Font";
            package = pkgs.nerd-fonts.jetbrains-mono;
            size = 10;
          };

          extraConfig = ''
            background   ${constants.theme.blackout}
            foreground   ${constants.theme.lightgray}
            cursor       ${constants.theme.lightgray}
            cursor_text_color  ${constants.theme.blackout}
            selection_background #264f78
            selection_foreground ${constants.theme.lightgray}

            # Normal colors
            color0  ${constants.theme.blackout}
            color1  #f44747
            color2  #4ec9b0
            color3  #dcdcaa
            color4  #569cd6
            color5  #c586c0
            color6  #4ec9b0
            color7  ${constants.theme.lightgray}

            # Bright colors
            color8  ${constants.theme.lightblack}
            color9  #f44747
            color10 #4ec9b0
            color11 #dcdcaa
            color12 #569cd6
            color13 #c586c0
            color14 #4ec9b0
            color15 ${constants.theme.white}

            # Optional tab colors
            active_tab_background   ${constants.theme.blue} 
            active_tab_foreground   ${constants.theme.lightgray}
            inactive_tab_background ${constants.theme.lightblack}
            inactive_tab_foreground #6c6c6c
          '';
        };

        yazi = {
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

        # waybar.enable = true;

        # rclone = {
        #   enable = true;
        #   remotes.gdrive.config = {
        #     type = "drive";
        #     scope = "drive";
        #   };
        # };

        git = {
          enable = true;
          settings.user.name = "Genzo Namikawa";
          settings.user.email = "genzo.namikawa@outlook.com";
        };

        keepassxc = {
          enable = true;
          # autostart = true;
          settings = {
            Browser = {
              Enabled = true;
              UpdateBinaryPath = false;
            };

            GUI = {
              AdvancedSettings = true;
              ApplicationTheme = "dark";
              CompactMode = true;
              HidePasswords = true;
            };
          };
        };

        firefox = {
          enable = true;
          nativeMessagingHosts = [ pkgs.keepassxc ];
          profiles.minimal = {
            id = 0;
            name = "Minimal";
            settings = {
              "toolkit.legacyUserProfileCustomizations.stylesheets" = true;
              "extensions.autoDisableScopes" = 0;
              "extensions.update.autoUpdateDefault" = false;
              "extensions.update.enabled" = false;
              "browser.newtabpage.activity-stream.feeds.topsites" = false;
              "browser.newtabpage.activity-stream.feeds.snippets" = false;
              "browser.tabs.firefox-view" = false;
              "browser.search.region" = "US";
              "browser.theme.toolbar-theme" = 0;
              "browser.theme.content-theme" = 0;
              "browser.aboutConfig.showWarning" = false;
              "browser.newtabpage.activity-stream.weather.temperatureUnits" = "c";
            };

            userChrome = builtins.readFile ./assets/home/.mozilla/firefox/minimal.default/chrome/userChrome.css;

            extensions = {
              force = true;
              packages = [
                pkgs.nur.repos.rycee.firefox-addons.ublock-origin
                pkgs.nur.repos.rycee.firefox-addons.vimium
                pkgs.nur.repos.rycee.firefox-addons.keepassxc-browser
              ];
            };
          };
          policies = {
            ExtensionSettings = {
              "uBlock0@raymondhill.net" = {
                default_area = "navbar";
                updates_disabled = true;
                private_browsing = true;
                restricted_domains = [ ];
              };
              "keepassxc-browser@keepassxc.org" = {
                default_area = "navbar";
                updates_disabled = true;
                private_browsing = true;
                restricted_domains = [ ];
              };
              "{d7742d87-e61d-4b78-b8a1-b469842139fa}" = {
                default_area = "navbar";
                updates_disabled = true;
                private_browsing = true;
                restricted_domains = [ ];
              };
            };
            DontCheckDefaultBrowser = true;
            DisplayBookmarksToolbar = "never";
            DisableFirefoxAccounts = true;
            DisableTelemetry = true;
            FirefoxHome = {
              TopSites = false;
              SponsoredTopSites = false;
              Highlights = false;
              Pocket = false;
              SponsoredPocket = false;
              Snippets = false;
              Search = true;
              Locked = false;
            };
            OfferToSaveLogins = false;
            OfferToSaveLoginsDefault = false;
          };
        };

        neovim = {
          enable = true;
          defaultEditor = true;
          extraPackages = with pkgs; [
            go
            cargo
            clang
            nodejs_24
            unzip
            luarocks
            fzf
            ripgrep
            ghostscript
            mermaid-cli
            tectonic
            tetex
            kitty
            wezterm
            ghostty
            fd
            lua5_1
            sqlite
            lazygit
          ];
        };

        bash = {
          enable = true;
          bashrcExtra = builtins.readFile ./assets/home/.bashrc;
          shellAliases = {
            fzf = "fzf --preview \"bat --color=always --style=numbers --line-range=:500 {}\"";
          };
        };
      };

      systemd.user.services = {
        top-waybar = {
          Unit = {
            Description = "top waybar";
            After = [ "graphical-session.target" ];
            PartOf = [ "graphical-session.target" ];
          };
          Service = {
            Type = "simple";
            ExecStart = "${pkgs.waybar}/bin/waybar -c %h/.config/waybar/top.jsonc -s %h/.config/waybar/style.css";
            Restart = "on-failure";
          };
          Install.WantedBy = [ "graphical-session.target" ];
        };

        bottom-waybar = {
          Unit = {
            Description = "bottom waybar";
            After = [ "graphical-session.target" ];
            PartOf = [ "graphical-session.target" ];
          };
          Service = {
            Type = "simple";
            ExecStart = "${pkgs.waybar}/bin/waybar -c %h/.config/waybar/bottom.jsonc -s %h/.config/waybar/style.css";
            Restart = "on-failure";
          };
          Install.WantedBy = [ "graphical-session.target" ];
        };

        etc-waybar = {
          Unit = {
            Description = "waybar displayed on all sub-monitors";
            After = [ "graphical-session.target" ];
            PartOf = [ "graphical-session.target" ];
          };
          Service = {
            Type = "simple";
            ExecStart = "${pkgs.waybar}/bin/waybar -c %h/.config/waybar/etc.jsonc -s %h/.config/waybar/style.css";
            Restart = "on-failure";
          };
          Install.WantedBy = [ "graphical-session.target" ];
        };

        fcitx5-tray = {
          Unit = {
            Description = "Fcitx 5 Tray Applet";
            After = [ "graphical-session.target" ];
            PartOf = [ "graphical-session.target" ];
          };
          Service = {
            Type = "simple";
            ExecStart = "${pkgs.fcitx5}/bin/fcitx5";
          };
          Install.WantedBy = [ "graphical-session.target" ];
        };

        mako = {
          Unit = {
            Description = "Mako Notifications";
            After = [ "graphical-session.target" ];
            PartOf = [ "graphical-session.target" ];
          };
          Service = {
            Type = "simple";
            ExecStart = "${pkgs.mako}/bin/mako";
          };
          Install.WantedBy = [ "graphical-session.target" ];
        };

        # keepassxc = {
        #   Unit = {
        #     Description = "Password Manager";
        #     After = [ "graphical-session.target" ];
        #     PartOf = [ "graphical-session.target" ];
        #   };
        #   Service = {
        #     Type = "simple";
        #     ExecStart = "${pkgs.keepassxc}/bin/keepassxc --minimized --keyfile /mnt/windows/Users/Genzo/Dropbox/Passwords.kbdx";
        #   };
        #   Install.WantedBy = [ "graphical-session.target" ];
        # };
      };
    };
}
