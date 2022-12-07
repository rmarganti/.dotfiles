local M = {}

M.config = function()
    require('lspkind').init({
        mode = 'symbol_text',
        preset = 'default',
        symbol_map = {
            Class = 'ﴯ',
            Color = '',
            Constant = '',
            Constructor = '',
            Copilot = '',
            Enum = '',
            EnumMember = '',
            Event = '',
            Field = 'ﰠ',
            File = '',
            Folder = '',
            Function = '',
            Interface = '',
            Keyword = '',
            Method = '',
            Module = '',
            Operator = '',
            Property = 'ﰠ',
            Reference = '',
            Snippet = '',
            Struct = 'פּ',
            Text = '',
            TypeParameter = '',
            Unit = '塞',
            Value = '',
            Variable = '',
        },
    })
end

return M
