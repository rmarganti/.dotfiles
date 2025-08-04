local function load_diary_config()
    local config_path = vim.fn.expand("~/.config/diary/config.json")
    if vim.fn.filereadable(config_path) == 0 then
        return nil
    end
    local lines = vim.fn.readfile(config_path)
    local content = table.concat(lines, "\n")
    local ok, config = pcall(vim.fn.json_decode, content)
    if not ok or not config then
        vim.notify("Failed to parse diary config", vim.log.levels.ERROR)
        return nil
    end
    return config
end

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

local config = load_diary_config() or {}

local M = {
    'epwalsh/obsidian.nvim',
    version = '*',
    event = 'VeryLazy',
    dependencies = { 'nvim-lua/plenary.nvim' },
    opts = {
        workspaces = expand_workspace_paths(config.workspaces),
        daily_notes = {
            folder = config.diary_folder or "diary",
            date_format = config.date_format or "%Y-%m-%d",
            alias_format = config.alias_format or "%B %d, %Y",
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
