local M = {}

-- https://github.com/nvim-telescope/telescope.nvim#telescope-defaults
M.config = function()
    local telescope = require('telescope')

    telescope.setup({
        extensions = {
            fzf = {
                fuzzy = true, -- false will only do exact matching
                override_generic_sorter = true, -- override the generic sorter
                override_file_sorter = true, -- override the file sorter
                case_mode = "smart_case", -- or "ignore_case" or "respect_case"
            }
        },
        dynamic_preview_title = true,
        defaults = {
            dynamic_preview_title = true,
            file_ignore_patterns = {
                '^.git/',
                '^node_modules/',
                '^vendor/',
                'yarn.lock',
            },
            layout_config = {
                center = {
                    preview_cutoff = 40
                },
                height = 0.9,
                horizontal = {
                    preview_cutoff = 120,
                    prompt_position = "bottom"
                },
                vertical = {
                    preview_cutoff = 40
                },
                width = 0.9,
            },
            prompt_prefix = "   ",
        },
    })

    require("telescope").load_extension("notify")
end

return M
