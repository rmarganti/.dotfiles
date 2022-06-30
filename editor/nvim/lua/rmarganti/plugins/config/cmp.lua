local cmp = require('cmp')

local M = {}

local enable_debounced_auto_complete -- defined below

--- nvim-cmp configuration
M.config = function()
    local luasnip = require("luasnip")

    local tab_mapping = function(fallback)
        if (cmp.visible()) then
            local entry = cmp.get_selected_entry()

            if (not entry) then
                cmp.select_next_item({ behavior = cmp.SelectBehavior.Select })
            end

            cmp.confirm()
        elseif (luasnip.expand_or_jumpable()) then
            vim.fn.feedkeys(
                vim.api.nvim_replace_termcodes("<Plug>luasnip-expand-or-jump", true, true, true),
                ""
            )
        else
            fallback() -- The fallback function sends a already mapped key. In this case, it's probably `<Tab>`.
        end
    end

    local shift_tab_mapping = function(fallback)
        if (luasnip.jumpable(-1)) then
            vim.fn.feedkeys(
                vim.api.nvim_replace_termcodes('<Plug>luasnip-jump-prev', true, true, true),
                ''
            )
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
                    cmp_tabnine = "[Tabnine]",
                    tmux = "[Tmux]",
                })
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
            ['<S-Tab>'] = cmp.mapping(shift_tab_mapping, { 'i', 's' })
        }),
        sources = {
            { name = 'nvim_lsp' },
            { name = 'luasnip' },
            {
                name = 'buffer',
                option = {
                    get_bufnrs = function()
                        return vim.api.nvim_list_bufs()
                    end
                }
            },
            { name = 'cmp_tabnine' },
            { name = 'tmux' },
            { name = 'path' },
        },
    })

    -- `/` cmdline setup.
    cmp.setup.cmdline('/', {
        mapping = cmp.mapping.preset.cmdline(),
        sources = {
            { name = 'buffer' }
        }
    })

    -- `:` cmdline setup.
    cmp.setup.cmdline(':', {
        mapping = cmp.mapping.preset.cmdline(),
        sources = cmp.config.sources({
            { name = 'path' }
        }, {
            { name = 'cmdline' }
        })
    })

    enable_debounced_auto_complete()
end


-- A debounced auto-complete request. This keeps key presses responsive by only
-- asking that nvim-cmp does auto-completion once you stop typing.
enable_debounced_auto_complete = function()
    local DEBOUNCE_DELAY = 125
    local timer = vim.loop.new_timer()

    -- Any time text changes, schedule a delayed request to nvim-cmp
    -- to fire auto completion. If another key press happens before that
    -- request, cancel the original request and schedule a new one.
    vim.api.nvim_create_autocmd({ 'TextChangedI', 'TextChangedP', 'CmdLineChanged' }, {
        group = vim.api.nvim_create_augroup(
            'DebouncedAutoComplete',
            { clear = true }
        ),
        pattern = '*',
        callback = function()
            timer:stop()
            timer:start(
                DEBOUNCE_DELAY,
                0,
                vim.schedule_wrap(function()
                    local enabled = require('cmp.config').enabled()

                    if (enabled) then
                        cmp.complete({ reason = cmp.ContextReason.Auto })
                    end
                end)
            )
        end,
        desc = 'Debounced auto-complete',
    })
end

return M
