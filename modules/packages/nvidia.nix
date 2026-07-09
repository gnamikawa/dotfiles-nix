{
  pkgs,
  lib,
  osConfig,
  ...
}:
{
  home.packages = lib.optionals osConfig.hardware.nvidia.enabled (
    with pkgs;
    [
      cudatoolkit
      nvtopPackages.full
      gperftools
    ]
  );
}
