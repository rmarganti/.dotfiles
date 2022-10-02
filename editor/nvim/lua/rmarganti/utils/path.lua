local M = {}

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
