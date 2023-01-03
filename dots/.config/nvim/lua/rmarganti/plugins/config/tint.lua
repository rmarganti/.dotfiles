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
            'Comment',
            'EndOfBuffer',
            'IndentBlankline.*',
            'InlayHint',
            'LineNr.*',
            'NonText',
            'Status.*',
            'WinSeparator',
        },
    })
end

return M
