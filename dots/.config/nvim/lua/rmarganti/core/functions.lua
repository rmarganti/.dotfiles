local M = {}

local misc_utils = require('rmarganti.utils.misc')

M.toggle_quickfix = function()
    for _, win in pairs(vim.fn.getwininfo()) do
        if win.quickfix == 1 then
            vim.cmd('cclose')
            return
        end
    end

    vim.cmd('copen')
end

-- Relative to the current buffer, find and edit the file in the closest
-- directory. If no buffer is open, search in the project root.
M.edit_nearest = function(filename, directory)
    local _edit_nearest = function(fname, dir)
        dir = dir or vim.fs.dirname(vim.fn.expand('%')) or '.'
        local nearest = vim.fs.find({ fname }, { upward = true, path = dir })[1]

        if nearest == nil then
            vim.notify(fname .. ' not found in project.', 'warn')
            return
        end

        vim.cmd('e ' .. nearest)
    end

    if filename ~= '' and filename ~= nil then
        _edit_nearest(filename, directory)
        return
    end

    vim.ui.input({
        prompt = 'Filename: ',
        kind = 'filename',
    }, function(input)
        if input == nil or input == '' then
            return
        end

        _edit_nearest(input, directory)
    end)
end

-- Edit the corresponding test file. Only supports Javascript and Typescript currently.
M.edit_test = function()
    local extension_regex = '(%..+)$'

    local dir = vim.fn.expand('%:h')
    local file = vim.fn.expand('%:t')
    local extension = file:match(extension_regex)
    local file_without_extension = file:gsub(extension_regex, '')

    if misc_utils.has_value({ '.js', '.jsx', '.ts', '.tsx' }, extension) then
        vim.cmd('e ' .. dir .. '/' .. file_without_extension .. '.spec' .. extension)
    elseif misc_utils.has_value({ '.go' }, extension) then
        vim.cmd('e ' .. dir .. '/' .. file_without_extension .. '_test' .. extension)
    else
        vim.notify('File type `' .. extension .. '` not supported', 'warn')
    end
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

-- These file types will be asynchronously formatted.
local SLOW_FORMAT_FILE_TYPES = { 'php' }

-- Asynchronously format the current buffer.
M.format = function(is_auto_format)
    -- Manual format.
    if is_auto_format == false or enable_format_on_save then
        local user_lsp_config = require('rmarganti.config.lsp')
        local should_format_async = misc_utils.has_value(SLOW_FORMAT_FILE_TYPES, vim.bo.filetype)

        require('conform').format({
            async = should_format_async,
            filter = function(client)
                local client_config = user_lsp_config.clients[client.name]
                return client_config and client_config.formatting_enabled
            end,
        })
        return
    end
end

M.organize_imports = function()
    local bufnr = vim.api.nvim_get_current_buf()
    local bufname = vim.api.nvim_buf_get_name(bufnr)

    vim.lsp.buf_request(bufnr, 'workspace/executeCommand', {
        command = '_typescript.organizeImports',
        arguments = { bufname },
    })
end

-- Close all non-hidden, non-modified buffers.
M.buf_delete_all = function(keep_current)
    keep_current = keep_current or false

    local buffers = vim.api.nvim_list_bufs()
    local current_buffer = vim.api.nvim_get_current_buf()

    -- Closing the last buffer can cause issues when the quickfix window is open.
    if not keep_current then
        vim.cmd.cclose()
    end

    for _, buffer in ipairs(buffers) do
        local is_listed = vim.api.nvim_buf_get_option(buffer, 'buflisted')
        local is_modified = vim.api.nvim_buf_get_option(buffer, 'modified')
        local should_keep = keep_current and current_buffer == buffer

        if is_listed and not is_modified and not should_keep then
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

-- Import the contents of a URL.
M.read_url = function()
    vim.ui.input({
        prompt = 'Enter URL: ',
        kind = 'read_url',
    }, function(input)
        if input == nil then
            return
        end

        local bufnr = vim.api.nvim_get_current_buf()
        local buffer_contents = table.concat(vim.api.nvim_buf_get_lines(bufnr, 0, -1, false), '\n')

        -- Create a new buffer if current buffer has anything in it.
        if #buffer_contents > 0 then
            vim.cmd('enew')
        end

        vim.cmd('read !curl -s ' .. input)
    end)
end

return M
