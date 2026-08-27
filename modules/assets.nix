{ config, ... }:
{
  home.file =
    let
      configNames = ../assets/home/.config |> builtins.readDir |> builtins.attrNames;
      configMappings =
        configNames
        |> builtins.map (name: {
          name = ".config/${name}";
          value = {
            source = config.lib.file.mkOutOfStoreSymlink "${config.home.homeDirectory}/repositories/dotfiles-nix/assets/home/.config/${name}";
          };
        })
        |> builtins.listToAttrs;
    in
    { } // configMappings;
}
