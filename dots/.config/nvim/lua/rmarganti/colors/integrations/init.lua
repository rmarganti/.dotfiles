return {
    -- Built-in
    core = require('rmarganti.colors.integrations.core'),
    lsp = require('rmarganti.colors.integrations.lsp'),
    treesitter = require('rmarganti.colors.integrations.treesitter'),

    -- Plugins
    gitsigns = require('rmarganti.colors.integrations.gitsigns'),
    hop = require('rmarganti.colors.integrations.hop'),
    indent_blanklink = require('rmarganti.colors.integrations.indent_blankline'),
    nvim_notify = require('rmarganti.colors.integrations.nvim-notify'),
    rnvimr = require('rmarganti.colors.integrations.rnvimr'),
    rust_analyzer = require('rmarganti.colors.integrations.rust-analyzer'),
    symbols_outline = require('rmarganti.colors.integrations.symbols-outline'),
    telescope = require('rmarganti.colors.integrations.telescope'),
    vim_illuminate = require('rmarganti.colors.integrations.vim-illuminate'),
}