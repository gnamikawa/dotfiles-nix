{
  description = "Home Manager configuration of genzo";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nur = {
      url = "github:nix-community/NUR";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      nixpkgs,
      nur,
      home-manager,
      ...
    }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
      };
      constants = import ./constants;
    in
    {
      nixosModules.default =
        { config, ... }:
        {
          nixpkgs.overlays = [ nur.overlays.default ];
          home-manager.users."genzo" = {
            imports = [
              ./home.nix
              # Host-specific configuration; a host without a directory here
              # fails at evaluation on purpose.
              (./hosts + "/${config.networking.hostName}")
            ];
          };
          home-manager.extraSpecialArgs = {
            inherit constants;
            inherit nur;
          };
        };

      homeConfigurations."genzo" = home-manager.lib.homeManagerConfiguration {
        inherit pkgs;

        modules = [
          ./home.nix
          (
            { ... }:
            {
              nixpkgs.overlays = [ nur.overlays.default ];
            }
          )
        ];
        extraSpecialArgs = {
          inherit nur;
        };
      };
    };
}
