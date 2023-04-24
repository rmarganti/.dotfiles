-- Provides AST for code.
local M = {
    'nvim-treesitter/nvim-treesitter',
    build = ':TSUpdate',
    event = 'BufReadPost',
}

function M.config()
    require('nvim-treesitter.configs').setup({
        ensure_installed = {
            'bash',
            'css',
            'go',
            'gomod',
            'gosum',
            'graphql',
            'hcl', -- Terraform
            'html',
            'javascript',
            'jsdoc',
            'json',
            'json5',
            'jsonc',
            'lua',
            'make',
            'markdown_inline',
            'mermaid',
            'php',
            'phpdoc',
            'prisma',
            'proto',
            'query', -- Treesitter
            'regex',
            'rust',
            'scss',
            'sql',
            'terraform',
            'tsx',
            'typescript',
            'vim',
            'vimdoc',
            'yaml',
        },

        highlight = { enable = true },
        indent = { enable = true },
    })
end

return M
