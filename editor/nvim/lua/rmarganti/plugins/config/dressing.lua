local M = {}

M.config = function()
    require('dressing').setup({
        input = {
            insert_only = false,
            winblend = 0,
        }
    })
end

return M
