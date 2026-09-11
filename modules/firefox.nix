{ pkgs, config, ... }:
let
  toolbarLayout = builtins.toJSON {
    placements = {
      "widget-overflow-fixed-list" = [ ];
      "unified-extensions-area" = [
        "_d7742d87-e61d-4b78-b8a1-b469842139fa_-browser-action"
        "ublock0_raymondhill_net-browser-action"
        "keepassxc-browser_keepassxc_org-browser-action"
      ];
      "nav-bar" = [
        "back-button"
        "forward-button"
        "stop-reload-button"
        "customizableui-special-spring1"
        "vertical-spacer"
        "urlbar-container"
        "customizableui-special-spring2"
        "downloads-button"
        "fxa-toolbar-menu-button"
        "reset-pbm-toolbar-button"
        "unified-extensions-button"
      ];
      "toolbar-menubar" = [ "menubar-items" ];
      TabsToolbar = [
        "firefox-view-button"
        "tabbrowser-tabs"
        "new-tab-button"
        "alltabs-button"
      ];
      "vertical-tabs" = [ ];
      PersonalToolbar = [
        "import-button"
        "personal-bookmarks"
      ];
    };
    seen = [
      "reset-pbm-toolbar-button"
      "_d7742d87-e61d-4b78-b8a1-b469842139fa_-browser-action"
      "ublock0_raymondhill_net-browser-action"
      "keepassxc-browser_keepassxc_org-browser-action"
      "developer-button"
      "screenshot-button"
    ];
    dirtyAreaCache = [
      "unified-extensions-area"
      "nav-bar"
      "vertical-tabs"
      "PersonalToolbar"
      "toolbar-menubar"
      "TabsToolbar"
    ];
    currentVersion = 24;
    newElementCount = 2;
  };
in
{
  programs.firefox = {
    enable = true;
    package = config.lib.nixGL.wrap pkgs.firefox;
    nativeMessagingHosts = [ pkgs.keepassxc ];
    configPath = "${config.xdg.configHome}/mozilla/firefox";
    profiles.minimal = {
      id = 0;
      name = "Minimal";
      settings = {
        "browser.aboutConfig.showWarning" = false;
        "browser.ai.control.default" = "blocked";
        "browser.ai.control.linkPreviewKeyPoints" = "blocked";
        "browser.ai.control.pdfjsAltText" = "blocked";
        "browser.ai.control.sidebarChatbot" = "blocked";
        "browser.ai.control.smartTabGroups" = "blocked";
        "browser.ai.control.smartWindow" = "blocked";
        "browser.ai.control.translations" = "blocked";
        "browser.ml.chat.enabled" = false;
        "browser.ml.chat.page" = false;
        "browser.ml.linkPreview.enabled" = false;
        "browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons" = false;
        "browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features" = false;
        "browser.newtabpage.activity-stream.feeds.snippets" = false;
        "browser.newtabpage.activity-stream.feeds.topsites" = false;
        "browser.newtabpage.activity-stream.weather.temperatureUnits" = "c";
        "browser.newtabpage.enabled" = false;
        "browser.search.region" = "US";
        "browser.search.suggest.enabled" = false;
        "browser.smartwindow.memories.generateFromConversation" = false;
        "browser.smartwindow.memories.generateFromHistory" = false;
        "browser.startup.homepage" = "chrome://browser/content/blanktab.html";
        "browser.startup.page" = 3;
        "browser.tabs.firefox-view" = false;
        "browser.tabs.groups.smart.enabled" = false;
        "browser.tabs.groups.smart.userEnabled" = false;
        "browser.theme.content-theme" = 0;
        "browser.theme.toolbar-theme" = 0;
        "browser.translations.enable" = false;
        "browser.uiCustomization.state" = toolbarLayout;
        "browser.urlbar.showSearchSuggestionsFirst" = false;
        "browser.urlbar.suggest.bookmark" = false;
        "browser.urlbar.suggest.engines" = false;
        "browser.urlbar.suggest.openpage" = false;
        "browser.urlbar.suggest.quickactions" = false;
        "browser.urlbar.suggest.quicksuggest.all" = false;
        "browser.urlbar.suggest.quicksuggest.sponsored" = false;
        "browser.urlbar.suggest.recentsearches" = false;
        "browser.urlbar.suggest.searches" = false;
        "browser.urlbar.suggest.topsites" = false;
        "browser.urlbar.suggest.trending" = false;
        "devtools.chrome.enabled" = true;
        "devtools.debugger.remote-enabled" = true;
        "extensions.autoDisableScopes" = 0;
        "extensions.formautofill.addresses.enabled" = false;
        "extensions.formautofill.creditCards.enabled" = false;
        "extensions.ml.enabled" = false;
        "extensions.update.autoUpdateDefault" = false;
        "extensions.update.enabled" = false;
        "findbar.highlightAll" = true;
        "general.smoothScroll" = false;
        "layout.css.prefers-color-scheme.content-override" = 0;
        "network.dns.disablePrefetch" = true;
        "network.http.speculative-parallel-limit" = 0;
        "network.prefetch-next" = false;
        "nimbus.rollouts.enabled" = false;
        "pdfjs.enableAltText" = false;
        "privacy.globalprivacycontrol.enabled" = true;
        "toolkit.legacyUserProfileCustomizations.stylesheets" = true;
      };

      userChrome = builtins.readFile ../assets/home/.mozilla/firefox/minimal.default/chrome/userChrome.css;

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
}
