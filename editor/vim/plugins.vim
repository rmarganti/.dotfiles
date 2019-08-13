call plug#begin('~/.vim/plugged')

" Plugins go here
Plug '~/.fzf'
Plug 'arcticicestudio/nord-vim'
Plug 'bling/vim-bufferline'
Plug 'christoomey/vim-tmux-navigator'
Plug 'dense-analysis/ale'
Plug 'itchyny/lightline.vim'
Plug 'junegunn/fzf.vim'
Plug 'leafgarland/typescript-vim'
Plug 'scrooloose/nerdtree'
Plug 'tpope/vim-commentary'
Plug 'tpope/vim-fugitive'
Plug 'tpope/vim-surround'
Plug 'vim-scripts/ReplaceWithRegister'

call plug#end()


"---------------------------------------------------------------
"
" Lightline
"
"---------------------------------------------------------------
let g:lightline = {
	\ 'active': {
	\   'left': [
    \       [ 'mode', 'paste' ],
	\       [ 'fugitive', 'readonly', 'filename', 'modified' ]
    \   ],
    \   'right': [
    \       ['lineinfo'],
    \       ['fileformat', 'fileencoding', 'filetype']
    \   ]
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
" fzf
"
"---------------------------------------------------------------

" When text-searching, show full screen with preview.
command! -bang -nargs=* Ag
    \ call fzf#vim#ag(<q-args>,
        \ <bang>0 ? fzf#vim#with_preview('up:60%')
        \ : fzf#vim#with_preview('right:50%:hidden', '?'),
        \ <bang>0)
