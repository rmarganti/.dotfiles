local M = {
    'nvim-mini/mini.operators',
    version = false,
}

function M.config()
    require('mini.operators').setup()
end

return M
