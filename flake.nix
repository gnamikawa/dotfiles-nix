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
    # AGS v3, the desktop shell (ADR-0008). Upstream rather than nixpkgs,
    # which carries v2.3.0 only and lost its maintainer on 2026-07-21.
    ags = {
      url = "github:aylur/ags";
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
      ags,
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

      # agsFull rather than the bare `ags`: it sets extraPackages at
      # construction (every Astal library plus libadwaita), so no `.override`
      # is applied after nixGL wrapping — the silent-drop failure of #37.
      agsFull = ags.packages.${system}.agsFull;

      # Shared settings for the standalone (non-NixOS) profiles.
      standaloneModule =
        { ... }:
        {
          nixpkgs.overlays = [ nur.overlays.default ];
          targets.genericLinux.enable = true;
        };

      # Wrap GUI packages so they can use the host's GL drivers. Both
      # graphical profiles need this; genzo-terminal ships no GUI package.
      nixGLModule =
        { ... }:
        {
          nixGL.packages = nixgl.packages;
          nixGL.defaultWrapper = "mesa";
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
            inherit agsFull;
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
            inherit agsFull;
          };
        };

      # Standalone profiles for non-NixOS distributions (e.g. Debian), named
      # for what each one owns (issue #43).
      homeConfigurations = {
        # Applications only, for a distribution that owns its own desktop.
        # Renamed from genzo-graphical, which imported ./modules wholesale and
        # so shipped a competing session onto such a machine.
        "genzo-apps" = standalone [
          ./modules/apps.nix
          nixGLModule
        ];

        # The full desktop, belonging to no host. Seeded with AGS rather than
        # waybar: nothing depends on this profile yet, so there is no reason to
        # start it on a surface being deleted.
        "genzo-desktop" = standalone [
          ./modules
          ./modules/ags.nix
          nixGLModule
        ];

        "genzo-terminal" = standalone [ ./modules/terminal.nix ];
      };

      # Development environments (see CONTEXT.md): self-sufficient devShells
      # layered over the ambient layer by direnv. Each file under devshells/
      # exports mkShell arguments; combos that must compile against each
      # other's libraries are pre-merged here via inputsFrom — casual combos
      # stack as `use flake dotfiles#<env>` lines in a project .envrc instead.
      devShells.${system} =
        let
          shellArgs = name: import (./devshells + "/${name}.nix") pkgs;
          mkNamed = name: pkgs.mkShell ({ name = "dotfiles-${name}"; } // shellArgs name);
          catalog = nixpkgs.lib.genAttrs [
            "default"
            "cpp"
            "rust"
            "go"
            "node"
            "python"
            "java"
            "cuda"
          ] mkNamed;
        in
        catalog
        // {
          # cuda listed first so its pinned gcc wins PATH order over cpp's.
          cpp-cuda = pkgs.mkShell {
            name = "dotfiles-cpp-cuda";
            inputsFrom = [
              catalog.cuda
              catalog.cpp
            ];
          };
        };

      # Keep the standalone profiles from rotting: `nix flake check` builds all
      # three activation packages. NixOS-module mode is covered by system-nix's
      # VM tests instead (docs/adr/0002).
      checks.${system} = {
        home-apps = self.homeConfigurations."genzo-apps".activationPackage;
        home-desktop = self.homeConfigurations."genzo-desktop".activationPackage;
        home-terminal = self.homeConfigurations."genzo-terminal".activationPackage;
      };
    };
}
