local M = {}

M.config = function()
    require('focus').setup({
        signcolumn = false,
        excluded_filetypes = {
            'fugitiveblame',
        },
    })
end

return M
