-- Resize windows based on focus.
local M = {
    'beauwilliams/focus.nvim',
    event = 'VeryLazy',
}

function M.config()
    require('focus').setup({
        signcolumn = false,
        excluded_filetypes = {
            'fugitiveblame',
        },
    })
end

return M
