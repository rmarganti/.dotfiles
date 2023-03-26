-- mini.nvim https://github.com/echasnovski/mini.nvim/blob/main/readmes/mini-bracketed.md

local M = {
    'echasnovski/mini.bracketed',
    version = false,
    event = 'VeryLazy',
}

function M.config()
    -- Jump next/prev key binds.
    require('mini.bracketed').setup()
end

return M
