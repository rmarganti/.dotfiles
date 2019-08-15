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
nmap <leader>bn :enew<CR>

" Buffer Edit (prompts for buffer number)
nmap <leader>be :buffer<SPACE>

" Buffer Left
nmap <Leader>bh :bprevious<CR>

" Buffer Right
nmap <Leader>bl :bnext<CR>

" Buffer Delete (prompts for buffer number)
nmap <Leader>bd :bdelete<SPACE>

" Buffer Quit (Deletes current buffer)
nmap <Leader>bq :bdelete<CR>

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


"----------------------------------------------------------------
"
" Find
"
"----------------------------------------------------------------

" Find Files
nmap <Leader>ff :Files!<Cr>

" Find Text
nmap <Leader>ft :Ag!<Cr>


"----------------------------------------------------------------
"
" Edit
"
"----------------------------------------------------------------

" Edit `.vimrc`
nmap <Leader>ev :tabedit $MYVIMRC<CR>
