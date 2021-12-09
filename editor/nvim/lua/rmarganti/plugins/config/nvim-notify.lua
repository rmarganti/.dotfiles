local M = {}

M.setup = function()
    local notify = require('notify')

    notify.setup({
        background_colour = 'NormalFloat'
    })

    vim.notify = notify
end

return M
