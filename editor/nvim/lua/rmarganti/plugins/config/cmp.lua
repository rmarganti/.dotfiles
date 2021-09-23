--- nvim-cmp configuration
-- https://github.com/hrsh7th/nvim-compe#lua-config
return function()
    local cmp = require('cmp')

    local complete_or_fallback = cmp.mapping(
        function(fallback)
            if vim.fn.pumvisible() == 1 then
                cmp.confirm({
                    behavior = cmp.ConfirmBehavior.Insert,
                    select = true,
                })
            else
                fallback()
            end
        end
    )

    cmp.setup({
        snippet = {
            expand = function(args)
                vim.fn["vsnip#anonymous"](args.body)
            end,
        },
        mapping = {
            ['<C-d>'] = cmp.mapping.scroll_docs(-4),
            ['<C-f>'] = cmp.mapping.scroll_docs(4),
            ['<C-e>'] = cmp.mapping.close(),
            ['<TAB>'] = complete_or_fallback,
            ['<CR>'] = complete_or_fallback,
        },
        sources = {
            { name = 'nvim_lsp' },
            { name = 'buffer' },
            { name = 'cmp_tabnine' },
            { name = 'vsnip' },
        }
    })
end
