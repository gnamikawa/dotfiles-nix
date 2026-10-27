# clip-studio — Clip Studio Paint 3 under Wine-Staging, with its web panels
# and the pen working.
#
# CSP shows web pages in two different embedded browsers, and Wine needs help
# with both:
#
#   - Internet Explorer panels, such as the "New features" page CSP opens after
#     its first-run setup. Wine draws these with Wine Gecko. Without Gecko, or
#     with Wine's HTML engine (`mshtml`) left unregistered, every page fails
#     with "class not registered" (80040154); CSP treats that as being offline,
#     loads its offline page, that fails too, and the panel reloads forever as
#     a white window whose close button never answers (measured 2026-10-27,
#     about 48,000 reloads in a few minutes). Wine-Staging *Full* ships the
#     Gecko installer inside Wine itself, so a new prefix installs it without a
#     download or a prompt.
#   - WebView2 panels, an embedded Edge browser that CSP loads for its sign-in
#     and store pages. These need DirectComposition (the system that places
#     WebView2's drawn output into a window), and Wine, Staging included, only
#     has a placeholder for it. Three pieces fill the gap:
#       - A DirectComposition shim (`dcomp.dll`) from the CSPenguin installer,
#         built here from its source at a pinned commit rather than taken
#         prebuilt. It fakes DirectComposition on top of Direct3D 11 and copies
#         WebView2's frames into the window.
#       - DXVK, which runs Direct3D 9–11 on Vulkan. The shim is written against
#         it: DXVK refuses the composition swap chain WebView2 asks for, and
#         the shim hands back its own instead.
#       - The Fixed Version WebView2 runtime: a plain archive with no installer
#         and no updater, so nothing reports back to Microsoft the way Edge's
#         updater would.
#
# The Wine prefix itself is per-user state Wine creates, not something this
# module declares. To make one:
#
#   WINEPREFIX=~/.local/share/wineprefixes/clipstudio \
#     WINEDLLOVERRIDES="winemenubuilder.exe=d" wineboot -i
#   winetricks --optout --country=JP -q vcrun2005 vcrun2008 vcrun2010 \
#     msxml4 msxml6 corefonts atmlib gdiplus fontsmooth=rgb
#   wine reg: HKCU\Software\Wine Version=win10; AppDefaults Version=win81 for
#     CLIPStudioPaint.exe and CLIPStudio.exe, win7 for msedgewebview2.exe;
#     DllOverrides concrt140=native
#   then CSP_308w_setup.exe from clipstudio.net, run inside a virtual desktop
#     (`wine explorer /desktop=CSPSetup,1600x1000 …`) because its window stays
#     white under Hyprland otherwise.
#
# Do not disable `mshtml` while creating the prefix to dodge the Gecko prompt:
# that also skips the step where the HTML engine registers itself, which is
# the failure above. A prefix made that way is repaired with
# `wine regsvr32 mshtml.dll` once Gecko is installed.
#
# The pen: under XWayland, Wine 11.16 reports the pen tip to Wintab as button
# 1 instead of 0, so CSP's plain Wintab mode never sees the pen touch down.
# In CSP, set File → Preferences → Tablet to Wintab with "Use mouse mode in
# setting of tablet driver" on: CSP then takes position and pen-down from the
# mouse and only pressure and tilt from Wintab. That setting lives in CSP's own
# preferences inside the prefix.

{ pkgs, config, ... }:
let
  cspenguinSrc = pkgs.fetchFromGitHub {
    owner = "parka6060";
    repo = "CSPenguin-Installer";
    rev = "868d022adfdc3740449241f4721debbf4b1b1426";
    hash = "sha256-u/1VeDEbM5RdlnjF0Vc9n9x/6Y3R5hVJO87WVZryA6I=";
  };

  # The same command as the upstream patches/dcomp/build.sh.
  dcompBuild = ''
    $CXX -shared -static -O2 -std=c++17 \
      -o dcomp.dll patches/dcomp/dcomp_csp.cpp patches/dcomp/dcomp.def \
      -lole32 -lgdi32 -ldxgi -ld3d11 -luuid
  '';

  dcomp = pkgs.pkgsCross.mingwW64.stdenv.mkDerivation {
    pname = "cspenguin-dcomp";
    version = "0-unstable-2026-08-24";
    src = cspenguinSrc;
    dontConfigure = true;
    buildPhase = dcompBuild;
    installPhase = "install -Dm644 dcomp.dll $out/bin/dcomp.dll";
  };

  webview2Version = "156.0.4314.50";

  # Microsoft only hosts the latest two major Fixed Versions, so this URL will
  # eventually disappear; a fresh build then fails here until it is bumped.
  webview2Cab = pkgs.fetchurl {
    url = "https://msedge.sf.dl.delivery.mp.microsoft.com/filestreamingservice/files/bd9305d7-a7d7-44fe-b8bf-aefad5d6cdb5/Microsoft.WebView2.FixedVersionRuntime.${webview2Version}.x64.cab";
    hash = "sha256-/PDNVffG6O/O0FEUNy3ouP/JAywCltFuBg0mBjff5fI=";
  };

  webview2 = pkgs.stdenvNoCC.mkDerivation {
    pname = "webview2-fixed-runtime";
    version = webview2Version;
    src = webview2Cab;
    nativeBuildInputs = [ pkgs.cabextract ];
    dontUnpack = true;
    installPhase = ''
      cabextract -q -d . $src
      mv Microsoft.WebView2.FixedVersionRuntime.${webview2Version}.x64 $out
    '';
  };

  # DXVK's DLLs are in its `bin` output; the default `out` only holds
  # setup_dxvk.sh.
  launcherPaths = ''
    dxvk_dir=${pkgs.dxvk.bin}/x64
    dcomp_dll=${dcomp}/bin/dcomp.dll
    webview2_dir=${webview2}
  '';

  clipStudioPaint = pkgs.writeShellApplication {
    name = "clip-studio-paint";
    runtimeInputs = [ pkgs.wineWow64Packages.stagingFull ];
    text = launcherPaths + builtins.readFile ./clip-studio-paint.sh;
  };
in
{
  home.packages = [
    (config.lib.nixGL.wrap clipStudioPaint)
  ];

  xdg.desktopEntries.clip-studio-paint = {
    name = "Clip Studio Paint";
    comment = "Illustration and comic drawing (Wine)";
    exec = "clip-studio-paint";
    categories = [ "Graphics" ];
    terminal = false;
    type = "Application";
  };
}
