# Go environment.
pkgs: {
  packages = with pkgs; [
    go
    gopls
    delve
  ];
}
