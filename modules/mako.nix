{
  pkgs,
  config,
  constants,
  ...
}:
{
  services.mako = {
    enable = true;
    package = config.lib.nixGL.wrap pkgs.mako;

    settings = {
      sort = "-time";
      layer = "overlay";

      width = 300;
      height = 110;

      border-size = 1;
      border-radius = 4;

      default-timeout = 5000;
      ignore-timeout = true;

      background-color = constants.theme.componentBackground.active.gray;
      border-color = constants.theme.border.active.gray;
      text-color = constants.theme.text.primary.gray;
      progress-color = constants.theme.border.active.gray;
      font = "JetBrainsMono Nerd Font,JetBrainsMono NF 10";

      max-icon-size = 64;
      icons = true;

      "urgency=low" = {
        background-color = constants.theme.componentBackground.active.teal;
        border-color = constants.theme.border.active.teal;
        text-color = constants.theme.text.primary.teal;
      };

      "urgency=normal" = {
        background-color = constants.theme.componentBackground.active.gray;
        border-color = constants.theme.border.active.gray;
        text-color = constants.theme.text.primary.gray;
      };

      "urgency=high" = {
        background-color = constants.theme.componentBackground.active.red;
        border-color = constants.theme.border.active.red;
        text-color = constants.theme.text.primary.red;
        default-timeout = 0;
      };

      "category=mpd" = {
        default-timeout = 2000;
        group-by = "category";
      };
    };
  };
}
