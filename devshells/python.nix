# Python environment. withPackages gives one interpreter that can import
# pip/virtualenv — separate python3Packages.* entries in PATH would not.
pkgs: {
  packages = [
    (pkgs.python3.withPackages (
      ps: with ps; [
        pip
        virtualenv
      ]
    ))
  ];
}
