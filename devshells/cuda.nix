# CUDA environment — self-sufficient on purpose: nvcc rejects host compilers
# newer than it supports, so this shell carries its own pinned gcc
# (cudaPackages.backendStdenv) instead of borrowing cpp's.
pkgs: {
  packages = with pkgs; [
    cudaPackages.cudatoolkit
    cudaPackages.backendStdenv.cc
    gnumake
  ];
}
