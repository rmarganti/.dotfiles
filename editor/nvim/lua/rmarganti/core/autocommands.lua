vim.cmd([[
    augroup qf
        autocmd!

        " Do not show quickfix in buffer lists.
        autocmd FileType qf set nobuflisted

        " Escape to close quickfix.
        autocmd FileType qf nnoremap <buffer><silent> <ESC> :cclose<CR>
    augroup END
]])
