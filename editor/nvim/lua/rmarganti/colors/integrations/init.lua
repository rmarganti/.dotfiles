return {
    -- Built-in
    core = require('rmarganti.colors.integrations.core'),
    lsp = require('rmarganti.colors.integrations.lsp'),
    treesitter = require('rmarganti.colors.integrations.treesitter'),

    -- Plugins
    hop = require('rmarganti.colors.integrations.hop'),
    indent_blanklink = require('rmarganti.colors.integrations.indent_blankline'),
    nvim_notify = require('rmarganti.colors.integrations.nvim-notify'),
    telescope = require('rmarganti.colors.integrations.telescope'),
}
