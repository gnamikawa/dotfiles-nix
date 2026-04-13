{
  description = "Home Manager configuration of genzo";

  inputs = {
    nixpkgs2511.url = "github:NixOS/nixpkgs/9da7f1cf7f8a6e2a7cb3001b048546c92a8258b4?narHash=sha256-SlybxLZ1/e4T2lb1czEtWVzDCVSTvk9WLwGhmxFmBxI%3D";
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
      nixpkgs2511,
      home-manager,
      ...
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      pkgs2511 = (import nixpkgs2511) { inherit system; };
      constants = import ./constants;
    in
    {
      nixosModules.default =
        { ... }:
        {
          nixpkgs.overlays = [ nur.overlays.default ];
          home-manager.users."genzo" = import ./home.nix;
          home-manager.extraSpecialArgs = {
            inherit constants;
            inherit pkgs2511;
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
          inherit pkgs2511;
          inherit nur;
        };
      };
    };
}
