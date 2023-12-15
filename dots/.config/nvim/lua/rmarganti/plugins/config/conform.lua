local M = {
    'stevearc/conform.nvim',
    event = 'BufReadPost',
    opts = {},
}

function M.config()
    require('conform').setup({
        formatters_by_ft = {
            css = { 'prettierd' },
            graphql = { 'prettierd' },
            handlebars = { 'prettierd' },
            html = { 'prettierd' },
            javascript = { 'prettierd' },
            javascriptreact = { 'prettierd' },
            json = { 'prettierd' },
            jsonc = { 'prettierd' },
            less = { 'prettierd' },
            lua = { 'stylua' },
            markdown = { 'prettierd' },
            php = { 'php_cs_fixer' },
            scss = { 'prettierd' },
            sh = { 'shfmt' },
            terraform = { 'terraform_fmt' },
            typescript = { 'prettierd' },
            typescriptreact = { 'prettierd' },
            vimwiki = { 'prettierd' },
            vue = { 'prettierd' },
            yaml = { 'prettierd' },
        },

        formatters = {
            prettierd = {
                env = {
                    PRETTIERD_DEFAULT_CONFIG = vim.fn.expand('~/.config/nvim/.prettierrc.json'),
                },
            }
        }
    })
end

return M
