local M = {}

M.config = function()
    require('telescope').load_extension('fzf')
end

return M
