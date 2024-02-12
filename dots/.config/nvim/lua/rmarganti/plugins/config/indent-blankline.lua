-- Show lines where tabs are.
local M = {
    'lukas-reineke/indent-blankline.nvim',
    event = 'VeryLazy',
}

function M.config()
    require('ibl').setup({
        exclude = {
            filetypes = { 'alpha' },
        },
        indent = {
            char = '│',
        },
        scope = {
            enabled = false,
        },
    })
end

return M
