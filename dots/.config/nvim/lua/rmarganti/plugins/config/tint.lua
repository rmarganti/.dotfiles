-- Dim inactive windows.
local M = {
    'levouh/tint.nvim',
    event = 'VeryLazy',
}

function M.config()
    require('tint').setup({
        saturation = 0.5,
        tint = -65,
        highlight_ignore_patterns = {
            '@comment',
            '@text.literal',
            'Comment',
            'EndOfBuffer',
            'IndentBlankline.*',
            'InlayHint',
            'LineNr.*',
            'NonText',
            'Status.*',
            'VertSplit',
            'WinSeparator',
        },
    })
end

return M
