"----------------------------------------------------------------
"
" Mnemonics.vim
"
" THINK QUICK! Mnemonic keyboard 
" shortcuts for getting thangs done.
"
"----------------------------------------------------------------


"----------------------------------------------------------------
"
" Buffers
"
"----------------------------------------------------------------

" Buffer New.
nmap <Leader>bn :enew<CR>

" Buffer Edit (prompts for buffer number).
nmap <Leader>be :buffer<SPACE>

" Buffer Left.
nmap <Leader>bh :bprevious<CR>

" Buffer Right.
nmap <Leader>bl :bnext<CR>

" Buffer Delete (prompts for buffer number).
nmap <Leader>bd :bdelete<SPACE>

" Buffer Quit (Deletes current buffer).
nmap <Leader>bq :Bclose<CR>

" Buffer force Quit (Deletes current buffer).
nmap <Leader>bQ :Bclose!<CR>

" Buffer delete All.
nmap <Leader>ba :%bd<CR>

" Buffer force delete All.
nmap <Leader>bA :%bd!<CR>

" Buffer Only (Close all other buffers).
nmap <Leader>bo :BufOnly<CR>

" Buffer force Only (Close all other buffers).
nmap <Leader>bO :BufOnly!<CR>

"----------------------------------------------------------------
"
" Edit
"
"----------------------------------------------------------------

" Edit Changelog
nmap <Leader>ec :edit CHANGELOG.md<CR>

" Edit Env
nmap <Leader>ee :edit .env<CR>

" Edit `.Vimrc`
nmap <Leader>ev :edit $MYVIMRC<CR>

" Edit Snippets
nmap <Leader>es :CocCommand snippets.editSnippets<CR>

"----------------------------------------------------------------
"
" Files
"
"----------------------------------------------------------------

" File Shell (open shell at current file's path)
nmap <Leader>fs :let $VIM_DIR=expand('%:p:h')<CR>:terminal<CR>cd $VIM_DIR<CR>

" File Edit. Pre-populates the current directory.
nmap <Leader>fe :e <C-R>=expand("%:p:h") . "/" <CR>

" File Copy
nmap <Leader>fc :saveas <C-R>=expand("%:p")<CR>

" File Delete
nmap <Leader>fd :Delete

" File Move
nmap <Leader>fm :Move <C-R>=expand("%:p")<CR>

" File Rename
nmap <Leader>fr :Rename <C-R>=expand("%:t")<CR>

" File Find (show current file in NERDTree
nmap <Leader>ff :NERDTreeFind<CR>

" File Write
nmap <Leader>fw :w<CR>

" File Types
nmap <Leader>ftm :set filetype=markdown<CR>
nmap <Leader>ftj :set filetype=javascript<CR>
nmap <Leader>ftJ :set filetype=json<CR>
nmap <Leader>ftp :set filetype=php<CR>
nmap <Leader>ftt :set filetype=typescript<CR>
nmap <Leader>ftv :set filetype=vim<CR>

"----------------------------------------------------------------
"
" Code
"
"----------------------------------------------------------------

" Go to definition
nmap <silent> gd <Plug>(coc-definition)
nmap <silent> gy <Plug>(coc-type-definition)

" Go to Implementation
nmap <silent> gi <Plug>(coc-implementation)

" Go to Hint.
nnoremap <silent> gh :call <SID>show_documentation()<CR>

function! s:show_documentation()
    if (index(['vim','help'], &filetype) >= 0)
        execute 'h '.expand('<cword>')
    else
        call CocAction('doHover')
    endif
endfunction

nmap <silent> [c <Plug>(coc-diagnostic-prev)
nmap <silent> ]c <Plug>(coc-diagnostic-next)

" Code document Symbols.
nnoremap <Leader>cs :CocList outline<CR>

" Code Workspace symbols
nnoremap <Leader>cw :CocList -I symbols<CR>

" Code List errors
nnoremap <Leader>cl :CocList locationlist<CR>

" Code Commands
nnoremap <Leader>cc :CocList commands<CR>

" Code Restart
nnoremap <Leader>cR :CocRestart<CR>

" Code eXtensions
nnoremap <Leader>cx :CocList extensions<CR>

" Code Rename
nmap <Leader>cr <Plug>(coc-rename)

" Code Format
nmap <Leader>cf <Plug>(coc-format-selected)
vmap <Leader>cf <Plug>(coc-format-selected)

" Code Actions
vmap <Leader>ca <Plug>(coc-codeaction-selected)
nmap <Leader>ca <Plug>(coc-codeaction-selected)

" Code Hide (hides error messages).
nmap <Leader>ch <Plug>(coc-float-hide)
vmap <Leader>ch <Plug>(coc-float-hide)


"----------------------------------------------------------------
"
" Registers
"
"----------------------------------------------------------------

" Yank to system clipboard
nnoremap <Leader>y "+y
xnoremap <Leader>y "+y

" Delete to system clipboard
xnoremap <Leader>d "+d

" Paste from system clipboard
nnoremap <Leader>p "+p
nnoremap <Leader>P "+P
xnoremap <Leader>p "+p
xnoremap <Leader>P "+P

" Replace from system clipboard
nmap <Leader>gr "+gr
xmap <Leader>gr "+gr

" Yank File name to system clipboard.
nmap <Leader>yf :let @+ = expand("%:t")<cr>

" Yank file Absolute path to system clipboard.
nmap <Leader>ya :let @+ = expand("%:p")<cr>

" Yank file Relative path to system clipboard.
nmap <Leader>yr :let @+ = expand("%")<cr>


"----------------------------------------------------------------
"
" Search
"
"----------------------------------------------------------------

" Search Buffers
nmap <Leader>sb :Buffers!<Cr>

" Search Files
nmap <Leader>sf :Files!<Cr>

" Search Text
nmap <Leader>st :Ag!<Cr>


"----------------------------------------------------------------
"
" Splits
"
"----------------------------------------------------------------

" Split Vertical
nmap <Leader>sv :vsplit<CR>

" Split Horiztonal
nmap <Leader>sh :split<CR>


"----------------------------------------------------------------
"
" Test
"
"----------------------------------------------------------------

nmap <Leader>tn :TestNearest<CR>
nmap <Leader>tf :TestFile<CR>
nmap <Leader>ts :TestSuite<CR>
nmap <Leader>tl :TestLast<CR>
nmap <Leader>tv :TestVisit<CR>


"----------------------------------------------------------------
"
" Toggle
"
"----------------------------------------------------------------

" Toggle paste
nnoremap <Leader>Tp :set invpaste paste?<CR>

" Toggle line numbers
nnoremap <Leader>Tl :set invnumber<CR>

" Toggle word wrap
nnoremap <Leader>Tw :setlocal wrap!<CR>


"----------------------------------------------------------------
"
" Windows
"
"----------------------------------------------------------------

" Window Quit
nmap <Leader>wq <C-W>q

" Window Only (Close all other windows)
nmap <Leader>wo :only<CR>

" Window Zoom toggle
function! s:ZoomToggle() abort
    if exists('t:zoomed') && t:zoomed
        execute t:zoom_winrestcmd
        let t:zoomed = 0
    else
        let t:zoom_winrestcmd = winrestcmd()
        resize
        vertical resize
        let t:zoomed = 1
    endif
endfunction
command! ZoomToggle call s:ZoomToggle()
nnoremap <silent> <Leader>wz :ZoomToggle<CR>
