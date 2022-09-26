local M = {}

M.config = function()
    require('nvim-treesitter.configs').setup({
        ensure_installed = {
            'bash',
            'css',
            'go',
            'hcl', -- Terraform
            'javascript',
            'json',
            'json5',
            'lua',
            'make',
            'markdown',
            'php',
            'prisma',
            'regex',
            'rust',
            'scss',
            'tsx',
            'typescript',
            'vim',
            'yaml',
        },

        highlight = { enable = true },
        indent = { enable = true },

        incremental_selection = {
            enable = true,
            keymaps = {
                init_selection = '<CR>',
                scope_incremental = '<CR>',
                node_incremental = '<TAB>',
                node_decremental = '<S-TAB>',
            },
        },

        textobjects = {
            select = {
                enable = true,
                keymaps = {
                    ["ac"] = "@class.outer",
                    ["ic"] = "@class.inner",
                    ["ab"] = "@block.outer",
                    ["ib"] = "@block.inner",
                    ["af"] = "@function.outer",
                    ["if"] = "@function.inner",
                }
            }
        },

        textsubjects = {
            enable = true,
            keymaps = {
                ['.'] = 'textsubjects-smart',
                [';'] = 'textsubjects-container-outer',
            }
        },
    })
end

return M
