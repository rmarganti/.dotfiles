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
            vim.keymap.set(
                'n',
                '<ESC>',
                '<CMD>cclose<CR>',
                { buffer = true, remap = false, silent = true }
            )

            -- `dd` deletes an item from the list.
            vim.keymap.set(
                'n',
                'dd',
                function()
                    local entry_idx = vim.fn.line('.')
                    local qflist = vim.fn.getqflist()

                    table.remove(qflist, entry_idx)

                    vim.fn.setqflist(qflist, 'r')
                    vim.fn.cursor(entry_idx, 1)
                end,
                { buffer = true }
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
