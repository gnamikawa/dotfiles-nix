# Rust environment.
pkgs: {
  packages = with pkgs; [
    rustc
    cargo
    clippy
    rustfmt
    rust-analyzer
  ];
}
