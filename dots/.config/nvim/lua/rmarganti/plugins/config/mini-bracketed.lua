-- mini.nvim https://github.com/nvim-mini/mini.nvim/blob/main/readmes/mini-bracketed.md

local M = {
    'nvim-mini/mini.bracketed',
    version = false,
    event = 'VeryLazy',
}

function M.config()
    -- Jump next/prev key binds.
    require('mini.bracketed').setup()
end

return M
