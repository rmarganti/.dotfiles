-- Adds icons to auto-complete.
local M = {
    'onsails/lspkind-nvim',
    lazy = true,
}

function M.config()
    require('lspkind').init({
        mode = 'symbol_text',
        preset = 'default',
        symbol_map = {
            Class = '󰠱',
            Color = '󰏘',
            Constant = '󰏿',
            Constructor = '',
            Copilot = '',
            Enum = '',
            EnumMember = '',
            Event = '',
            Field = '󰜢',
            File = '󰈙',
            Folder = '󰉋',
            Function = '󰊕',
            Interface = '',
            Keyword = '󰌋',
            Method = '󰆧',
            Module = '',
            Operator = '󰆕',
            Property = '󰜢',
            Reference = '󰈇',
            Snippet = '',
            Struct = '󰙅',
            Text = '󰉿',
            TypeParameter = '',
            Unit = '󰑭',
            Value = '󰎠',
            Variable = '󰀫',
        },
    })
end

return M
