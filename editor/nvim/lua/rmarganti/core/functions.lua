local M = {}

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

local enable_format_on_save = true

-- Toggle whether format-on-save is enabled.
M.toggle_format_on_save = function ()
    if enable_format_on_save == true then
        enable_format_on_save = false
        print('Disabled format-on-save')
    else
        enable_format_on_save = true
        print('Enabled format-on-save')
    end
end

-- Asynchronously format the current buffer. If any changes occour,
-- the updated buffer will be re-saved in `lspconfig.lua`.
M.format_on_save = function()
    if enable_format_on_save == true and not vim.b.is_saving_format then
        vim.b.init_changedtick = vim.b.changedtick
        vim.lsp.buf.formatting()
    end
end

return M
