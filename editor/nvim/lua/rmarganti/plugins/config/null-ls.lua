local M = {}

local on_attach = require "rmarganti.plugins.config.nvim-lsp-installer.on_attach"
M.setup = function()
    local path = require('rmarganti.utils.path')
    local null_ls = require('null-ls')
    local builtins = null_ls.builtins

    vim.env.PRETTIERD_DEFAULT_CONFIG = vim.fn.expand(
        '~/.config/nvim/lua/rmarganti/plugins/config/.prettierrc.json'
    )

    local capabilities = require('cmp_nvim_lsp')
        .update_capabilities(vim.lsp.protocol.make_client_capabilities())

    local sources = {
        -- PHP
        builtins.diagnostics.phpstan.with({
            condition = function()
                return path.file_exists('vendor/bin/phpstan')
            end,
            command = 'vendor/bin/phpstan'
        }),

        builtins.formatting.phpcsfixer.with({
            condition = function()
                return path.file_exists('vendor/bin/php-cs-fixer')
            end,
            command = 'vendor/bin/php-cs-fixer'
        }),

        -- Lots of languages
        builtins.formatting.prettierd.with({
            condition = function()
                return true
            end
        }),
    }

    null_ls.setup({
        capabilities = capabilities,
        debounce = 1000,
        sources = sources,
        on_attach = on_attach
    })
end

return M
