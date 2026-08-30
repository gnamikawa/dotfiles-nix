return {
  {
    "rcarriga/nvim-dap-ui",
    init = function()
      local group = vim.api.nvim_create_augroup("nvim_dap_ui_overrides", { clear = true })
      vim.api.nvim_create_autocmd("User", {
        group = group,
        pattern = "LazyLoad",
        callback = function(event)
          if event.data ~= "nvim-dap-ui" then
            return
          end

          local listeners = require("dap").listeners.before
          listeners.event_terminated["dapui_config"] = nil
          listeners.event_exited["dapui_config"] = nil

          return true
        end,
      })
    end,
  },
}
