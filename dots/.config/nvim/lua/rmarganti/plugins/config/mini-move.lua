-- mini.nvim https://github.com/nvim-mini/mini.nvim/blob/main/readmes/mini-move.md

local M = {
    'nvim-mini/mini.move',
    version = false,
    event = 'VeryLazy',
}

function M.config()
    -- Move lines/selections.
    require('mini.move').setup()
end

return M
