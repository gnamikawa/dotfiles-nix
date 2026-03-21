{
  description = "Home Manager configuration of genzo";

  inputs = {
    nixpkgs2511.url = "github:NixOS/nixpkgs/9da7f1cf7f8a6e2a7cb3001b048546c92a8258b4?narHash=sha256-SlybxLZ1/e4T2lb1czEtWVzDCVSTvk9WLwGhmxFmBxI%3D";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      nixpkgs,
      nixpkgs2511,
      home-manager,
      ...
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      pkgs2511 = (import nixpkgs2511) { inherit system; };
    in
    {
      homeConfigurations = {
        home-manager.useGlobalPkgs = true;
        home-manager.useUserPackages = true;
        "genzo" = home-manager.lib.homeManagerConfiguration {
          inherit pkgs;

          # Specify your home configuration modules here, for example,
          # the path to your home.nix.
          modules = [
            ./home.nix
            ./flatpak.nix
          ];
          extraSpecialArgs = {
            inherit pkgs2511;
          };

          # Optionally use extraSpecialArgs
          # to pass through arguments to home.nix
        };
      };
      homeModules."genzo" = import ./home.nix;
    };
}
