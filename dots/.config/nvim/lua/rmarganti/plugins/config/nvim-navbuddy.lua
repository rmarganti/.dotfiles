local M = {
    'SmiteshP/nvim-navbuddy',
    event = 'VeryLazy',
    dependencies = {
        'neovim/nvim-lspconfig',
        'SmiteshP/nvim-navic',
        'MunifTanjim/nui.nvim',
    },
}

function M.config()
    local navbuddy = require('nvim-navbuddy')

    navbuddy.setup({
        window = {
            border = 'rounded',
        },
    })
end

return M
