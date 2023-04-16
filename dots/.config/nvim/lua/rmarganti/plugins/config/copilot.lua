-- AI code-completion.
local M = {
    'zbirenbaum/copilot.lua',
    event = 'VeryLazy',
}

function M.config()
    require('copilot').setup({
        suggestion = { enabled = false },
        panel = { enabled = false },
    })
end

return M
