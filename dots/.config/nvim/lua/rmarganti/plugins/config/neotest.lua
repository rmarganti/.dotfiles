-- Run tests.
local M = {
    'nvim-neotest/neotest',
    dependencies = {
        { 'nvim-lua/plenary.nvim' },
        { 'nvim-treesitter/nvim-treesitter' },
        { 'antoinemadec/FixCursorHold.nvim' },
        -- Adapters
        { 'haydenmeade/neotest-jest' },
        { 'rouge8/neotest-rust' },
        { 'olimorris/neotest-phpunit' },
    },
    lazy = true,
}

function M.config()
    require('neotest').setup({
        adapters = {
            require('neotest-jest')({}),
            require('neotest-phpunit'),
            require('neotest-rust'),
        },
    })
end

return M
