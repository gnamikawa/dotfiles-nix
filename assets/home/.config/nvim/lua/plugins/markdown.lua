return {
  {
    "stevearc/conform.nvim",
    optional = true,
    opts = {
      formatters = {
        prettier = {
          prepend_args = { "--prose-wrap", "always" },
        },
      },
    },
  },
}
