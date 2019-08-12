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
" Tabs (actually buffers)
"
"----------------------------------------------------------------

" Tab New
nmap <leader>tn :enew<cr>

" Tab Close
nmap <Leader>tc :bp <BAR> bd #<CR>

" Tab Left
nmap <Leader>th :bprevious<CR>

" Tab Right
nmap <Leader>tl :bnext<CR>


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
nmap <Leader>ev :tabedit $MYVIMRC<cr>
