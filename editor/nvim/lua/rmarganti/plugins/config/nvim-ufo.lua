-- Improved folds
local M = {
    'kevinhwang91/nvim-ufo',
    dependencies = {
        { 'kevinhwang91/promise-async' },
    },
    event = 'BufReadPost',
}

function M.config()
    require('ufo').setup()
end

return M
