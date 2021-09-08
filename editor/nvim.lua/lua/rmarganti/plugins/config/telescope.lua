-- https://github.com/nvim-telescope/telescope.nvim#telescope-defaults
return function()
	local telescope = require('telescope')

	telescope.setup({
        dynamic_preview_title = true,
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
            width = 0.95
        }
    })
end
