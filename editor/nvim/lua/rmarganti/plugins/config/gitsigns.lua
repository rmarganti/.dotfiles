local M = {}

M.config = function()
    require('gitsigns').setup({
        signcolumn = false
    })
end

return M
