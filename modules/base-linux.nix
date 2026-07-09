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
    kmod
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

    # ── Misc ──────────────────────────────────────────────────────────────────
    bc
    time
    man-db
    shadow
    cron

  ];
}
