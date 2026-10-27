# Starts Clip Studio Paint from its own Wine prefix, with the three pieces
# Wine lacks for CSP's sign-in and store panels. default.nix exports the store
# paths this script reads: dxvk_dir, dcomp_dll and webview2_dir.

prefix="${CLIP_STUDIO_PREFIX:-$HOME/.local/share/wineprefixes/clipstudio}"
system32="$prefix/drive_c/windows/system32"
paint_exe='C:\Program Files\CELSYS\CLIP STUDIO 1.5\CLIP STUDIO PAINT\CLIPStudioPaint.exe'

if [[ ! -d $system32 ]]; then
  echo "clip-studio-paint: no Wine prefix at $prefix; see modules/clip-studio/default.nix in dotfiles-nix for how to create one" >&2
  exit 1
fi

export WINEPREFIX="$prefix"

# Wine only loads a native DLL from inside the prefix, so the Nix-built ones
# are linked into system32. Relinking on every start keeps the links on the
# current store paths after a rebuild.
for dll in "$dxvk_dir/d3d11.dll" "$dxvk_dir/d3d10core.dll" "$dxvk_dir/dxgi.dll" "$dcomp_dll"; do
  ln -sf "$dll" "$system32/${dll##*/}"
done

# For this run only, prefer those DLLs over Wine's own, and keep Wine's menu
# builder and Edge's updater from starting.
export WINEDLLOVERRIDES="d3d11,d3d10core,dxgi,dcomp=n;winemenubuilder.exe,MicrosoftEdgeUpdate.exe=d"

# CSP's WebView2 loader reads this variable for the runtime's folder. Z: is
# Wine's drive for the Linux root, so the store path is reachable as-is.
export WEBVIEW2_BROWSER_EXECUTABLE_FOLDER="Z:${webview2_dir//\//\\}"

exec wine "$paint_exe" "$@"
