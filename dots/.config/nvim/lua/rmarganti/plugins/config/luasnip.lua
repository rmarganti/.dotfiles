-- Snippets.
local M = {
    'L3MON4D3/LuaSnip',
    lazy = true,
    dependencies = {
        'rafamadriz/friendly-snippets',
    },
}

function M.config()
    local luasnip = require('luasnip')

    -- Third-party snippets.
    require('luasnip.loaders.from_vscode').lazy_load()

    -- Personal snippets.
    require('luasnip.loaders.from_lua').lazy_load({
        paths = vim.fn.stdpath('config') .. '/lua/rmarganti/snippets',
        override_priority = 2000,
    })

    luasnip.filetype_extend('javascriptreact', { 'javascript' })
    luasnip.filetype_extend('typescript', { 'javascript' })
    luasnip.filetype_extend('typescriptreact', { 'javascript', 'typescript' })
    luasnip.filetype_extend('vimwiki', { 'markdown' })
end

return M
