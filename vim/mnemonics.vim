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
" Tabs
"
"----------------------------------------------------------------

" Tab New
nmap <Leader>tn :tabnew<CR>

" Tab Close
nmap <Leader>tc :tabclose<CR>

" Tab Left
nmap <Leader>th :tabprevious<CR>

" Tab Right
nmap <Leader>tl :tabnext<CR>


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
