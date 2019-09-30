"----------------------------------------------------------------
"
" Mnemonics.vim
"
" THINK QUICK! Mnemonic keyboard shorctus
" for getting thangs done.
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
nmap <Leader>bo :%bd<CR><C-O>:bd#<CR>


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
" Toggle
"
"----------------------------------------------------------------

nnoremap <Leader>tp :set invpaste paste?<CR>


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
