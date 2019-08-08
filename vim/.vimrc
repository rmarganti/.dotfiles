"---------------------------------------------------------------
"
" Plugins
"
"---------------------------------------------------------------

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
    \ 'tabline': {
    \   'left': [ ['bufferline'] ]
    \ },
    \ 'component_expand': {
    \   'bufferline': 'LightlineBufferline',
    \ },
    \ 'component_type': {
    \   'bufferline': 'tabsel',
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
" General Settings
"
"---------------------------------------------------------------

" Make backspace behave like every other editor.
set backspace=indent,eol,start

" The default leader is `\`, but space is better.
nnoremap <SPACE> <Nop>
let mapleader = ' '

" Let's activate line numbers.
set number

" Allow modified buffers to be hidden
set hidden

" Keep swap, backup, and undo files out of working directory
set backupdir=/tmp//
set directory=/tmp//
set undodir=/tmp//


"---------------------------------------------------------------
"
" fzf
"
"---------------------------------------------------------------

" When text-searching, show full screen with preview.
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

" Highlight Search
set hlsearch

" Incremental Search
set incsearch

" Show existing tab with 4 spaces width
set tabstop=4

" When indenting with '>', use 4 spaces width
set shiftwidth=4

" On pressing tab, insert 4 spaces
set expandtab


"---------------------------------------------------------------
"
" Splits
"
"---------------------------------------------------------------

" Make splits default to below...
set splitbelow

" And to the right. This feels more natural.
set splitright

" We'll set simpler mappings to switch between splits.
nmap <C-J> <C-W><C-J>
nmap <C-K> <C-W><C-K>
nmap <C-H> <C-W><C-H>
nmap <C-L> <C-W><C-L>


"---------------------------------------------------------------
"
" Mappings
"
"---------------------------------------------------------------

" Collection of mnemonic keyboard shorcuts.
source ~/.vim/mnemonics.vim

" Add simple highlight removal.
nmap <Leader><space> :nohlsearch<cr>

" Make it easier to toggle NERDTree
nmap <Leader>` :NERDTreeToggle<cr>


"---------------------------------------------------------------
"
" Auto Commands
"
"---------------------------------------------------------------

" Automatically source the `.vimrc`, `mnemonics.vim`,
" and `plugins.vim` files on save.
augroup autosourcing
   autocmd!
   autocmd BufWritePost .vimrc source %
   autocmd BufWritePost plugins.vim source %
   autocmd BufWritePost mnemonics.vim source %
augroup END
