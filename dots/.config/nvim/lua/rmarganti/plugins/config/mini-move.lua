-- mini.nvim https://github.com/echasnovski/mini.nvim/blob/main/readmes/mini-move.md

local M = {
    'echasnovski/mini.move',
    version = false,
    event = 'VeryLazy',
}

function M.config()
    -- Move lines/selections.
    require('mini.move').setup()
end

return M
