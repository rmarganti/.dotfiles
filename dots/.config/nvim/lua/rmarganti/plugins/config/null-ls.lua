-- Language server for linters, formatters, etc.
local M = {
    'jose-elias-alvarez/null-ls.nvim',
    lazy = true,
}

-- This function is not called by lazy.nvim. It is called as part of `lsp@config()`.
function M.setup()
    local lsp_utils = require('rmarganti.plugins.config.lsp.lsp-utils')
    local null_ls = require('null-ls')
    local builtins = null_ls.builtins

    local capabilities = lsp_utils.make_client_capabilities()

    local sources = {
        -- Terraform
        builtins.formatting.terraform_fmt,

        -- Lua
        builtins.formatting.stylua,

        -- Bash
        null_ls.builtins.formatting.shfmt,

        -- Lots of languages
        builtins.formatting.prettierd.with({
            condition = function()
                return true
            end,
            filetypes = {
                'javascript',
                'javascriptreact',
                'typescript',
                'typescriptreact',
                'vue',
                'css',
                'scss',
                'less',
                'html',
                'json',
                'jsonc',
                'yaml',
                'markdown',
                'graphql',
                'handlebars',
                'vimwiki', -- This is the only non-default
            },
            env = {
                PRETTIERD_DEFAULT_CONFIG = vim.fn.expand('~/.config/nvim/.prettierrc.json'),
            },
        }),
    }

    null_ls.setup({
        capabilities = capabilities,
        debounce = 1000,
        sources = sources,
        on_attach = lsp_utils.on_attach,
    })
end

return M
