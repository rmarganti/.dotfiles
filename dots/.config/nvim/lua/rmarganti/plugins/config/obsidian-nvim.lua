local function find_workspaces()
    local ok, machine = pcall(require, "rmarganti.config.machine")
    local workspaces = {}

    if ok and machine and type(machine.obsidian_workspaces) == "table" then
        workspaces = machine.obsidian_workspaces
    end

    local valid_workspaces = {}

    for _, workspace in ipairs(workspaces) do
        local path = vim.fn.expand(workspace.path)
        if vim.fn.isdirectory(path) == 1 then
            table.insert(valid_workspaces, {
                name = workspace.name,
                path = path,
            })
        end
    end

    return valid_workspaces
end

local M = {
    'epwalsh/obsidian.nvim',
    version = '*', -- recommended, use latest release instead of latest commit
    event = 'VeryLazy',
    dependencies = {
        'nvim-lua/plenary.nvim',
    },
    opts = {
        workspaces = find_workspaces(),

        daily_notes = {
            folder = 'diary',
            date_format = '%Y-%m-%d',
            alias_format = '%B %-d, %Y',
            template = nil,
        },

        preferred_link_style = 'markdown',

        follow_url_func = function(url)
            -- Open the URL in the default web browser.
            vim.fn.jobstart({ 'open', url }) -- Mac OS
        end,

        -- Let render-markdown.nvim handle this
        ui = { enable = false },
    },
}

return M
