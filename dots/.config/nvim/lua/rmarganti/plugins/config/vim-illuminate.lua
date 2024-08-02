-- Highlight instances of the symbol under the cursor.
-- https://github.com/RRethy/vim-illuminate

return {
    'RRethy/vim-illuminate',
    event = 'BufReadPost',
    config = function()
        -- default configuration
        require('illuminate').configure({
            under_cursor = false,
            providers = { 'lsp', 'treesitter' },
        })
    end,
}
