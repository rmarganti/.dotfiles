call plug#begin('~/.vim/plugged')

" Plugins go here
Plug '~/.fzf' " File and text searching
Plug 'arcticicestudio/nord-vim' " Theme
Plug 'bling/vim-bufferline' " Show list of buffers
Plug 'christoomey/vim-tmux-navigator' " Navigate between splits and tmux panes
Plug 'francoiscabrol/ranger.vim' " Range file navigation
Plug 'itchyny/lightline.vim' " Bottom info line
Plug 'junegunn/fzf.vim' " File and text searching
Plug 'janko/vim-test' " Run tests
Plug 'kamykn/spelunker.vim' " Spell check
Plug 'leafgarland/typescript-vim' " Typescript support
Plug 'neoclide/coc.nvim', {'branch': 'release'} " Language servers
Plug 'peitalin/vim-jsx-typescript' " JSX formatting
Plug 'Raimondi/delimitMate' " Bracket and quote completion
Plug 'rbgrouleff/bclose.vim' " Allows neovim to delete a buffer without closing the window.
Plug 'scrooloose/nerdtree' " Tree file navigation
Plug 'stephpy/vim-php-cs-fixer' " PHP formatting
Plug 'takac/vim-hardtime' " Don't let yourself navigation ineffeciantly
Plug 'tpope/vim-commentary' " Quick commenting
Plug 'tpope/vim-eunuch' " Sugar for file operations (rename, move, etc.)
Plug 'tpope/vim-fugitive' " Git integration
Plug 'tpope/vim-repeat' " Repeat plug-in operations, etc.
Plug 'tpope/vim-surround' " Quickly surround text with brackets, quotes, etc.
Plug 'tpope/vim-unimpaired' " Random shortcuts that typically work in pairs
Plug 'vim-scripts/ReplaceWithRegister' " Easily replace with contents of register
Plug 'vim-scripts/BufOnly.vim' " Close all buffers but current one

" COC Extensions
Plug 'marlonfan/coc-phpls', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-eslint', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-json', {'do': 'yarn install --frozen-lockfile'}
Plug 'neoclide/coc-tsserver', {'do': 'yarn install --frozen-lockfile'}

call plug#end()


"---------------------------------------------------------------
"
" coc.nvim
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
nnoremap <silent> <Leader>co :<C-u>CocList outline<cr>

" Code Symbols
nnoremap <silent> <Leader>cs :<C-u>CocList -I symbols<cr>

" Code List errors
nnoremap <silent> <Leader>cl :<C-u>CocList locationlist<cr>

" Code Commands
nnoremap <silent> <Leader>cc :<C-u>CocList commands<cr>

" Code Restart
nnoremap <silent> <Leader>cR :<C-u>CocRestart<CR>

" Code eXtensions
nnoremap <silent> <Leader>cx :<C-u>CocList extensions<cr>

" Code Rename
nmap <Leader>cr <Plug>(coc-rename)

" Code Format
nmap <Leader>cf <Plug>(coc-format-selected)
vmap <Leader>cf <Plug>(coc-format-selected)

" Code Actions
vmap <Leader>ca <Plug>(coc-codeaction-selected)
nmap <Leader>ca <Plug>(coc-codeaction-selected)


"---------------------------------------------------------------
"
" lightlight.vim
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
" ranger.vim
"
"---------------------------------------------------------------

let g:ranger_map_keys = 0


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
" vim-hardtime
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
