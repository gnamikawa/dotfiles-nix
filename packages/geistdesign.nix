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
    lib.concatMapStrings (
      character:
      if builtins.match "[A-Z]" character != null then "-${lib.toLower character}" else character
    ) (lib.stringToCharacters value);

  propertyName = path: "--ds-${lib.concatMapStringsSep "-" kebab path}";

  cssValue = path: value:
    if lib.last path == "duration" then "${toString value}ms" else toString value;

  properties = path: values:
    if lib.isAttrs values then
      lib.concatMapStrings (
        name: properties (path ++ [ name ]) values.${name}
      ) (lib.attrNames values)
    else
      "  ${propertyName path}: ${cssValue path values};\n";

  themeProperties = theme:
    properties [ ] (lib.removeAttrs constants.palette.${theme} [ "colors" ])
    + properties [ ] constants.palette.${theme}.colors
    + properties [ ] constants.theme.${theme}
    + properties [ "shadow" ] constants.shadow.${theme}
    + properties [ "focus" ] constants.focus.${theme};

  typeProperties = values:
    lib.concatMapStrings (
      name:
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
      "  ${cssName}: ${rendered};\n"
    ) (lib.attrNames values);

  typeClasses =
    lib.concatMapStrings (
      family:
      lib.concatMapStrings (
        size:
        ".text-${family}-${size} {\n${typeProperties constants.type.${family}.${size}}}\n\n"
      ) (lib.attrNames constants.type.${family})
    ) [ "heading" "copy" "label" "button" ];

  stylesheet = pkgs.writeText "geistdesign.css" ''
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

  typescript = pkgs.writeText "index.ts" ''
    // Generated from constants/. CSS owns every colour; this module carries
    // only values GTK widgets cannot consume from a stylesheet.
    export const space = ${builtins.toJSON constants.space} as const

    export const motion = ${builtins.toJSON {
      overlay.duration = constants.motion.overlay.duration;
      popover.duration = constants.motion.popover.duration;
    }} as const
  '';
in
pkgs.runCommand "geistdesign" { } ''
  mkdir -p "$out"
  cp ${stylesheet} "$out/geistdesign.css"
  cp ${typescript} "$out/index.ts"
''
