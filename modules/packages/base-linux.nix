{ pkgs, ... }:
{
  home.packages = with pkgs; [

    # ── Core GNU Userspace ────────────────────────────────────────────────────
    coreutils
    findutils
    gnugrep
    gnused
    gawk
    diffutils

    # ── Shell Utilities ───────────────────────────────────────────────────────
    bash
    less
    which
    tree

    # ── Process & System Tools ────────────────────────────────────────────────
    procps
    psmisc
    util-linux
    sysstat

    # ── Networking ────────────────────────────────────────────────────────────
    iproute2
    iputils
    inetutils
    netcat
    traceroute
    wget
    curl
    bind
    whois

    # ── Compression & Archives ────────────────────────────────────────────────
    gzip
    bzip2
    xz
    zip
    unzip
    cpio
    gnutar

    # ── Filesystems & Disks ───────────────────────────────────────────────────
    e2fsprogs
    dosfstools
    parted
    hdparm
    usbutils
    lsof

    # ── Editors & Text ────────────────────────────────────────────────────────
    vim
    ed
    patch
    vscode
    claude-code

    # ── Misc ──────────────────────────────────────────────────────────────────
    bc
    time
    man-db

    # ── Guide compatibility (CONTEXT.md) ──────────────────────────────────────
    # Kept because external documentation assumes them, not for habitual use.
    perl
    dash
    diffstat
    patchutils

  ];
}
