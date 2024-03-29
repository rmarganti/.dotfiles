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

" Buffer Edit #.
nmap <Leader>be1 <Plug>lightline#bufferline#go(1)
nmap <Leader>be2 <Plug>lightline#bufferline#go(2)
nmap <Leader>be3 <Plug>lightline#bufferline#go(3)
nmap <Leader>be4 <Plug>lightline#bufferline#go(4)
nmap <Leader>be5 <Plug>lightline#bufferline#go(5)
nmap <Leader>be6 <Plug>lightline#bufferline#go(6)
nmap <Leader>be7 <Plug>lightline#bufferline#go(7)
nmap <Leader>be8 <Plug>lightline#bufferline#go(8)
nmap <Leader>be9 <Plug>lightline#bufferline#go(9)
nmap <Leader>be0 <Plug>lightline#bufferline#go(10)

" Buffer Left.
nmap <Leader>bh :bprevious<CR>

" Buffer Right.
nmap <Leader>bl :bnext<CR>

" Buffer Delete #.
nmap <Leader>bd1 <Plug>lightline#bufferline#delete(1)
nmap <Leader>bd2 <Plug>lightline#bufferline#delete(2)
nmap <Leader>bd3 <Plug>lightline#bufferline#delete(3)
nmap <Leader>bd4 <Plug>lightline#bufferline#delete(4)
nmap <Leader>bd5 <Plug>lightline#bufferline#delete(5)
nmap <Leader>bd6 <Plug>lightline#bufferline#delete(6)
nmap <Leader>bd7 <Plug>lightline#bufferline#delete(7)
nmap <Leader>bd8 <Plug>lightline#bufferline#delete(8)
nmap <Leader>bd9 <Plug>lightline#bufferline#delete(9)
nmap <Leader>bd0 <Plug>lightline#bufferline#delete(10)

" Buffer Quit (Deletes current buffer).
nmap <Leader>bq :bdelete<CR>

" Buffer force Quit (Deletes current buffer).
nmap <Leader>bQ :bdelete!<CR>

" Buffer delete All.
nmap <Leader>ba :%bd<CR>

" Buffer force delete All.
nmap <Leader>bA :%bd!<CR>

" Buffer force Only (Close all other buffers).
nmap <Leader>bo :BufOnly!<CR>


"----------------------------------------------------------------
"
" Edit
"
"----------------------------------------------------------------

" Edit Changelog
nmap <Leader>ec :edit CHANGELOG.md<CR>

" Edit Env
nmap <Leader>ee :edit .env<CR>

" Edit Snippets
nmap <Leader>es :CocCommand snippets.editSnippets<CR>

" Edit `.Vimrc`
nmap <Leader>ev :edit $MYVIMRC<CR>


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

" File Write
nmap <Leader>fw :w<CR>

" File eXplore
nmap <Leader>fx :Ranger<CR>

function! s:toggle_nerdtree()
    " Close NERDTree if it is already open.
    if (exists('t:NERDTreeBufName') && bufwinnr(t:NERDTreeBufName) != -1)
        NERDTreeClose
    " Show NERDTree if no file is currently open.
    elseif @% == ""
        NERDTreeToggle                      
    " Focus current file in NERDTree.
    else                                    
        NERDTreeFind                        
    endif                                   
endfunction

" File Types
nmap <Leader>ft :Filetypes<CR>


"----------------------------------------------------------------
"
" Git
"
"----------------------------------------------------------------

nmap <Leader>go :Git checkout<SPACE>
nmap <Leader>gb :Git blame<CR>


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

" Go to reFerences
nmap <silent> gf <Plug>(coc-references)

" Go to Hint.
nnoremap <silent> gh :call <SID>show_documentation()<CR>

function! s:show_documentation()
    if (index(['vim','help'], &filetype) >= 0)
        execute 'h '.expand('<cword>')
    else
        call CocAction('doHover')
    endif
endfunction

" Code previous error
nmap <Leader>ck <Plug>(coc-diagnostic-prev)

" Code previous error
nmap <Leader>cj <Plug>(coc-diagnostic-next)

" Code document Symbols.
nnoremap <Leader>cs :CocList outline<CR>

" Code Workspace symbols
nnoremap <Leader>cw :CocList -I symbols<CR>

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
xmap <leader>ca  <Plug>(coc-codeaction-selected)
nmap <leader>ca  <Plug>(coc-codeaction-selected)

" Code Hide (hides error messages).
nmap <Leader>ch <Plug>(coc-float-hide)
vmap <Leader>ch <Plug>(coc-float-hide)

" Code Devdocs.io for under cursor.
nmap <leader>cd <Plug>(devdocs-under-cursor)

" Code Prettier
nmap <leader>cp :CocCommand prettier.formatFile<CR>


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

" Search Devdocs.io
nmap <Leader>sd :DevDocs<Space>

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
nmap <Leader>sv :vnew<CR>

" Split Horiztonal
nmap <Leader>sh :new<CR>


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

" Toggle relative numbers
nnoremap <Leader>Tr :set invrelativenumber<CR>

" Toggle word wrap
nnoremap <Leader>Tw :setlocal wrap!<CR>

noremap  <F12> :FloatermToggle<CR>
noremap! <F12> <Esc>:FloatermToggle<CR>
tnoremap <F12> <C-\><C-n>:FloatermToggle<CR>


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
" Miscellaneous
"
"----------------------------------------------------------------

" Quit
nnoremap <Leader>qq :qa<CR>

" Force close all buffers and Quit
nnoremap <Leader>qQ :qa!<CR>
