{ pkgs, ... }:
{
  home.sessionVariables = {
    EDITOR = "nvim";
  };
  home.packages = with pkgs; [
    (neovim.override {
      withPython3 = true;
      withRuby = true;
      withNodeJs = true;
    })
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
}
