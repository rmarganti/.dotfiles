local M = {}

M.config = function()
    local lsp_utils = require('rmarganti.plugins.config.lsp-utils')
    local path = require('rmarganti.utils.path')
    local null_ls = require('null-ls')
    local builtins = null_ls.builtins

    vim.env.PRETTIERD_DEFAULT_CONFIG = vim.fn.expand(
        '~/.config/nvim/lua/rmarganti/plugins/config/.prettierrc.json'
    )

    local capabilities = lsp_utils.make_client_capabilities()

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

        -- Terraform
        builtins.formatting.terraform_fmt,

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
            }
        }),
    }

    null_ls.setup({
        capabilities = capabilities,
        debounce = 1000,
        sources = sources,
        on_attach = lsp_utils.on_attach
    })
end

return M
