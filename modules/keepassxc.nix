{ ... }:
{
  programs.keepassxc = {
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
}
