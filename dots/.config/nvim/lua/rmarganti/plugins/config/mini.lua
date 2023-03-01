-- mini.nvim https://github.com/echasnovski/mini.nvim

local M = {
    'echasnovski/mini.nvim',
    version = false,
    event = 'VeryLazy',
}

function M.config()
    -- Jump next/prev key binds.
    require('mini.bracketed').setup()

    -- Move lines/selections.
    require('mini.move').setup()

    -- Adds/improves `a`/`i` text objects
    require('mini.ai').setup()

    require('mini.surround').setup({
        mappings = {
            add = 'ys',
            delete = 'ds',
            replace = 'cs',
        },
    })
end

return M
