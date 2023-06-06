-- https://github.com/echasnovski/mini.nvim/blob/main/readmes/mini-jump2d.md

local M = {
    'echasnovski/mini.jump2d',
    version = false,
    event = 'VeryLazy',
}

function M.config()
    require('mini.jump2d').setup({
        view = {
            dim = true,
            n_steps_ahead = 2,
        },
        mappings = {
            start_jumping = '',
        },
    })
end

return M
