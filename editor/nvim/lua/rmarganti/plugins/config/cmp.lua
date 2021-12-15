local M = {}

local feedkey = function(key, mode)
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes(key, true, true, true), mode, true)
end

--- nvim-cmp configuration
-- https://github.com/hrsh7th/nvim-compe#lua-config
M.setup = function()
    local cmp = require('cmp')

    local tab_complete = function(fallback)
        if cmp.visible() then
            local entry = cmp.get_selected_entry()
            if not entry then
                cmp.select_next_item({ behavior = cmp.SelectBehavior.Select })
            end
            cmp.confirm()
        elseif vim.fn["vsnip#available"](1) == 1 then
            feedkey("<Plug>(vsnip-expand-or-jump)", "")
        else
            fallback() -- The fallback function sends a already mapped key. In this case, it's probably `<Tab>`.
        end
    end

    cmp.setup({
        formatting = {
            format = require("lspkind").cmp_format({
                with_text = true,
                menu = ({
                    buffer = "[Buffer]",
                    nvim_lsp = "[LSP]",
                    luasnip = "[LuaSnip]",
                    nvim_lua = "[Lua]",
                    latex_symbols = "[Latex]",
                })
            }),
        },
        snippet = {
            expand = function(args)
                vim.fn["vsnip#anonymous"](args.body)
            end,
        },
        mapping = {
            ['<C-d>'] = cmp.mapping.scroll_docs(-4),
            ['<C-f>'] = cmp.mapping.scroll_docs(4),
            ['<C-e>'] = cmp.mapping.close(),
            ['<Tab>'] = cmp.mapping(tab_complete, { 'i', 's' })
        },
        sources = {
            { name = 'nvim_lsp' },
            { name = 'buffer' },
            { name = 'cmp_tabnine' },
            { name = 'path' },
            { name = 'vsnip' },
        }
    })

end

return M
