-- Improved folds
local M = {
    'kevinhwang91/nvim-ufo',
    dependencies = {
        { 'kevinhwang91/promise-async' },
    },
    event = 'BufReadPost',
}

function M.config()
    require('ufo').setup({
        provider_selector = function()
            return { 'treesitter', 'indent' }
        end,
    })
end

return M
