return {
    --------------------------------
    -- Git
    --------------------------------

    -- Git diffs/commands.
    {
        'tpope/vim-fugitive',
        cmd = {
            'Git',
            'Gdiffsplit',
            'Gread',
            'Gwrite',
            'Ggrep',
            'GMove',
            'GDelete',
            'GBrowse',
        },
    },

    --------------------------------
    -- LSP
    --------------------------------

    -- Symbol tree panel.
    {
        'simrat39/symbols-outline.nvim',
        cmd = 'SymbolsOutline',
        config = function()
            require('symbols-outline').setup()
        end,
    },

    --------------------------------
    -- Text manipulation
    --------------------------------

    -- Quickly surround text with brackets, quotes, etc.
    {
        'tpope/vim-surround',
        event = 'VeryLazy',
    },

    -- Code spell-checking.
    {
        'vim-scripts/ReplaceWithRegister',
        event = 'VeryLazy',
    },

    --------------------------------
    -- Misc
    --------------------------------

    -- Sugar for file operations (rename, move, etc.).
    {
        'tpope/vim-eunuch',
        event = 'BufReadPost',
    },

    --  Random shortcuts that typically work in pairs.
    {
        'tpope/vim-unimpaired',
        event = 'VeryLazy',
    },

    -- Make more things repeatable.
    {
        'tpope/vim-repeat',
        event = 'VeryLazy',
    },

    -- Heuristically set buffer options.
    {
        'tpope/vim-sleuth',
        event = 'BufReadPost',
    },
}
