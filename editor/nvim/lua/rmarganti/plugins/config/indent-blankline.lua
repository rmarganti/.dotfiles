-- Show lines where tabs are.
local M = {
    'lukas-reineke/indent-blankline.nvim',
    event = 'VeryLazy',
}

function M.config()
    require('indent_blankline').setup({
        filetype_exclude = { 'alpha' },
    })
end

return M
