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
}
