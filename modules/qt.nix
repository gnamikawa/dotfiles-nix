{ ... }:
{
  qt = {
    enable = true;

    # "gtk" makes Qt apps inherit the active GTK theme — the
    # easiest way to get a unified look without separate styling.
    platformTheme.name = "gtk";

    # If you prefer a native Qt look instead, use:
    # platformTheme.name = "qtct";
    # style.name         = "kvantum";  # requires qt6Packages.qtstyleplugin-kvantum
  };

  home.sessionVariables = {
    QT_AUTO_SCREEN_SCALE_FACTOR = "1"; # HiDPI support
    QT_QPA_PLATFORM = "wayland;xcb"; # prefer Wayland, fall back to XCB
    # QT_SCALE_FACTOR = "1"; # override if auto-detection is wrong
  };
}
