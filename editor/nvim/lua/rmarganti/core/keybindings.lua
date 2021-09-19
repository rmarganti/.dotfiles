local utils = require('rmarganti.utils')

-- Set <Space> as the leader key.
utils.map('n', '<Space>', '<Nop>')
vim.g.mapleader = ' '


------------------------------------------------
--
-- Disables
--
------------------------------------------------

-- Disable accidentally pressing ctrl-z and suspending
utils.map('n', '<c-z>', '<Nop>')

-- Disable ex mode
utils.map('n', 'Q', '<Nop>')

------------------------------------------------
--
-- Buffers
--
------------------------------------------------


-- Buffer New.
utils.map('n', '<Leader>bn', ':enew<CR>')

-- Buffer Edit.
utils.map('n', '<Leader>be', '<cmd>lua require("bufferline").pick_buffer()<CR>')

-- Buffer Left.
utils.map('n', '<leader>bh', '<cmd>lua require("bufferline").cycle(-1)<CR>')

-- Buffer Right.
utils.map('n', '<leader>bl', '<cmd>lua require("bufferline").cycle(1)<CR>')

-- Buffer Quit.
utils.map(
    'n',
    '<leader>bq',
    '<cmd>lua require("bufferline").handle_close_buffer(vim.fn.bufnr("%"))<CR>'
)

-- Buffer quit All.
utils.map('n', '<Leader>ba', ':%bd<CR>')

-- Keep current Buffer open Only.
utils.map('n', '<Leader>bo', ':BufOnly<CR>')


------------------------------------------------
--
-- Code
--
------------------------------------------------

-- Code completion.
-- NOTE: These are set in 'lua/rmarganti/plugins/config/cmp.lua'

-- Goto Definition.
utils.map('n', 'gd', ':lua vim.lsp.buf.definition()<CR>')

-- Goto reFerences.
utils.map('n', 'gf', '<cmd>lua require("telescope.builtin").lsp_references({})<CR>')

-- Goto Implementation.
utils.map('n', 'gi', '<cmd>lua require("telescope.builtin").lsp_implementations({})<CR>')

-- Goto Hint
utils.map('n', 'gh', ':Lspsaga hover_doc<CR>')

-- Code Actions.
utils.map('n', '<Leader>ca', ':Lspsaga code_action<CR>')
utils.map('v', '<Leader>ca', [[:<C-U>lua require('lspsaga.codeaction').range_code_action()<CR>]])

-- Code symbol Rename.
utils.map('n', '<Leader>cr', ":lua require('lspsaga.rename').rename()<CR>")

-- Previous diagnostic
utils.map('n', '<Leader>cj', ':Lspsaga diagnostic_jump_next<CR>')

-- Next diagnostic
utils.map('n', '<Leader>ck', ':Lspsaga diagnostic_jump_prev<CR>')

-- Scroll down documents.
utils.map(
    'n',
    '<C-f>',
    ':lua require("lspsaga.action").smart_scroll_with_saga(1)<CR>'
)

-- Scroll up documents
utils.map(
    'n',
    '<C-b>',
    ":lua require('lspsaga.action').smart_scroll_with_saga(-1)<CR>"
)

-- Code file Symbols.
utils.map('n', '<Leader>cs', '<cmd>lua require("telescope.builtin").lsp_document_symbols({})<CR>')

-- Code Workspace symbols
utils.map('n', '<Leader>cw', '<cmd>lua require("telescope.builtin").lsp_dynamic_workspace_symbols({})<CR>')

-- Code Format
utils.map('n', '<Leader>cf', '<cmd>lua vim.lsp.buf.formatting()<CR>')


------------------------------------------------
--
-- Edit
--
------------------------------------------------

-- TODO


------------------------------------------------
--
-- Files
--
------------------------------------------------

-- File Edit. Pre-populates the current directory.
utils.map('n', '<Leader>fe', ':e <C-R>=expand("%:p:h") . "/" <CR>')

-- File Copy
utils.map('n', '<Leader>fc', ':saveas <C-R>=expand("%:p")<CR>')

-- File Delete
utils.map('n', '<Leader>fd', ':Delete')

-- File Move
utils.map('n', '<Leader>fm', ':Move <C-R>=expand("%:p")<CR>')

-- File Rename
utils.map('n', '<Leader>fr', ':Rename <C-R>=expand("%:t")<CR>')

-- File Write
utils.map('n', '<Leader>fw', 'fw :w<CR>')

-- File eXplore
utils.map('n', '<Leader>fx', ':Ranger<CR>')

-- File Types
utils.map('n', '<Leader>ft', '<cmd>lua require("telescope.builtin").filetypes({})<CR>')


------------------------------------------------
--
-- Git
--
------------------------------------------------

utils.map('n', '<Leader>gc', '<cmd>lua require("telescope.builtin").git_commits({})<CR>')
utils.map('n', '<Leader>gb', '<cmd>lua require("telescope.builtin").git_branches({})<CR>')
utils.map('n', '<Leader>gs', '<cmd>lua require("telescope.builtin").git_status({})<CR>')


------------------------------------------------
--
-- Registers
--
------------------------------------------------

-- Yank to system clipboard
utils.map('n', '<Leader>y', '"+y')
utils.map('x', '<Leader>y', '"+y')

-- Delete to system clipboard
utils.map('x', '<Leader>d', '"+d')

-- Paste from system clipboard
utils.map('n', '<Leader>p', '"+p')
utils.map('n', '<Leader>P', '"+P')
utils.map('x', '<Leader>p', '"+p')
utils.map('x', '<Leader>P', '"+P')

-- Replace from system clipboard
utils.map('n', '<Leader>gr', '"+gr', { noremap = false })
utils.map('x', '<Leader>gr', '"+gr', { noremap = false })

-- Yank File name to system clipboard.
utils.map('n', '<Leader>yf', ':let @+ = expand("%:t")<CR>')

-- Yank file Absolute path to system clipboard.
utils.map('n', '<Leader>ya', ':let @+ = expand("%:p")<CR>')

-- Yank file Relative path to system clipboard.
utils.map('n', '<Leader>yr', ':let @+ = expand("%")<CR>')


------------------------------------------------
--
-- Search
--
------------------------------------------------

-- Search Files
utils.map('n', '<Leader>sf', ':lua require"telescope.builtin".find_files({ hidden = true })<CR>')

-- Search Text
utils.map('n', '<Leader>st', '<cmd>Telescope live_grep<CR>')

-- Search Buffers
utils.map('n', '<Leader>sb', '<cmd>Telescope buffers<CR>')


------------------------------------------------
--
-- Splits
--
------------------------------------------------

-- Split Vertical
utils.map('n', '<Leader>sv', ':vnew<CR>')

-- Split Horiztonal
utils.map('n', '<Leader>sh', ':new<CR>')


------------------------------------------------
--
-- Testing
--
------------------------------------------------

-- Run Tests for the whole File.
utils.map('n', '<Leader>tf', ':Ultest<CR>')

-- Run the Test that is Nearest.
utils.map('n', '<Leader>tn', ':UltestNearest<CR>')

-- Jump to the next Test.
utils.map('n', '<Leader>tj', '<Plug>(ultest-next-fail)')

-- Jump to the previous Test.
utils.map('n', '<Leader>tk', '<Plug>(ultest-prev-fail)')

------------------------------------------------
--
-- Windows
--
------------------------------------------------

-- Window Quit.
utils.map('n', '<Leader>wq', '<C-W>q')

-- Window Only (Close all other windows).
utils.map('n', '<Leader>wo', ':only<CR>')

-- " Window Zoom toggle
-- function! s:ZoomToggle() abort
--     if exists('t:zoomed') && t:zoomed
--         execute t:zoom_winrestcmd
--         let t:zoomed = 0
--     else
--         let t:zoom_winrestcmd = winrestcmd()
--         resize
--         vertical resize
--         let t:zoomed = 1
--     endif
-- endfunction
-- command! ZoomToggle call s:ZoomToggle()
-- nnoremap <silent> <Leader>wz :ZoomToggle<CR>


------------------------------------------------
--
-- Misc
--
------------------------------------------------

-- Clear search highlight
utils.map('n', '<Leader><Space>', ':nohlsearch<CR>')

-- Quit
utils.map('n', '<Leader>qq', ':qa<CR>')

-- Force close all buffers and Quit
utils.map('n', '<Leader>qQ', ':qa!<CR>')
