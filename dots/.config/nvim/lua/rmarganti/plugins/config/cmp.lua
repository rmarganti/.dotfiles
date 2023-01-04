-- Code completion.
local M = {
    'hrsh7th/nvim-cmp',
    event = { 'InsertEnter', 'CmdlineEnter' },
    dependencies = {
        { 'hrsh7th/cmp-buffer' },
        { 'hrsh7th/cmp-nvim-lsp' },
        { 'hrsh7th/cmp-nvim-lsp-signature-help' },
        { 'hrsh7th/cmp-nvim-lua' },
        { 'hrsh7th/cmp-path' },
        { 'saadparwaiz1/cmp_luasnip' },
        { 'zbirenbaum/copilot-cmp' },
    },
}

function M.config()
    local cmp = require('cmp')
    local luasnip = require('luasnip')

    local tab_mapping = function(fallback)
        if cmp.visible() then
            local entry = cmp.get_selected_entry()

            if not entry then
                cmp.select_next_item({ behavior = cmp.SelectBehavior.Select })
            end

            cmp.confirm({
                behavior = cmp.ConfirmBehavior.Replace,
            })
        elseif luasnip.expand_or_jumpable() then
            vim.fn.feedkeys(
                vim.api.nvim_replace_termcodes('<Plug>luasnip-expand-or-jump', true, true, true),
                ''
            )
        else
            fallback() -- The fallback function sends a already mapped key. In this case, it's probably `<Tab>`.
        end
    end

    local shift_tab_mapping = function(fallback)
        if luasnip.jumpable(-1) then
            vim.fn.feedkeys(
                vim.api.nvim_replace_termcodes('<Plug>luasnip-jump-prev', true, true, true),
                ''
            )
        else
            fallback()
        end
    end

    require('copilot_cmp').setup()

    cmp.setup({
        performance = {
            debounce = 500,
        },

        formatting = {
            format = require('lspkind').cmp_format({
                with_text = true,
                menu = {
                    buffer = '[Buffer]',
                    nvim_lsp = '[LSP]',
                    luasnip = '[LuaSnip]',
                    nvim_lua = '[Lua]',
                    latex_symbols = '[Latex]',
                    cmp_tabnine = '[TabNine]',
                    copilot = '[Copilot]',
                },
            }),
        },

        snippet = {
            expand = function(args)
                luasnip.lsp_expand(args.body)
            end,
        },

        mapping = cmp.mapping.preset.insert({
            ['<C-d>'] = cmp.mapping.scroll_docs(-4),
            ['<C-f>'] = cmp.mapping.scroll_docs(4),
            ['<C-e>'] = cmp.mapping.close(),
            ['<Tab>'] = cmp.mapping(tab_mapping, { 'i', 's' }),
            ['<S-Tab>'] = cmp.mapping(shift_tab_mapping, { 'i', 's' }),
        }),

        sources = {
            { name = 'nvim_lsp_signature_help' },
            { name = 'copilot' },
            { name = 'nvim_lsp' },
            { name = 'luasnip' },
            {
                name = 'buffer',
                option = {
                    get_bufnrs = function()
                        return vim.api.nvim_list_bufs()
                    end,
                },
            },
            { name = 'path' },
        },

        experimental = {
            ghost_text = true,
        },
    })

    -- `/` cmdline setup.
    cmp.setup.cmdline('/', {
        mapping = cmp.mapping.preset.cmdline(),
        sources = {
            { name = 'buffer' },
        },
    })

    -- `:` cmdline setup.
    cmp.setup.cmdline(':', {
        mapping = cmp.mapping.preset.cmdline(),
        sources = cmp.config.sources({
            { name = 'path' },
        }, {
            { name = 'cmdline' },
        }),
    })
end

return M
