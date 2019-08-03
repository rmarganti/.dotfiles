" Load Plugins
source ~/.vim/plugins.vim


"---------------------------------------------------------------
"
" Theme
"
"---------------------------------------------------------------

syntax enable
set background=dark
colorscheme nord

" Always show tab bar
set showtabline=2

" Always show status bar
set laststatus=2

" Configure the status bar
let g:lightline = {
	\ 'active': {
	\   'left': [ [ 'mode', 'paste' ],
	\             [ 'fugitive', 'readonly', 'filename', 'modified' ] ]
	\ },
    \ 'colorscheme': 'nord',
	\ 'component': {
	\   'lineinfo': ' %3l:%-2v',
	\ },
	\ 'component_function': {
	\   'readonly': 'LightlineReadonly',
	\   'fugitive': 'LightlineFugitive'
	\ },
	\ 'separator': { 'left': '', 'right': '' },
	\ 'subseparator': { 'left': '', 'right': '' }
	\ }

function! LightlineReadonly()
	return &readonly ? '' : ''
endfunction

function! LightlineFugitive()
	if exists('*fugitive#head')
		let branch = fugitive#head()
		return branch !=# '' ? ''.branch : ''
	endif
	return ''
endfunction


"---------------------------------------------------------------
"
" General Settings
"
"---------------------------------------------------------------

" Make backspace behave like every other editor.
set backspace=indent,eol,start

" The default leader is \, but a comma is much better.
let mapleader = ','

" Let's activate line numbers.
set number

" Macvim-specific line-height.
set linespace=15


"---------------------------------------------------------------
"
" File Search
"
"---------------------------------------------------------------

" fzf file name searching
nnoremap <C-p> :Files!<Cr>

" fzf full-screen file content searching
nnoremap <C-f> :Ag!<Cr>
command! -bang -nargs=* Ag
    \ call fzf#vim#ag(<q-args>,
        \ <bang>0 ? fzf#vim#with_preview('up:60%')
        \ : fzf#vim#with_preview('right:50%:hidden', '?'),
        \ <bang>0)


"---------------------------------------------------------------
"
" Text Search
"
"---------------------------------------------------------------

set hlsearch
set incsearch

filetype plugin indent on

" show existing tab with 4 spaces width
set tabstop=4

" when indenting with '>', use 4 spaces width
set shiftwidth=4

" On pressing tab, insert 4 spaces
set expandtab


"---------------------------------------------------------------
"
" Splits
"
"---------------------------------------------------------------

set splitbelow         "Make splits default to below...
set splitright        "And to the right. This feels more natural.

"We'll set simpler mappings to switch between splits.
nmap <C-J> <C-W><C-J>
nmap <C-K> <C-W><C-K>
nmap <C-H> <C-W><C-H>
nmap <C-L> <C-W><C-L>


"---------------------------------------------------------------
"
" Mappings
"
"---------------------------------------------------------------

"Make it easy to edit the Vimrc file.
nmap <Leader>ev :tabedit $MYVIMRC<cr>

"Add simple highlight removal.
nmap <Leader><space> :nohlsearch<cr>

"Make it easier to toggle NERDTree
nmap <Leader>` :NERDTreeToggle<cr>

"Speed up tags usage
nmap <Leader>f :tag<space>


"---------------------------------------------------------------
"
" Auto Commands`
"
"---------------------------------------------------------------

"Automatically source the `.vimrc`
"and `plugins.vim` files on save.
augroup autosourcing
   autocmd!
   autocmd BufWritePost .vimrc source %
   autocmd BufWritePost plugins.vim source %
augroup END
