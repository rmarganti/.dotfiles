return function()
    local path = require('rmarganti.utils.path')
    local null_ls = require('null-ls')
    local builtins = null_ls.builtins

    vim.env.PRETTIERD_DEFAULT_CONFIG = vim.fn.expand(
        '~/.config/nvim/lua/rmarganti/plugins/config/.prettierrc.json'
    )

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
        builtins.formatting.eslint_d,
        builtins.formatting.prettierd.with({
            filetypes = {
                "css",
                "html",
                "javascript",
                "javascriptreact",
                "json",
                "markdown",
                "scss",
                "svelte",
                "typescript",
                "typescriptreact",
                "vue",
                "yaml",
            }
        }),
    }

    null_ls.config({
        debounce = 150,
        sources = sources
    })

    require('lspconfig')['null-ls'].setup({})
end
