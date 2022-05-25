local cmp = require('cmp')
local timer = vim.loop.new_timer()

local M = {}

--- nvim-cmp configuration
M.config = function()
    local tab_mapping = function(fallback)
        if cmp.visible() then
            local entry = cmp.get_selected_entry()
            if not entry then
                cmp.select_next_item({ behavior = cmp.SelectBehavior.Select })
            end
            cmp.confirm()
        elseif require("luasnip").expand_or_jumpable() then
            vim.fn.feedkeys(
                vim.api.nvim_replace_termcodes("<Plug>luasnip-expand-or-jump", true, true, true),
                ""
            )
        else
            fallback() -- The fallback function sends a already mapped key. In this case, it's probably `<Tab>`.
        end
    end

    local stab_mapping = function(fallback)
        if cmp.visible() then
            cmp.select_prev_item()
        elseif require("luasnip").jumpable(-1) then
            vim.fn.feedkeys(vim.api.nvim_replace_termcodes("<Plug>luasnip-jump-prev", true, true, true), "")
        else
            fallback()
        end
    end

    cmp.setup({
        completion = {
            autocomplete = false,
        },
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
                require('luasnip').lsp_expand(args.body)
            end,
        },
        mapping = cmp.mapping.preset.insert({
            ['<C-d>'] = cmp.mapping.scroll_docs(-4),
            ['<C-f>'] = cmp.mapping.scroll_docs(4),
            ['<C-e>'] = cmp.mapping.close(),
            ['<Tab>'] = cmp.mapping(tab_mapping, { 'i', 's' }),
            ['<S-Tab>'] = cmp.mapping(stab_mapping, { 'i', 's' })
        }),
        sources = {
            { name = 'nvim_lsp' },
            {
                name = 'buffer',
                option = {
                    get_bufnrs = function()
                        return vim.api.nvim_list_bufs()
                    end
                }
            },
            { name = 'cmp_tabnine' },
            { name = 'path' },
            { name = 'luasnip' },
        },
    })

    vim.cmd([[
        augroup CmpDebounceAuGroup
            au!
            au TextChangedI * lua require('rmarganti.plugins.config.cmp').debounce()
        augroup end
    ]])
end

local DEBOUNCE_DELAY = 250

M.debounce = function()
    timer:stop()
    timer:start(
        DEBOUNCE_DELAY,
        0,
        vim.schedule_wrap(function()
            cmp.complete({ reason = cmp.ContextReason.Auto })
        end)
    )
end

return M
