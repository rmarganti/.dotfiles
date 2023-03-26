return {
    --------------------------------
    -- Git
    --------------------------------

    -- Git diffs/commands.
    {
        'tpope/vim-fugitive',
        event = 'BufReadPost',
    },

    --------------------------------
    --------------------------------
    {
    },

    --------------------------------
    -- Text manipulation
    --------------------------------

    -- Replace target with value of register.
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
