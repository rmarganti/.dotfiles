local M = {}

M.setup = function()
    local bqf = require('bqf')

    bqf.setup({
        func_map = {
            openc = '<CR>',
            open = 'o',
        }
    })

    vim.bqf = bqf
end

return M
