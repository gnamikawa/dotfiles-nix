{ pkgs, config, ... }:
let
  # Neovim with the language providers Lazyvim expects.
  nvim = pkgs.neovim.override {
    withPython3 = true;
    withRuby = true;
    withNodeJs = true;
  };

  # Wrap Neovim in an FHS environment. Nvim's own package managers (Mason,
  # luarocks, treesitter's parser installer) drop prebuilt FHS-linked
  # binaries under $HOME; on NixOS those binaries have no /lib64 loader to
  # start from and crash before their first line runs. Wrapping makes the
  # standard loader path plus the common runtime libraries available inside
  # a mount namespace nvim and every subprocess it spawns share, so :Mason
  # can install any LSP without a corresponding Nix change. The wrapper
  # touches only what nvim launches; everything outside nvim is unaffected.
  nvim-fhs = pkgs.buildFHSEnv {
    name = "nvim";
    targetPkgs =
      pkgs: with pkgs; [
        nvim
        icu
        stdenv.cc.cc.lib
        zlib
        openssl
        curl
        expat
        sqlite
        glibc
        libxml2
        libxcrypt
      ];
    runScript = "nvim";
  };
in
{
  home.sessionVariables = {
    EDITOR = "nvim";
  };
  home.packages = with pkgs; [
    nvim-fhs
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
    (config.lib.nixGL.wrap kitty)
    (config.lib.nixGL.wrap wezterm)
    (config.lib.nixGL.wrap ghostty)
    fd
    lua5_1
    sqlite
    lazygit
    tree-sitter
  ];
}
