return {
  {
    "mason-org/mason.nvim",
    enabled = not vim.env.IN_NIX_SHELL, -- disable in nix develop / nix-shell
  },
}
