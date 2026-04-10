-- Provides AST for code.
local M = {
    'nvim-treesitter/nvim-treesitter',
    build = ':TSUpdate',
    lazy = false,
}

function M.config()
    local languages = {
        'bash',
        'css',
        'go',
        'gomod',
        'gosum',
        'graphql',
        'hcl', -- Terraform
        'helm',
        'html',
        'hurl',
        'javascript',
        'jsdoc',
        'json',
        'json5',
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
    }

    require('nvim-treesitter').setup()

    if vim.fn.executable('tree-sitter') == 1 then
        require('nvim-treesitter').install(languages)
    end

    vim.treesitter.language.register('xml', { 'mjml' })

    vim.api.nvim_create_autocmd('FileType', {
        group = vim.api.nvim_create_augroup('rmarganti-treesitter', { clear = true }),
        callback = function(args)
            if pcall(vim.treesitter.start, args.buf) then
                vim.bo[args.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
            end
        end,
    })
end

return M
