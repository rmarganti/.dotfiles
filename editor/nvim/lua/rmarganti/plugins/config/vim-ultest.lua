-- Run tests.
local M = {
    'rcarriga/vim-ultest',
    dependencies = { { 'vim-test/vim-test' } },
    build = ':UpdateRemotePlugins',
    cmd = {
        'Ultest',
        'UltestNearest',
    },
    init = function()
        vim.g.ultest_deprecation_notice = 0
    end,
}

return M
