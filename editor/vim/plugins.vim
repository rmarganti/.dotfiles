call plug#begin('~/.vim/plugged')

" Plugins go here
Plug '~/.fzf'
Plug 'arcticicestudio/nord-vim'
Plug 'bling/vim-bufferline'
Plug 'christoomey/vim-tmux-navigator'
Plug 'itchyny/lightline.vim'
Plug 'junegunn/fzf.vim'
Plug 'leafgarland/typescript-vim'
Plug 'neoclide/coc.nvim', {'branch': 'release'}
Plug 'peitalin/vim-jsx-typescript'
Plug 'scrooloose/nerdtree'
Plug 'takac/vim-hardtime'
Plug 'tpope/vim-commentary'
Plug 'tpope/vim-fugitive'
Plug 'tpope/vim-surround'
Plug 'vim-scripts/ReplaceWithRegister'

" COC Extensions
Plug 'marlonfan/coc-phpls', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-eslint', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-json', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-tsserver', {'do': 'yarn install --frozen-lockfile'}

call plug#end()

"---------------------------------------------------------------
"
" hardtime 
" Prevent pressing the listed keys multiple times.
" Prefer more effecient word movement.
"
"---------------------------------------------------------------
let g:hardtime_default_on = 1
let g:list_of_normal_keys = ["h", "l", "-", "+", "<UP>", "<DOWN>", "<LEFT>", "<RIGHT>"]
let g:list_of_visual_keys = ["h", "l", "-", "+", "<UP>", "<DOWN>", "<LEFT>", "<RIGHT>"]
let g:list_of_insert_keys = ["<UP>", "<DOWN>", "<LEFT>", "<RIGHT>"]
let g:list_of_disabled_keys = []


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


"---------------------------------------------------------------
"
" COC
"
"---------------------------------------------------------------

" Use <cr> to confirm completion.
inoremap <expr> <cr> pumvisible() ? "\<C-y>" : "\<C-g>u\<CR>"

" use <tab> for trigger completion and navigate to the next complete item
function! s:check_back_space() abort
  let col = col('.') - 1
  return !col || getline('.')[col - 1]  =~ '\s'
endfunction

inoremap <silent><expr> <Tab>
    \ pumvisible() ? "\<C-n>" :
    \ <SID>check_back_space() ? "\<Tab>" :
    \ coc#refresh()

" Go to definition
nmap <silent> gd <Plug>(coc-definition)
nmap <silent> gy <Plug>(coc-type-definition)

" Go to Implementation
nmap <silent> gi <Plug>(coc-implementation)

" Go to References
nmap <silent> gr <Plug>(coc-references)

" Go to Hint.
nnoremap <silent> gh :call <SID>show_documentation()<CR>

function! s:show_documentation()
  if (index(['vim','help'], &filetype) >= 0)
    execute 'h '.expand('<cword>')
  else
    call CocAction('doHover')
  endif
endfunction

nmap <silent> [c <Plug>(coc-diagnostic-prev)
nmap <silent> ]c <Plug>(coc-diagnostic-next)

" Code Outline
nnoremap <silent> <Leader>co  :<C-u>CocList outline<cr>

" Code Symbols
nnoremap <silent> <Leader>cs  :<C-u>CocList -I symbols<cr>

" Code List errors
nnoremap <silent> <Leader>cl  :<C-u>CocList locationlist<cr>

" Code Commands
nnoremap <silent> <Leader>cc  :<C-u>CocList commands<cr>

" Code Restart
nnoremap <silent> <Leader>cR  :<C-u>CocRestart<CR>

" Code eXtensions
nnoremap <silent> <Leader>cx  :<C-u>CocList extensions<cr>

" Code Rename
nmap <Leader>cr  <Plug>(coc-rename)

" Code Format
nmap <Leader>cf  <Plug>(coc-format-selected)
vmap <Leader>cf  <Plug>(coc-format-selected)

" Code Actions
vmap <Leader>ca  <Plug>(coc-codeaction-selected)
nmap <Leader>ca  <Plug>(coc-codeaction-selected)

