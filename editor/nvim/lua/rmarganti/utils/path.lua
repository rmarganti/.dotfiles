local M = {}

local vim_loop = vim.loop
local is_windows = vim_loop.os_uname().version:match 'Windows'
local path_sep = is_windows and '\\' or '/'

local parent_directory
do
    local strip_dir_pat = path_sep .. '([^' .. path_sep .. ']+)$'
    local strip_sep_pat = path_sep .. '$'

    parent_directory = function(path)
        if not path or #path == 0 then
            return
        end

        local result = path:gsub(strip_sep_pat, ''):gsub(strip_dir_pat, '')

        if #result == 0 or result == path then
            return '.'
        end

        return result
    end
end

M.parent_directory = parent_directory;

-- file_exists checks if the given file exists
-- @param string path The path to the file
-- @return boolean
M.file_exists = function(path)
    local stat = vim.loop.fs_stat(path)
    if (stat and stat.type) then
        return true
    else
        return false
    end
end

return M
