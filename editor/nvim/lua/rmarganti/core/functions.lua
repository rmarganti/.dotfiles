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


-- Relative to the current buffer, find the file in the closest
-- directory. If no buffer is open, search in the project root.
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
        vim.notify(filename .. ' not found in project.', 'warn')
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
        vim.notify('File type `' .. extension .. '` not supported', 'warn')
        return
    end

    vim.cmd('e ' .. dir .. '/' .. file_without_extension .. '.spec' .. extension)
end

local enable_format_on_save = true

-- Toggle whether format-on-save is enabled.
M.toggle_format_on_save = function()
    if enable_format_on_save == true then
        enable_format_on_save = false
        vim.notify('Disabled format-on-save', 'info')
    else
        enable_format_on_save = true
        vim.notify('Enabled format-on-save', 'info')
    end
end

-- Asynchronously format the current buffer.
-- TODO: Auto-save when auto-formatting.
M.format = function(is_auto_format)
    -- Manual format.
    if is_auto_format == false or enable_format_on_save then
        vim.lsp.buf.formatting()
        return
    end
end

M.organize_imports = function()
    local bufnr = vim.api.nvim_get_current_buf()
    local bufname = vim.api.nvim_buf_get_name(bufnr)

    vim.lsp.buf_request(
        bufnr,
        "workspace/executeCommand",
        {
            command = "_typescript.organizeImports",
            arguments = { bufname },
        }
    )
end

-- Close all non-hidden, non-modified buffers.
M.buf_delete_all = function(keep_current)
    keep_current = keep_current or false

    local buffers = vim.api.nvim_list_bufs()
    local current_buffer = vim.api.nvim_get_current_buf()

    for _, buffer in ipairs(buffers) do
        local is_listed = vim.api.nvim_buf_get_option(buffer, 'buflisted')
        local is_modified = vim.api.nvim_buf_get_option(buffer, 'modified')
        local should_keep = keep_current and current_buffer == buffer

        if (is_listed and not is_modified and not should_keep) then
            vim.cmd('silent bdelete ' .. buffer)
        end
    end
end

-- Delete all buffers except for the current one.
M.buf_only = function()
    return M.buf_delete_all(true)
end

-- Edit snippets for the current file type
M.edit_snippets = function()
    local filetype = vim.bo.filetype
    local config_path = vim.fn.stdpath('config')

    local cmd = 'e ' .. config_path .. '/snippets/' .. filetype .. '.json'
    vim.cmd(cmd)
end

-- Open a URL in a new buffer.
M.read_url = function()
    vim.ui.input(
        {
            prompt = 'Enter URL:',
            kind = 'read_url',
        },
        function(input)
            if (input == nil) then
                return
            end

            vim.cmd('enew')
            vim.cmd('read !curl -s ' .. input)
        end
    )
end

return M
