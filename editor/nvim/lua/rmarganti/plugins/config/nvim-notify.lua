local M = {}

M.config = function()
    local notify = require('notify')

    notify.setup({
        background_colour = 'NormalFloat'
    })

    vim.notify = notify
end

return M
