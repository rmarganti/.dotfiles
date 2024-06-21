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
    -- Text manipulation
    --------------------------------

    -- Quickly surround text with brackets, quotes, etc.
    {
        'tpope/vim-surround',
        event = 'VeryLazy',
    },

    --------------------------------
    -- Misc
    --------------------------------

    -- Navigate between Neovim and Wezterm panes
    {
        'numToStr/Navigator.nvim',
        opts = {},
    },

    -- Sugar for file operations (rename, move, etc.).
    {
        'tpope/vim-eunuch',
        event = 'BufReadPost',
    },

    -- Heuristically set buffer options.
    {
        'tpope/vim-sleuth',
        event = 'BufReadPost',
    },
}
