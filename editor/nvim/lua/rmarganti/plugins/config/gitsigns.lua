local M = {}

M.setup = function()
    require('gitsigns').setup({
        -- Disable the actual gitsigns, since we're only
        -- using this plugin for feline git functionality.
        signcolumn = false,
    })
end

return M
