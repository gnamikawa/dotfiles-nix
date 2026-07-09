{
  pkgs,
  lib,
  # Absent under standalone home-manager (no NixOS underneath): default to
  # no NVIDIA rather than failing evaluation.
  osConfig ? { },
  ...
}:
{
  home.packages = lib.optionals (lib.attrByPath [ "hardware" "nvidia" "enabled" ] false osConfig) (
    with pkgs;
    [
      cudatoolkit
      nvtopPackages.full
      gperftools
    ]
  );
}
