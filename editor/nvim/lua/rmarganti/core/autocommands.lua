------------------------------------------------
--
-- Quickfix
--
------------------------------------------------

local qf_group = vim.api.nvim_create_augroup('qf', { clear = true })

vim.api.nvim_create_autocmd(
    'FileType',
    {
        group = qf_group,
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

local wr_group = vim.api.nvim_create_augroup('WinResize', { clear = true })

vim.api.nvim_create_autocmd(
    'VimResized',
    {
        group = wr_group,
        pattern = '*',
        command = 'wincmd =',
        desc = 'Automatically resize windows when the host window size changes.'
    }
)
