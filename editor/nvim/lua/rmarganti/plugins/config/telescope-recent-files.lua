local M = {}

M.config = function()
    require('telescope').load_extension('recent_files')
end

return M
