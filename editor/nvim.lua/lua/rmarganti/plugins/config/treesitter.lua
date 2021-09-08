return function()
	require('nvim-treesitter.configs').setup({
        ensure_installed = 'all',
        ignore_install = { 'haskell' },
		highlight = { enable = true },
		indent = { enable = true },
        textobjects = {
            select = {
                enable = true,
                keymaps = {
                    ["ac"] = "@class.outer",
                    ["ic"] = "@class.inner",
                    ["ab"] = "@block.outer",
                    ["ib"] = "@block.inner",
                    ["af"] = "@function.outer",
                    ["if"] = "@function.inner"
                }
            }
        },
	})
end
