local lsp_utils = require('rmarganti.plugins.config.lsp.lsp-utils')
local util = require('lspconfig.util')

local M = {
    'pmizio/typescript-tools.nvim',
    dependencies = {
        'nvim-lua/plenary.nvim',
        'neovim/nvim-lspconfig',
    },
    opts = {
        on_attach = lsp_utils.on_attach,
        -- By default, typescript-tools will look for a `tsconfig.json`. In a
        -- monorepo, this means it may set the root directory to that of the
        -- package/app/library, but it will not find Typescript there.
        root_dir = util.root_pattern('.git'),
    },
    event = 'VeryLazy',
}

return M
