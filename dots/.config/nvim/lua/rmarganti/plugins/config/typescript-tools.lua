local lsp_utils = require('rmarganti.plugins.config.lsp.lsp-utils')

local M = {
    'pmizio/typescript-tools.nvim',
    dependencies = {
        'nvim-lua/plenary.nvim',
        'neovim/nvim-lspconfig',
    },
    opts = {
        on_attach = lsp_utils.on_attach,
        settings = {
            code_lens = 'references_only',
        },
    },
    event = 'VeryLazy',
}

return M
