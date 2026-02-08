local M = {
    'stevearc/conform.nvim',
    event = 'BufReadPost',
    opts = {},
}

function M.config()
    local conform = require('conform')

    conform.setup({
        log_level = vim.log.levels.DEBUG,

        formatters_by_ft = {
            css = { 'oxfmt', 'prettierd' },
            go = { 'gofmt' },
            graphql = { 'oxfmt', 'prettierd' },
            handlebars = { 'oxfmt', 'prettierd' },
            html = { 'oxfmt', 'prettierd' },
            javascript = { 'oxfmt', 'biome', 'prettierd', stop_after_first = true },
            javascriptreact = { 'oxfmt', 'biome', 'prettierd', stop_after_first = true },
            json = { 'oxfmt', 'prettierd' },
            jsonc = { 'oxfmt', 'prettierd' },
            less = { 'oxfmt', 'prettierd' },
            lua = { 'stylua' },
            markdown = { 'oxfmt', 'prettierd' },
            php = { 'php_cs_fixer' },
            rust = { 'rustfmt' },
            scss = { 'oxfmt', 'prettierd' },
            sh = { 'shfmt' },
            terraform = { 'terraform_fmt' },
            toml = { 'toml', 'taplo' },
            typescript = { 'oxfmt', 'biome', 'prettierd', stop_after_first = true },
            typescriptreact = { 'oxfmt', 'biome', 'prettierd', stop_after_first = true },
            vimwiki = { 'oxftm', 'prettierd' },
            vue = { 'oxfmt', 'prettierd' },
            xml = { 'xmlformatter' },
            yaml = { 'oxfmt', 'prettierd' },
        },

        formatters = {
            oxfmt = {
                condition = function(_, ctx)
                    return vim.fs.find({ '.oxfmtrc.json', '.oxfmtrc.jsonc' }, {
                        path = ctx.filename,
                        upward = true,
                        stop = vim.uv.os_homedir(),
                    })[1] ~= nil
                end,
            },
            biome = {
                condition = function(_, ctx)
                    return vim.fs.find({ 'biome.json', 'biome.jsonc' }, {
                        path = ctx.filename,
                        upward = true,
                        stop = vim.uv.os_homedir(),
                    })[1] ~= nil
                end,
            },
        },
    })
end

return M
