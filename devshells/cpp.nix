# C/C++ environment. The library headers here were inert as systemPackages
# (nothing set the search paths); as mkShell buildInputs they work — the
# compiler wrappers and pkg-config see them.
pkgs: {
  packages = with pkgs; [
    # gcc before clang: both provide cc/c++, PATH order makes gcc win.
    gcc
    clang
    gnumake
    binutils
    pkg-config
    patchelf

    # Autotools, CMake & Meson
    autoconf
    automake
    libtool
    cmake
    meson
    ninja

    # Debugging & profiling
    gdb
    valgrind
  ];

  # Libraries: buildInputs resolve to the dev outputs automatically.
  buildInputs = with pkgs; [
    openssl
    zlib
    libffi
    readline
    ncurses
    sqlite
    libxml2
    curl
    glib
    pcre
  ];
}
