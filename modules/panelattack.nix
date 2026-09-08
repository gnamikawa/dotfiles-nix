{ pkgs, config, ... }:
let
  src = pkgs.fetchurl {
    url = "https://panelattack.com/downloads/updater/linux/panel-attack.AppImage";
    hash = "sha256-jH4Vdg6unuubrOVP+TUOP1M0VcEgkuM5LZm1Jx2oRTw=";
  };

  extracted = pkgs.appimageTools.extractType2 {
    pname = "panel-attack";
    version = "unstable";
    inherit src;
  };

  panelAttack = pkgs.appimageTools.wrapType2 {
    pname = "panel-attack";
    version = "unstable";
    inherit src;
  };
in
{
  home.packages = [
    (config.lib.nixGL.wrap panelAttack)
  ];

  xdg.desktopEntries.panel-attack = {
    name = "Panel Attack";
    comment = "Puzzle game built with LÖVE";
    exec = "panel-attack";
    icon = "panel-attack";
    categories = [ "Game" ];
    terminal = false;
    type = "Application";
  };

  xdg.dataFile."icons/hicolor/256x256/apps/panel-attack.png".source = "${extracted}/icon.png";
}
