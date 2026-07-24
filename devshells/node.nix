# Node.js environment (npm ships with nodejs).
pkgs: {
  packages = with pkgs; [
    nodejs
    yarn
  ];
}
