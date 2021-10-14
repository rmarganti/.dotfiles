local M = {}

M.setup = function()
    require('telescope').load_extension('fzf')
end

return M
