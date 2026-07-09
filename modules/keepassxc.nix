{ pkgs, config, ... }:
{
  programs.keepassxc = {
    package = config.lib.nixGL.wrap pkgs.keepassxc;
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

  # systemd.user.services.keepassxc = {
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
}
