"---------------------------------------------------------------
"
" coc.nvim extensions
"
"---------------------------------------------------------------

let g:coc_global_extensions = [
    \ 'coc-actions',
    \ 'coc-diagnostic',
    \ 'coc-eslint',
    \ 'coc-html',
    \ 'coc-json',
    \ 'coc-phpls',
    \ 'coc-prettier',
    \ 'coc-prisma',
    \ 'coc-rls',
    \ 'coc-snippets',
    \ 'coc-tsserver',
\ ]


"---------------------------------------------------------------
"
" Plugins
"
"---------------------------------------------------------------

call plug#begin('~/.vim/plugged')

" Plugins go here

" Theme/UI
Plug 'arcticicestudio/nord-vim' " Theme.
Plug 'itchyny/lightline.vim' " Bottom info line.
Plug 'mengelbrecht/lightline-bufferline' " Buffer list

" Text manipulation
Plug 'Raimondi/delimitMate' " Bracket and quote completion.
Plug 'tpope/vim-repeat' " Repeat plug-in operations, etc.
Plug 'tpope/vim-surround' " Quickly surround text with brackets, quotes, etc.
Plug 'vim-scripts/ReplaceWithRegister' " Easily replace with contents of register.

" Code-specific
Plug 'janko/vim-test' " Run tests.
Plug 'metakirby5/codi.vim' " Interactive scratch pad.
Plug 'rhysd/devdocs.vim' " Search devdocs.in.
Plug 'tpope/vim-commentary' " Quick commenting.
Plug 'tpope/vim-fugitive' " Git integration.

" Language support
Plug 'sheerun/vim-polyglot' " Multi-language syntax highlighting, etc.
Plug 'neoclide/coc.nvim', {'branch': 'release'} " Language servers.
Plug 'stephpy/vim-php-cs-fixer' " PHP formatting.
Plug 'pantharshit00/vim-prisma' " Prsima syntax highlighting.

" Misc utilities
Plug '~/.fzf' " File and text searching.
Plug 'christoomey/vim-tmux-navigator' " Navigate between splits and tmux panes.
Plug 'francoiscabrol/ranger.vim'
Plug 'junegunn/fzf.vim' " File and text searching.
Plug 'kamykn/spelunker.vim' " Spell check.
Plug 'rbgrouleff/bclose.vim' " Delete a buffer without closing the window
Plug 'tmux-plugins/vim-tmux-focus-events' " Restore FocusGained and FocusLost events in tmux.
Plug 'tpope/vim-eunuch' " Sugar for file operations (rename, move, etc.).
Plug 'tpope/vim-unimpaired' " Random shortcuts that typically work in pairs.
Plug 'vim-scripts/BufOnly.vim' " Close all buffers but current one.
Plug 'voldikss/vim-floaterm' " Floating terminal

" UltiSnips
Plug 'algotech/ultisnips-php'

call plug#end()


"---------------------------------------------------------------
"
" coc.nvim
"
"---------------------------------------------------------------

" Use <CR> to confirm completion.
inoremap <expr> <CR> pumvisible()
    \ ? coc#_select_confirm()
    \ : "\<C-g>u\<CR>"

" <TAB> is used for completion, completion confirm,
" and snippet expand (like VSCode).
inoremap <silent><expr> <TAB> pumvisible()
    \ ? coc#_select_confirm()
    \ : coc#expandableOrJumpable()
    \     ? "\<C-r>=coc#rpc#request('doKeymap', ['snippets-expand-jump',''])\<CR>"
    \     : <SID>check_back_space()
    \         ? "\<TAB>"
    \         : coc#refresh()

function! s:check_back_space() abort
    let col = col('.') - 1
    return !col || getline('.')[col - 1]  =~# '\s'
endfunction

let g:coc_snippet_next = '<TAB>'


"---------------------------------------------------------------
"
" lightlight.vim
"
"---------------------------------------------------------------

let g:lightline = {
	\ 'active': {
	\     'left': [
    \         [ 'mode', 'paste' ],
	\         [ 'fugitive' ]
    \     ],
    \     'right': [
    \         ['linecount', 'filetype'],
    \     ]
	\ },
    \ 'colorscheme': 'nord',
	\ 'component_function': {
	\     'readonly': 'LightlineReadonly',
	\     'fugitive': 'LightlineFugitive'
	\ },
    \ 'tabline': {
    \     'left': [ ['bufferline'] ]
    \ },
    \ 'component': {
    \     'linecount': '%l/%L'
    \ },
    \ 'component_expand': {
    \     'bufferline': 'lightline#bufferline#buffers',
    \ },
    \ 'component_type': {
    \     'bufferline': 'tabsel',
    \ },
	\ 'tabline_separator': { 'left': '', 'right': '' },
	\ 'tabline_subseparator': { 'left': ' ', 'right': ' ' },
	\ 'separator': { 'left': '', 'right': '' },
	\ 'subseparator': { 'left': '', 'right': '' },
    \ 'mode_map': {
    \     'n' : 'NORM',
    \     'i' : 'INST',
    \     'R' : 'REPL',
    \     'v' : 'VISU',
    \     'V' : 'VLIN',
    \     "\<C-v>": 'VBLK',
    \     'c' : 'COMD',
    \     's' : 'SLCT',
    \     'S' : 'SLIN',
    \     "\<C-s>": 'SBLK',
    \     't': 'TERM',
    \ },
\ }

function! LightlineReadonly()
	return &readonly ? '' : ''
endfunction

function! LightlineFugitive()
	if exists('*FugitiveHead')
		let branch = FugitiveHead()
		return branch !=# '' ? ' '.branch : ''
	endif
	return ''
endfunction


"---------------------------------------------------------------
"
" lightline-bufferline
"
"---------------------------------------------------------------

" Show oridnal buffer number
let g:lightline#bufferline#show_number = 2


"---------------------------------------------------------------
"
" fzf.vim
"
"---------------------------------------------------------------

" When text-searching, show full screen with preview.
command! -bang -nargs=* Ag
    \ call fzf#vim#ag(
        \ <q-args>,
        \ <bang>0
            \ ? fzf#vim#with_preview({'options': '--delimiter : --nth 4..'}, 'up:60%')
            \ : fzf#vim#with_preview({'options': '--delimiter : --nth 4..'}, 'right:50%:hidden', '?'),
        \ <bang>0
    \ )


"---------------------------------------------------------------
"
" ranger
"
"---------------------------------------------------------------

let g:ranger_map_keys = 0
let g:ranger_replace_netrw = 1


"---------------------------------------------------------------
"
" spelunker.vim
"
"---------------------------------------------------------------

" Dynamically spell-check words in current buffer.
let g:spelunker_check_type = 2


"---------------------------------------------------------------
"
" vim-bufferline
"
"---------------------------------------------------------------

let g:bufferline_echo = 0
let g:bufferline_active_buffer_left = ''
let g:bufferline_active_buffer_right = ''


"---------------------------------------------------------------
"
" vim-php-cs-fixer
"
"---------------------------------------------------------------

" Disable default mappings
let g:php_cs_fixer_enable_default_mapping = 0
let g:php_cs_fixer_path = "./vendor/bin/php-cs-fixer"

" Auto-fix on save.
autocmd BufWritePost *.php silent! call PhpCsFixerFixFile()


"---------------------------------------------------------------
"
" vim-test
"
"---------------------------------------------------------------

if has('nvim')
    let test#strategy = "neovim"
    let test#neovim#term_position = "rightbelow"
endif
