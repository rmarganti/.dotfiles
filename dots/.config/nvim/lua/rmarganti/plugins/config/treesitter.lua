-- Provides AST for code.
local M = {
    'nvim-treesitter/nvim-treesitter',
    run = ':TSUpdate',
    event = 'BufReadPost',
    dependencies = {
        { 'nvim-treesitter/playground', cmd = 'TSPlaygroundToggle' },
        { 'nvim-treesitter/nvim-treesitter-textobjects' },
    },
}

function M.config()
    require('nvim-treesitter.configs').setup({
        ensure_installed = {
            'bash',
            'css',
            'go',
            'hcl', -- Terraform
            'html',
            'javascript',
            'jsdoc',
            'json',
            'json5',
            'jsonc',
            'lua',
            'make',
            'php',
            'phpdoc',
            'prisma',
            'regex',
            'rust',
            'query', -- Treesitter
            'scss',
            'sql',
            'terraform',
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
                init_selection = 'vin', -- Visual In Node
                node_incremental = '<TAB>',
                node_decremental = '<S-TAB>',
            },
        },

        textobjects = {
            select = {
                enable = true,
                keymaps = {
                    ['ac'] = '@class.outer',
                    ['ic'] = '@class.inner',
                    ['ab'] = '@block.outer',
                    ['ib'] = '@block.inner',
                    ['af'] = '@function.outer',
                    ['if'] = '@function.inner',
                },
            },
        },
    })
end

return M
