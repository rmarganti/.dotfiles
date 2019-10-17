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

" Buffer New
nmap <Leader>bn :enew<CR>

" Buffer Edit (prompts for buffer number)
nmap <Leader>be :buffer<SPACE>

" Buffer Left
nmap <Leader>bh :bprevious<CR>

" Buffer Right
nmap <Leader>bl :bnext<CR>

" Buffer Delete (prompts for buffer number)
nmap <Leader>bd :bdelete<SPACE>

" Buffer Quit (Deletes current buffer)
nmap <Leader>bq :bdelete<CR>

" Buffer Only (Close all other buffers)
nmap <Leader>bo :BufOnly<CR>


"----------------------------------------------------------------
"
" Edit
"
"----------------------------------------------------------------

" Edit `.vimrc`
nmap <Leader>ev :tabedit $MYVIMRC<CR>


"----------------------------------------------------------------
"
" Files
"
"----------------------------------------------------------------

" File Shell (open shell at current file's path)
nmap <Leader>fs :let $VIM_DIR=expand('%:p:h')<CR>:terminal<CR>cd $VIM_DIR<CR>

" File Find (show current file in NERDTree
nmap <Leader>ff :NERDTreeFind<CR>


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
