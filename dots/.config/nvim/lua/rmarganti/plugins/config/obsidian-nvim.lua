local function expand_workspace_paths(workspaces)
    local expanded = {}
    for _, ws in ipairs(workspaces or {}) do
        table.insert(expanded, {
            name = ws.name,
            path = vim.fn.expand(ws.path),
        })
    end
    return expanded
end

local config = require('rmarganti.utils.dev_common').load().obsidian or {}

local M = {
    'epwalsh/obsidian.nvim',
    version = '*',
    event = 'VeryLazy',
    dependencies = { 'nvim-lua/plenary.nvim' },
    opts = {
        workspaces = expand_workspace_paths(config.workspaces),
        daily_notes = {
            folder = config.diary_folder or 'diary',
            date_format = config.date_format or '%Y-%m-%d',
            alias_format = config.alias_format or '%B %d, %Y',
            template = nil,
        },
        preferred_link_style = 'markdown',
        follow_url_func = function(url)
            vim.fn.jobstart({ 'open', url })
        end,
        ui = { enable = false },
    },
}

return M
