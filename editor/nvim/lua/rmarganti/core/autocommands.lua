local utils = require('rmarganti.utils.misc')

local custom_group = vim.api.nvim_create_augroup('custom', { clear = true })

------------------------------------------------
--
-- Quickfix
--
------------------------------------------------

vim.api.nvim_create_autocmd(
    'FileType',
    {
        group = custom_group,
        pattern = 'qf',
        callback = function()
            -- Do not show quickfix in buffer lists.
            vim.api.nvim_buf_set_option(0, 'buflisted', false)

            -- Escape closes quickfix window.
            vim.api.nvim_buf_set_keymap(
                0,
                'n',
                '<ESC>',
                '<CMD>cclose<CR>',
                { noremap = true, silent = true }
            )
        end,
        desc = 'Quickfix tweaks'
    }
)

------------------------------------------------
--
-- WinResize
--
------------------------------------------------

vim.api.nvim_create_autocmd(
    'VimResized',
    {
        group = custom_group,
        pattern = '*',
        command = 'wincmd =',
        desc = 'Automatically resize windows when the host window size changes.'
    }
)

------------------------------------------------
--
-- Terminal keybinds
--
------------------------------------------------

vim.api.nvim_create_autocmd(
    'TermOpen',
    {
        group = custom_group,
        pattern = 'term://*',
        callback = function()
            local opts = { buffer = 0 }

            utils.map('t', 'jk', [[<C-\><C-n>]], opts)
        end,
        desc = 'Set Terminal keybinds'
    }
)
