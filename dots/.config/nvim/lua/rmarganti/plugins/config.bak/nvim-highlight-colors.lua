-- Preview CSS colors.
local M = {
    'brenoprata10/nvim-highlight-colors',
    event = 'VeryLazy',
}

function M.config()
    require('nvim-highlight-colors').setup({
        render = 'virtual',
        virtual_symbol = '●',
    })
end

return M
