-- Replaces `vim.notify`.
local M = {
    'rcarriga/nvim-notify',
    event = 'VeryLazy',
}

function M.config()
    local notify = require('notify')

    notify.setup({
        background_colour = 'NormalFloat',
        top_down = false,
    })

    vim.notify = notify
end

return M
