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
    -- Misc
    --------------------------------

    -- Navigate between Neovim and Wezterm panes
    {
        'numToStr/Navigator.nvim',
        opts = {},
    },
}
