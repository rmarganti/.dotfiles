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
            '@ibl.*',
            '@text.literal',
            'Comment',
            'EndOfBuffer',
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
