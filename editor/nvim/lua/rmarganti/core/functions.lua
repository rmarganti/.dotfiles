local M = {}

local api = vim.api
local lsp = vim.lsp
local misc_utils = require('rmarganti.utils.misc')
local path = require('rmarganti.utils.path')

M.toggle_quickfix = function()
    for _, win in pairs(vim.fn.getwininfo()) do
        if win.quickfix == 1 then
            vim.cmd('cclose')
            return
        end
    end

    vim.cmd('copen')
end


local find_nearest
find_nearest = function(filename, directory)
    directory = directory or path.parent_directory(vim.fn.expand('%')) or '.'

    if (directory == nil) then
        return nil
    end

    local file_path = directory .. '/' .. filename

    if (path.file_exists(file_path)) then
        return file_path
    else
        if (directory == '.') then
            return nil
        end

        local parent_directory = path.parent_directory(directory)

        if (parent_directory == nil) then
            return nil
        end

        return find_nearest(filename, path.parent_directory(directory))
    end
end

-- Relative to the current buffer, find and edit the file in the closest
-- directory. If no buffer is open, search in the project root.
M.edit_nearest = function(filename, directory)
    local nearest = find_nearest(filename)

    if (nearest == nil) then
        print(filename .. ' not found in project.')
        return
    end

    directory = directory or path.parent_directory(vim.fn.expand('%')) or '.'

    if (directory == nil) then
        return
    else
        vim.cmd('e ' .. nearest)
    end
end

-- Edit the corresponding test file. Only supports Javascript and Typescript currently.
M.edit_test = function()
    local extension_regex = "(%..+)$"

    local dir = vim.fn.expand('%:h')
    local file = vim.fn.expand('%:t')
    local extension = file:match(extension_regex)
    local file_without_extension = file:gsub(extension_regex, '')

    if (misc_utils.has_value({ '.js', '.jsx', '.ts', '.tsx' }, extension) == false) then
        print('File type `' .. extension .. '` not supported')
        return
    end

    vim.cmd('e ' .. dir .. '/' .. file_without_extension .. '.spec' .. extension)
end

-- Code Rename popup.
M.rename = function()
    local buf, win
    buf, win = api.nvim_create_buf(false, true)

    api.nvim_buf_set_option(buf, "bufhidden", "wipe")

    local opts = {
        style = "minimal",
        border = "single",
        relative = "cursor",
        width = 40,
        height = 1,
        row = 1,
        col = 1,
    }

    api.nvim_open_win(buf, true, opts)
    api.nvim_win_set_option(win, "scrolloff", 0)
    api.nvim_win_set_option(win, "sidescrolloff", 0)
    api.nvim_buf_set_option(buf, "modifiable", true)
    api.nvim_buf_set_option(buf, "buftype", "prompt")
    vim.fn.prompt_setprompt(buf, " > ")
    vim.api.nvim_command "startinsert!"
    local map_opts = { noremap = true }
    api.nvim_buf_set_keymap(buf, "i", "<esc>", "<CMD>stopinsert <BAR> q!<CR>", map_opts)
    api.nvim_buf_set_keymap(buf, "i", "<CR>", "<CMD>stopinsert <BAR> lua require('rmarganti.core.functions')._rename()<CR>", map_opts)

    function M._rename()
        local newName = vim.trim(vim.fn.getline("."):sub(4, -1))
        vim.cmd [[q!]]
        local params = lsp.util.make_position_params()
        local currName = vim.fn.expand "<cword>"
        if not (newName and #newName > 0) or newName == currName then
            return
        end
        params.newName = newName
        print(newName)
        lsp.buf_request(0, "textDocument/rename", params)
    end
end

local enable_format_on_save = true

M.toggle_format_on_save = function ()
    if enable_format_on_save == true then
        enable_format_on_save = false
        print('Disabled format-on-save')
    else
        enable_format_on_save = true
        print('Enabled format-on-save')
    end
end

M.format_on_save = function()
    if enable_format_on_save == true then
        vim.lsp.buf.formatting_sync()
    end
end

return M
