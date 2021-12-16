vim.cmd([[
    augroup qf
        autocmd!

        " Do not show quickfix in buffer lists.
        autocmd FileType qf set nobuflisted

        " Escape to close quickfix.
        autocmd FileType qf nnoremap <buffer><silent> <ESC> :cclose<CR>
    augroup END
]])

vim.cmd([[
    augroup WinResize
        autocmd!

        " Automatically resize windows when the host
        " window size changes. Useful for tmux zooms.
        autocmd VimResized * wincmd =

    augroup END
]])
