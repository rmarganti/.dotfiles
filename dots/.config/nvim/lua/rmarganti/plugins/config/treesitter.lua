-- Provides AST for code.
local M = {
    'nvim-treesitter/nvim-treesitter',
    build = ':TSUpdate',
    event = 'VeryLazy',
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
            'hurl',
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
            'toml',
            'tsx',
            'typescript',
            'vim',
            'vimdoc',
            'xml',
            'yaml',
        },

        highlight = { enable = true },
        indent = { enable = true },
    })

    vim.treesitter.language.register('xml', { 'mjml' })
end

return M
