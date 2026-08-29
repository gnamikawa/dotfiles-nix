# geistdesign.nix — the generated Geist design-system package consumed by AGS.
#
# constants/ is the source of truth. This package emits its two native views
# together: CSS for GTK and a TypeScript module for widget properties. The
# session reaches it through ~/.local/share/geistdesign; the greeter consumes
# this store path while it is bundled.

{
  pkgs,
  constants,
}:

let
  inherit (pkgs) lib;

  kebab = value:
    value |> lib.stringToCharacters |> lib.concatMapStrings (
      character:
      if builtins.match "[A-Z]" character != null then "-${lib.toLower character}" else character
    );

  propertyName = path: "--ds-${lib.concatMapStringsSep "-" kebab path}";

  cssValue = path: value:
    if lib.last path == "duration" then "${toString value}ms" else toString value;

  properties = path: values:
    if lib.isAttrs values then
      values |> lib.attrNames |> lib.concatMapStrings (
        name: properties (path ++ [ name ]) values.${name}
      )
    else
      "  ${propertyName path}: ${cssValue path values};\n";

  themeProperties = theme:
    let
      paletteMinusColors = lib.removeAttrs constants.palette.${theme} [ "colors" ];
    in
    properties [ ] paletteMinusColors
    + properties [ ] constants.palette.${theme}.colors
    + properties [ ] constants.theme.${theme}
    + properties [ "shadow" ] constants.shadow.${theme}
    + properties [ "focus" ] constants.focus.${theme};

  typeProperties = values:
    let
      renderProperty = name:
        let
          cssName = {
            family = "font-family";
            size = "font-size";
            lineHeight = "line-height";
            weight = "font-weight";
            letterSpacing = "letter-spacing";
          }.${name};
          value = values.${name};
          rendered = if name == "family" then "\"${value}\"" else toString value;
        in
        "  ${cssName}: ${rendered};\n";
    in
    values |> lib.attrNames |> lib.concatMapStrings renderProperty;

  typeClasses =
    let
      perFamily = family:
        constants.type.${family} |> lib.attrNames |> lib.concatMapStrings (
          size:
          ".text-${family}-${size} {\n${typeProperties constants.type.${family}.${size}}}\n\n"
        );
    in
    [ "heading" "copy" "label" "button" ] |> lib.concatMapStrings perFamily;

  stylesheetText = ''
    /* Generated from constants/. Do not edit: update the source token family. */

    :root {
    ${properties [ ] {
      inherit (constants.palette) debug black white contrast-fg;
    }}${properties [ "radius" ] constants.radius}${properties [ "motion" ] constants.motion}}

    :root,
    .light .invert-theme {
    ${themeProperties "dark"}}

    .light,
    .invert-theme {
    ${themeProperties "light"}}

    ${typeClasses}
  '';
  stylesheet = pkgs.writeText "geistdesign.css" stylesheetText;

  typescriptText = ''
    // Generated from constants/. CSS owns every colour; this module carries
    // only values GTK widgets cannot consume from a stylesheet.
    export const space = ${builtins.toJSON constants.space} as const

    export const motion = ${builtins.toJSON {
      overlay.duration = constants.motion.overlay.duration;
      popover.duration = constants.motion.popover.duration;
    }} as const
  '';
  typescript = pkgs.writeText "index.ts" typescriptText;

  # Lucide's SVG icon set, fetched from the npm registry rather than the
  # nixpkgs `lucide` package — that one ships only the icon font (TTF).
  # Version pinned; bump alongside a design review of new/removed glyphs.
  lucideStatic = pkgs.fetchzip {
    url = "https://registry.npmjs.org/lucide-static/-/lucide-static-0.563.0.tgz";
    hash = "sha256-mBeO8NhPOQjWNScprXVqsTzWbBVFpRFd0jg2s8r3yuo=";
  };

  # Bake the dark theme's text-primary-gray into every SVG's stroke.
  # Lucide files declare `stroke="currentColor"`, which resolves to black
  # when GTK loads the file directly (no CSS context reaches the raster).
  # Baking sidesteps GTK's symbolic-icon rewiring for now; add a per-token
  # sibling directory here when a second colour needs its own set.
  lucideStrokeColour = constants.palette.dark.colors.gray."1000";

  buildScript = ''
    mkdir -p "$out" "$out/icons/lucide"
    cp ${stylesheet} "$out/geistdesign.css"
    cp ${typescript} "$out/index.ts"
    for svg in ${lucideStatic}/icons/*.svg; do
      name="$(basename "$svg")"
      sed 's|stroke="currentColor"|stroke="${lucideStrokeColour}"|g' \
        "$svg" > "$out/icons/lucide/$name"
    done
  '';
in
pkgs.runCommand "geistdesign" { } buildScript
