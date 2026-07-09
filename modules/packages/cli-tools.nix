{ pkgs, ... }:
{
  # Terminal-only tools — everything here must be useful on a headless box.
  home.packages = with pkgs; [

    # ── System Monitors ───────────────────────────────────────────────────────
    htop
    bottom

    # ── Development ───────────────────────────────────────────────────────────
    clang
    cargo
    rust-analyzer
    nix-index

    # ── Search & Files ────────────────────────────────────────────────────────
    fzf
    ripgrep
    bat
    atool
    unrar
    p7zip
    stow

    # ── Documents & Previews ──────────────────────────────────────────────────
    poppler-utils
    odt2txt
    ueberzug
    libcaca
    exiftool

    # ── Etc ───────────────────────────────────────────────────────────────────
    xclip
    fastfetch
    yt-dlp

    # ── System Management ─────────────────────────────────────────────────────
    home-manager

  ];
}
