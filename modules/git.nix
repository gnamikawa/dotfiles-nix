{ ... }:
{
  programs.git = {
    enable = true;
    lfs.enable = true;
    settings.user.name = "Genzo Namikawa";
    settings.user.email = "genzo.namikawa@outlook.com";
    settings.pull.rebase = true;
    settings.pull.autoStash = true;
    settings.rebase.autoStash = true;
  };
}
