{ ... }:
{
  programs.bash = {
    enable = true;
    bashrcExtra = builtins.readFile ../assets/home/.bashrc;
    shellAliases = {
      fzf = "fzf --preview \"bat --color=always --style=numbers --line-range=:500 {}\"";
    };
  };
}
