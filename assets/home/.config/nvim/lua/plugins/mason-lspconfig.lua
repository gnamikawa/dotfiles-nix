return {
  {
    "mason-org/mason-lspconfig.nvim",
    enabled = not vim.env.IN_NIX_SHELL,
  },
}
