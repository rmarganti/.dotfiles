"---------------------------------------------------------------
"
" Imports
"
"---------------------------------------------------------------

source ~/.vim/autocmds.vim
source ~/.vim/plugins.vim


"---------------------------------------------------------------
"
" Theme
"
"---------------------------------------------------------------

" set Vim-specific sequences for RGB colors
if exists('&termguicolors')
    let &t_8f = "\<Esc>[38;2;%lu;%lu;%lum"
    let &t_8b = "\<Esc>[48;2;%lu;%lu;%lum"
    set termguicolors
endif

" Configure and set theme
set background=dark
let g:nord_cursor_line_number_background = 1
let g:nord_underline = 1
colorscheme nord

set showtabline=2 " Always show tab bar
set laststatus=0 " Always show status bar
syntax enable " Syntax high-lighting


"---------------------------------------------------------------
"
" General Settings
"
"---------------------------------------------------------------

" Show menus in UTF-8
set encoding=utf-8

" Set to auto read when a file is changed from the outside
set autoread

" Make backspace behave like every other editor.
set backspace=indent,eol,start

" Change leader key to spacebar.
nnoremap <SPACE> <Nop>
let mapleader = ' '

" Show relative line numbers.
set number
set relativenumber

" Allow modified buffers to be hidden.
set hidden

" Don't show status in ex command line,
" since we'll show it in lightline.
set noshowmode

" Enhanced tab-completion for commands.
set wildmenu

" Ignore compiled files, etc.
set wildignore=*.o,*~,*.pyc
if has("win16") || has("win32")
    set wildignore+=.git\*,.hg\*,.svn\*
else
    set wildignore+=*/.git/*,*/.hg/*,*/.svn/*,*/.DS_Store
endif

" Don't wrap lines.
set nowrap

" Disable backups, swaps, etc.
set nobackup
set noswapfile

" Increase timeout for mapped key sequences.
set timeoutlen=2000

" Update UI more often.
set updatetime=300

" Preview %s commands as you type them.
if has('nvim')
    set inccommand=nosplit
endif

" Always show sign column
if exists('&signcolumn')
    set signcolumn=yes
endif

" Always show at least 2 lines above/below the cursor.
set scrolloff=5

" Always show at least 5 columns to the left/right the cursor.
set sidescrolloff=10


"---------------------------------------------------------------
"
" Text search, tabs, indents
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

" Be smart, obviously.
set smarttab

" Auto indent, smart indent
set ai
set si


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
nmap <Leader><space> :nohlsearch<CR>


"----------------------------------------------------------------
"
" Insert-mode abbreviations 
"
"----------------------------------------------------------------

" Date
iab <expr> !!d strftime("%Y-%m-%d")
