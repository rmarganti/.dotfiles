call plug#begin('~/.vim/plugged')

" Plugins go here

" Theme/UI
Plug 'arcticicestudio/nord-vim' " Theme.
Plug 'bling/vim-bufferline' " Show list of buffers.
Plug 'itchyny/lightline.vim' " Bottom info line.

" Text manipulation
Plug 'Raimondi/delimitMate' " Bracket and quote completion.
Plug 'tpope/vim-repeat' " Repeat plug-in operations, etc.
Plug 'tpope/vim-surround' " Quickly surround text with brackets, quotes, etc.
Plug 'vim-scripts/ReplaceWithRegister' " Easily replace with contents of register.

" Misc utilities
Plug '~/.fzf' " File and text searching.
Plug 'christoomey/vim-tmux-navigator' " Navigate between splits and tmux panes.
Plug 'junegunn/fzf.vim' " File and text searching.
Plug 'janko/vim-test' " Run tests.
Plug 'kamykn/spelunker.vim' " Spell check.
Plug 'metakirby5/codi.vim' " Interactive scratchpad.
Plug 'tmux-plugins/vim-tmux-focus-events' " Restore FocusGained and FocusLost events in tmux.
Plug 'tpope/vim-commentary' " Quick commenting.
Plug 'tpope/vim-eunuch' " Sugar for file operations (rename, move, etc.).
Plug 'tpope/vim-fugitive' " Git integration.
Plug 'tpope/vim-unimpaired' " Random shortcuts that typically work in pairs.
Plug 'vim-scripts/BufOnly.vim' " Close all buffers but current one.

" Language support
Plug 'leafgarland/typescript-vim' " Typescript support.
Plug 'neoclide/coc.nvim', {'branch': 'release'} " Language servers.
Plug 'peitalin/vim-jsx-typescript' " JSX formatting.
Plug 'stephpy/vim-php-cs-fixer' " PHP formatting.
Plug 'StanAngeloff/php.vim', {'for': 'php'} " Improve PHP syntax highlighting.

" COC Extensions
Plug 'marlonfan/coc-phpls', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-eslint', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-html', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-json', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-snippets', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-tsserver', {'do': 'yarn install --frozen-lockfile'}
Plug 'weirongxu/coc-explorer', {'do': 'yarn install --frozen-lockfile'}

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
	\         [ 'fugitive', 'readonly', 'filename', 'modified' ]
    \     ],
    \     'right': [
    \         ['percent', 'fileformat', 'fileencoding', 'filetype'],
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
    \ 'component_expand': {
    \     'bufferline': 'LightlineBufferline',
    \ },
    \ 'component_type': {
    \     'bufferline': 'tabsel',
    \ },
	\ 'separator': { 'left': '', 'right': '' },
	\ 'subseparator': { 'left': '', 'right': '' },
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
	if exists('*fugitive#head')
		let branch = fugitive#head()
		return branch !=# '' ? ' '.branch : ''
	endif
	return ''
endfunction

function! LightlineBufferline()
    call bufferline#refresh_status()
    return [ g:bufferline_status_info.before, g:bufferline_status_info.current, g:bufferline_status_info.after]
endfunction


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
" nerdtree
"
"---------------------------------------------------------------

let NERDTreeQuitOnOpen = 1
let NERDTreeAutoDeleteBuffer = 1
let NERDTreeMinimalUI = 1
let NERDTreeDirArrows = 1


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
