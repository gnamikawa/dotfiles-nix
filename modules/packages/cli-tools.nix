{ pkgs, ... }:
{
  # Terminal-only tools — everything here must be useful on a headless box.
  # Ambient layer (CONTEXT.md): no compilers, runtimes, or toolchains — those
  # live in the devshells/ catalog as development environments.
  home.packages = with pkgs; [

    # ── System Monitors ───────────────────────────────────────────────────────
    htop
    bottom

    # ── Development ───────────────────────────────────────────────────────────
    nix-index
    gh # GitHub CLI
    shellcheck
    shfmt
    strace
    ltrace

    # ── Search & Files ────────────────────────────────────────────────────────
    fzf
    ripgrep
    bat
    atool
    unrar
    p7zip
    stow
    moreutils
    rsync

    # ── Text & Data ───────────────────────────────────────────────────────────
    jq # JSON processor
    yq # YAML/TOML processor

    # ── Documents & Previews ──────────────────────────────────────────────────
    poppler-utils
    odt2txt
    ueberzug
    libcaca
    exiftool

    # ── Terminal Multiplexer ──────────────────────────────────────────────────
    tmux

    # ── Secrets ───────────────────────────────────────────────────────────────
    gnupg

    # ── Etc ───────────────────────────────────────────────────────────────────
    xclip
    fastfetch
    yt-dlp

    # ── System Management ─────────────────────────────────────────────────────
    home-manager

  ];
}
