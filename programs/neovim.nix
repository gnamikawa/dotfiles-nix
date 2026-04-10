{ pkgs, ... }:
{
  programs.neovim = {
    enable = true;
    withPython3 = true;
    withRuby = true;
    withNodeJs = true;
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
      tree-sitter
    ];
  };
}
