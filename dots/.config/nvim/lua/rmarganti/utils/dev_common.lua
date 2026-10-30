local M = {}
local config

function M.load()
    if config then
        return config
    end

    config = {}
    local path = vim.fn.expand('~/.config/dev-common.json')
    if vim.fn.filereadable(path) == 0 then
        return config
    end

    local ok, decoded = pcall(function()
        return vim.json.decode(table.concat(vim.fn.readfile(path), '\n'))
    end)
    if ok and type(decoded) == 'table' then
        config = decoded
    else
        vim.notify('Failed to parse dev-common config', vim.log.levels.ERROR)
    end
    return config
end

function M.copilot_enabled()
    local neovim = M.load().neovim
    local copilot = type(neovim) == 'table' and neovim.copilot
    return type(copilot) == 'table' and copilot.enabled == true
end

return M
