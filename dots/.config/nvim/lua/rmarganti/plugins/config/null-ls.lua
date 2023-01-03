-- Language server for linters, formatters, etc.
local M = {
    'jose-elias-alvarez/null-ls.nvim',
    lazy = true,
}

-- This function is not called by lazy.nvim. It is called as part of `lsp@config()`.
function M.setup()
    local lsp_utils = require('rmarganti.plugins.config.lsp.lsp-utils')
    local path = require('rmarganti.utils.path')
    local null_ls = require('null-ls')
    local builtins = null_ls.builtins

    local capabilities = lsp_utils.make_client_capabilities()

    local sources = {
        -- PHP
        builtins.diagnostics.phpstan.with({
            condition = function()
                return path.file_exists('vendor/bin/phpstan')
            end,
            command = 'vendor/bin/phpstan',
            to_temp_file = false,
        }),

        builtins.formatting.phpcsfixer.with({
            condition = function()
                return path.file_exists('vendor/bin/php-cs-fixer')
            end,
            command = 'vendor/bin/php-cs-fixer',
            to_temp_file = false,
        }),

        -- Terraform
        builtins.formatting.terraform_fmt,

        -- Lua
        builtins.formatting.stylua,

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
                PRETTIERD_DEFAULT_CONFIG = vim.fn.expand(
                    '~/.config/nvim/.prettierrc.json'
                ),
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
