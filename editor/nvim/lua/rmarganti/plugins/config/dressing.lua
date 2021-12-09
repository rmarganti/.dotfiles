local M = {}

M.setup = function()
    require('dressing').setup({
        input = {
            insert_only = false,
        }
    })
end

return M
