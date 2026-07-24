{ config, ... }:
{
  home.file =
    let
      configNames = builtins.attrNames (builtins.readDir ../assets/home/.config);
      configMappings = builtins.listToAttrs (
        builtins.map (name: {
          name = ".config/${name}";
          value = {
            source = config.lib.file.mkOutOfStoreSymlink "${config.home.homeDirectory}/repositories/dotfiles-nix/assets/home/.config/${name}";
          };
        }) configNames
      );
    in
    { } // configMappings;
}
