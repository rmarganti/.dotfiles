"---------------------------------------------------------------
"
" Auto Commands
"
"---------------------------------------------------------------

" Automatically source the `.vimrc`, `mnemonics.vim`,
" and `plugins.vim` files on save.
augroup AutoSourcing
    autocmd!
    autocmd BufWritePost .vimrc source %
    autocmd BufWritePost plugins.vim source %
    autocmd BufWritePost mnemonics.vim source %
augroup END

" Highlight current line in the current window.
augroup CursorLine
    autocmd!
    autocmd VimEnter,WinEnter,BufWinEnter * setlocal cursorline
    autocmd WinLeave * setlocal nocursorline
augroup END

augroup FileTypes
    autocmd!

    " Make sure vim sees *.md files as Markdown.
    autocmd BufNewFile,BufRead *.md set filetype=markdown
    autocmd BufNewFile,BufRead *.mdx set filetype=markdown
augroup END

augroup Misc
    autocmd!

    " Automatically resize windows when the host
    " window size changes. Useful for tmux zooms.
    autocmd VimResized * wincmd =

    " Disable nord background color.
    autocmd ColorScheme * call s:TransparentBackground()
augroup END

" Overrides to allow terminal BG to show through.
function s:TransparentBackground()
    highlight Normal guibg=NONE ctermbg=NONE
    highlight LineNr guibg=NONE ctermbg=NONE
    highlight FoldColumn guibg=NONE ctermbg=NONE
    highlight SignColumn guibg=NONE ctermbg=NONE
    highlight VertSplit guibg=NONE ctermbg=NONE
endfunction