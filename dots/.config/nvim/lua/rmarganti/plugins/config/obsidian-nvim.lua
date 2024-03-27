local M = {
    'epwalsh/obsidian.nvim',
    version = '*', -- recommended, use latest release instead of latest commit
    event = 'VeryLazy',
    dependencies = {
        'nvim-lua/plenary.nvim',
    },
    opts = {
        workspaces = {
            {
                name = 'work',
                path = '~/OneDrive - Gannett Company, Incorporated/obsidian/work',
            },
        },
        daily_notes = {
            folder = 'diary',
        },

        preferred_link_style = 'markdown',

        follow_url_func = function(url)
            -- Open the URL in the default web browser.
            vim.fn.jobstart({ 'open', url }) -- Mac OS
        end,
    },
}

return M
