local M = {
    'RRethy/vim-illuminate',
    event = 'BufReadPost',
}

function M.config()
    require('illuminate').configure({
        under_cursor = false,
        providers = {
            'lsp',
            'treesitter',
        },
    })
end

return M
