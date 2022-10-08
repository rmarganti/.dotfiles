local M = {}

M.config = function()
    require('tint').setup({
        saturation = 0.5,
        tint = -65,
        highlight_ignore_patterns = {
            '@comment',
            'Comment',
            'EndOfBuffer',
            'IndentBlankline.*',
            'LineNr.*',
            'NonText',
            'Status.*',
            'WinSeparator',
        },
    })
end

return M
