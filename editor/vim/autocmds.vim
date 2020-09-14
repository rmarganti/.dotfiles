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
    autocmd BufWritePost autocmds.vim source %
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

augroup FormatJson
    autocmd!

    "" Automatically format JSON on save.
    autocmd BufWritePre *.json call CocAction('format')
augroup END

augroup Misc
    autocmd!

    " Automatically resize windows when the host
    " window size changes. Useful for tmux zooms.
    autocmd VimResized * wincmd =

    " Tweak Nord color scheme.
    autocmd ColorScheme * call s:TweakColorScheme()
augroup END

function s:TweakColorScheme()
    " Code Lens color
    highlight CocCodeLens guifg=#4C566A 

    " Override to allow terminal BG to show through.
    highlight Normal guibg=NONE ctermbg=NONE
    highlight LineNr guibg=NONE ctermbg=NONE
    highlight FoldColumn guibg=NONE ctermbg=NONE
    highlight SignColumn guibg=NONE ctermbg=NONE
    highlight VertSplit guibg=NONE ctermbg=NONE
endfunction

" Restore previous position when returning to a buffer.
augroup RememberPosition
    autocmd!

    autocmd BufLeave * let b:winview = winsaveview()
    autocmd BufEnter * if(exists('b:winview')) | call winrestview(b:winview) | endif
augroup END
