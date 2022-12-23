-- Show GitHub notification count in status line.
local M = {
    'rlch/github-notifications.nvim',
    lazy = true,
}

function M.config()
    local secrets = require('rmarganti.config.secrets')

    require('github-notifications').setup({
        username = secrets.github_username,
        token = secrets.github_token,
    })
end

return M
