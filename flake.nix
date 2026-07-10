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
    nixgl = {
      url = "github:nix-community/nixGL";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    claude-desktop-nix = {
      url = "path:/home/genzo/repositories/claude-desktop-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      nur,
      home-manager,
      nixgl,
      claude-desktop-nix,
      ...
    }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        # NixOS mode inherits this from the system; standalone must allow
        # unfree packages (vscode, obsidian, unrar, ...) itself.
        config.allowUnfree = true;
      };
      constants = import ./constants;

      # Claude Desktop (official .deb, Cowork-enabled) from its own flake.
      claude-desktop = claude-desktop-nix.packages.${system}.default;

      # Shared settings for the standalone (non-NixOS) profiles.
      standaloneModule =
        { ... }:
        {
          nixpkgs.overlays = [ nur.overlays.default ];
          targets.genericLinux.enable = true;
        };

      standalone =
        modules:
        home-manager.lib.homeManagerConfiguration {
          inherit pkgs;
          modules = modules ++ [ standaloneModule ];
          extraSpecialArgs = {
            inherit constants;
            inherit nur;
            inherit claude-desktop;
          };
        };
    in
    {
      nixosModules.default =
        { config, ... }:
        {
          nixpkgs.overlays = [ nur.overlays.default ];
          home-manager.users."genzo" = {
            imports = [
              ./modules
              # Host-specific configuration; a host without a directory here
              # fails at evaluation on purpose.
              (./hosts + "/${config.networking.hostName}")
            ];
          };
          home-manager.extraSpecialArgs = {
            inherit constants;
            inherit nur;
            inherit claude-desktop;
          };
        };

      # Standalone profiles for non-NixOS distributions (e.g. Debian).
      homeConfigurations = {
        "genzo-graphical" = standalone [
          ./modules
          (
            { ... }:
            {
              # Wrap GUI packages so they can use the host's GL drivers.
              nixGL.packages = nixgl.packages;
              nixGL.defaultWrapper = "mesa";
            }
          )
        ];

        "genzo-terminal" = standalone [ ./modules/terminal.nix ];
      };

      # Keep the standalone profiles from rotting: `nix flake check` builds
      # both activation packages. NixOS-module mode is covered by system-nix's
      # VM tests instead (docs/adr/0002).
      checks.${system} = {
        home-graphical = self.homeConfigurations."genzo-graphical".activationPackage;
        home-terminal = self.homeConfigurations."genzo-terminal".activationPackage;
      };
    };
}
