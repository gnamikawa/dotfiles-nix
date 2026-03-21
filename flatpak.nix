{ pkgs, lib, ... }:
let
  desiredFlatpaks = [
    "com.discordapp.Discord"
    "com.visualstudio.code"
  ];

  flatpakList = lib.concatStringsSep " " desiredFlatpaks;
in
{
  home.activation.flatpakManagement = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    set +e

    # Check if this is a dry-run
    dryrun=0
    if [ "$HOME_MANAGER_DRY_RUN" = "1" ]; then
      dryrun=1
      echo "Running in dry-run mode; no changes will be applied."
    fi

    FLATPAK="${pkgs.flatpak}/bin/flatpak"

    # Add Flathub remote if needed
    if [ $dryrun -eq 0 ]; then
      run $FLATPAK remote-add --user --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
    else
      echo "[dry-run] Would add Flathub remote"
    fi

    installedFlatpaks=$($FLATPAK list --app --columns=application)

    # Uninstall apps not in desired list
    for installed in $installedFlatpaks; do
      found=0
      for desired in ${flatpakList}; do
        if [ "$installed" = "$desired" ]; then
          found=1
          break
        fi
      done

      if [ "$found" -eq 0 ]; then
        if [ $dryrun -eq 0 ]; then
          echo "Removing $installed"
          run $FLATPAK uninstall --user -y --noninteractive "$installed" || true
        else
          echo "[dry-run] Would remove $installed"
        fi
      fi
    done

    # Install missing desired apps
    for app in ${flatpakList}; do
      if [ $dryrun -eq 0 ]; then
        echo "Ensuring $app is installed"
        run $FLATPAK install --user -y flathub "$app" || true
      else
        echo "[dry-run] Would install $app"
      fi
    done

    # Cleanup unused runtimes
    if [ $dryrun -eq 0 ]; then
      run $FLATPAK uninstall --user --unused -y || true
      run $FLATPAK update -y || true
    else
      echo "[dry-run] Would remove unused runtimes and update apps"
    fi
  '';
}
