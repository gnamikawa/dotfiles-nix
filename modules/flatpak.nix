{
  config,
  pkgs,
  lib,
  ...
}:

let
  cfg = config.programs.flatpakManagement;
in
{
  options.programs.flatpakManagement = {
    enable = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Enable automatic Flatpak management.";
    };

    desiredFlatpaks = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [ ];
      description = "List of Flatpak apps to ensure are installed.";
    };
  };

  config = lib.mkIf cfg.enable {
    home.packages = with pkgs; [ flatpak ];
    home.activation.flatpakManagement = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
      set +e

      # Default to "0" if unset
      dryrun="''${HOME_MANAGER_DRY_RUN:-0}"
      echo $dryrun

      if [ "$dryrun" = "1" ]; then
        echo "Running in dry-run mode; no changes will be applied."
      fi

      if [ "$dryrun" = "0" ]; then
        run ${pkgs.flatpak}/bin/flatpak remote-add --user --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
      else
        echo "[dry-run] Would add Flathub remote"
      fi

      installedFlatpaks=$(${pkgs.flatpak}/bin/flatpak list --app --columns=application)

      for installed in $installedFlatpaks; do
        found=0
        for desired in ${lib.concatStringsSep " " cfg.desiredFlatpaks}; do
          if [ "$installed" = "$desired" ]; then
            found=1
            break
          fi
        done

        if [ "$found" = "0" ]; then
          if [ "$dryrun" = "0" ]; then
            echo "Removing $installed"
            run ${pkgs.flatpak}/bin/flatpak uninstall --user -y --noninteractive "$installed" || true
          else
            echo "[dry-run] Would remove $installed"
          fi
        fi
      done

      for app in ${lib.concatStringsSep " " cfg.desiredFlatpaks}; do
        if [ "$dryrun" = "0" ]; then
          echo "Ensuring $app is installed"
          run ${pkgs.flatpak}/bin/flatpak install --user -y flathub "$app" || true
        else
          echo "[dry-run] Would install $app"
        fi
      done

      if [ "$dryrun" = "0" ]; then
        run ${pkgs.flatpak}/bin/flatpak uninstall --user --unused -y || true
        run ${pkgs.flatpak}/bin/flatpak update -y || true
      else
        echo "[dry-run] Would remove unused runtimes and update apps"
      fi
    '';
  };

  # Disabled pending a lighter update mechanism — see
  # docs/adr/0001-disable-flatpak-management.md. Re-enable by uncommenting
  # the import in home.nix and this block:
  #
  # programs.flatpakManagement.enable = true;
  # programs.flatpakManagement.desiredFlatpaks = [
  #   "com.discordapp.Discord"
  #   "com.visualstudio.code"
  # ];
}
