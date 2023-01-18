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
        { 'nvim-neotest/neotest-go' },
        { 'olimorris/neotest-phpunit' },
    },
    lazy = true,
}

function M.config()
    -- Cleans up diagnostic messages (mostly from Go)
    local neotest_ns = vim.api.nvim_create_namespace('neotest')
    vim.diagnostic.config({
        virtual_text = {
            format = function(diagnostic)
                local message = diagnostic.message
                    :gsub('\n', ' ')
                    :gsub('\t', ' ')
                    :gsub('%s+', ' ')
                    :gsub('^%s+', '')
                return message
            end,
        },
    }, neotest_ns)

    require('neotest').setup({
        adapters = {
            require('neotest-go'),
            require('neotest-jest')({}),
            require('neotest-phpunit'),
            require('neotest-rust'),
        },
    })
end

return M
