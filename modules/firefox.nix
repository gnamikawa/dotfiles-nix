{ pkgs, config, ... }:
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
