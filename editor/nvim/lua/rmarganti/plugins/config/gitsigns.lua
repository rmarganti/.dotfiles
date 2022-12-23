-- Provides info to feline, functionality for managing chunks, etc.
local M = {
    'lewis6991/gitsigns.nvim',
    lazy = true,
}

function M.config()
    require('gitsigns').setup({
        signcolumn = false,
    })
end

return M
