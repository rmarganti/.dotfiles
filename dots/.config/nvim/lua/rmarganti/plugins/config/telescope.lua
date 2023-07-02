-- Find, Filter, Preview,Pick
local M = {
    'nvim-telescope/telescope.nvim',
    cmd = 'Telescope',
    dependencies = {
        { 'nvim-lua/plenary.nvim' },
        { 'nvim-telescope/telescope-fzf-native.nvim', build = 'make' },
        { 'nvim-telescope/telescope-github.nvim' },
        { 'nvim-telescope/telescope-symbols.nvim' },
        { 'rcarriga/nvim-notify' },
        { 'rlch/github-notifications.nvim' },
        { 'smartpde/telescope-recent-files' },
    },
}

function M.config()
    local telescope = require('telescope')

    telescope.setup({
        extensions = {
            fzf = {
                fuzzy = true, -- false will only do exact matching
                override_generic_sorter = true, -- override the generic sorter
                override_file_sorter = true, -- override the file sorter
                case_mode = 'smart_case', -- or "ignore_case" or "respect_case"
            },

            smart_open = {
                match_algorithm = 'fzf',
            },
        },

        defaults = {
            layout_strategy = 'vertical',
            dynamic_preview_title = true,
            file_ignore_patterns = {
                '^.git/',
                '^node_modules/',
                '^vendor/',
                'yarn.lock',
            },
            layout_config = {
                center = {
                    preview_cutoff = 40,
                },
                height = 0.9,
                horizontal = {
                    preview_cutoff = 120,
                    prompt_position = 'bottom',
                },
                vertical = {
                    preview_cutoff = 40,
                    preview_height = 25,
                },
                width = 0.9,
            },
            prompt_prefix = '   ',
            vimgrep_arguments = {
                'rg',
                '--color=never',
                '--no-heading',
                '--with-filename',
                '--line-number',
                '--column',
                '--smart-case',
                '--hidden',
            },
        },
    })

    require('telescope').load_extension('fzf')
    require('telescope').load_extension('gh')
    require('telescope').load_extension('ghn')
    require('telescope').load_extension('notify')
    require('telescope').load_extension('recent_files')
    require('telescope').load_extension('smart_open')
end

return M
