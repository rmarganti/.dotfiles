local utils = require('rmarganti.utils.misc')

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
-- Randoms
--
------------------------------------------------

utils.map('n', '<Leader>j', '<cmd>HopWord<CR>')


------------------------------------------------
--
-- Buffers
--
------------------------------------------------

-- Buffer New.
utils.map('n', '<Leader>bn', ':enew<CR>')

-- Buffer Edit.
utils.map('n', '<Leader>be', '<cmd>lua require("bufferline").pick_buffer()<CR>')

-- Buffer Delete.
utils.map('n', '<Leader>bd', '<cmd>BufferLinePickClose<CR>')

-- Buffer focus Left.
utils.map('n', '<leader>bh', '<cmd>lua require("bufferline").cycle(-1)<CR>')

-- Buffer focus Right.
utils.map('n', '<leader>bl', '<cmd>lua require("bufferline").cycle(1)<CR>')

-- Buffer move Left.
utils.map('n', '<leader>bH', '<cmd>BufferLineMovePrev<CR>')

-- Buffer move Right.
utils.map('n', '<leader>bL', '<cmd>BufferLineMoveNext<CR>')

-- Buffer Quit.
utils.map('n', '<leader>bq', '<cmd>BufDel<CR>')

-- Buffer force Quit.
utils.map('n', '<leader>bQ', '<cmd>BufDel!<CR>')

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
utils.map('n', 'gh', '<cmd>lua vim.lsp.buf.hover()<CR>')

-- Code Actions.
utils.map('n', '<Leader>ca', [[<cmd>lua require("telescope.builtin").lsp_code_actions(require('telescope.themes').get_dropdown({}))<CR>]])
utils.map('v', '<Leader>ca', [[<cmd>lua require("telescope.builtin").lsp_range_code_actions(require('telescope.themes').get_dropdown({}))<CR>]])

-- Code symbol Rename.
utils.map('n', '<Leader>cr', [[<cmd>lua require('rmarganti.core.functions').rename()<CR>]])

-- Next diagnostic
utils.map('n', '<Leader>cj', '<cmd>lua vim.lsp.diagnostic.goto_next({ popup_opts = { border = "rounded" }})<CR>')

-- Previous diagnostic
utils.map('n', '<Leader>ck', '<cmd>lua vim.lsp.diagnostic.goto_prev({ popup_opts = { border = "rounded" }})<CR>')

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

-- Edit nearest Changelog
utils.map('n', '<Leader>ec', [[:lua require('rmarganti.core.functions').edit_nearest('CHANGELOG.md')<CR>]])

-- Edit nearest Env
utils.map('n', '<Leader>ee', [[:lua require('rmarganti.core.functions').edit_nearest('.env')<CR>]])

-- Edit nearest Readme
utils.map('n', '<Leader>er', [[:lua require('rmarganti.core.functions').edit_nearest('README.md')<CR>]])

-- Edit Test
utils.map('n', '<Leader>et', [[:lua require('rmarganti.core.functions').edit_test()<CR>]])

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

-- Git Commits
utils.map('n', '<Leader>gc', '<cmd>Telescope git_commits<CR>')

-- Git Branches
utils.map('n', '<Leader>gb', '<cmd>Telescope git_branches<CR>')

-- Git Status
utils.map('n', '<Leader>gs', '<cmd>Telescope git_status<CR>')

-- GitHub gists
utils.map('n', '<Leader>gg', '<cmd>Telescope gh gist<CR>')

-- GitHub Pull Requests
utils.map('n', '<Leader>gp', '<cmd>Telescope gh pull_request<CR>')

-- GitHub Notifications
utils.map('n', '<Leader>gn', [[<cmd>lua require("telescope").extensions.ghn.ghn({ layout_strategy = 'horizontal' })<CR>]])


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
utils.map('n', '<Leader>tj', '<Plug>(ultest-next-fail)', { noremap = false })

-- Jump to the previous Test.
utils.map('n', '<Leader>tk', '<Plug>(ultest-prev-fail)', { noremap = false })

-- Toggle Test Summary.
utils.map('n', '<Leader>ts', ':UltestSummary<CR>')


------------------------------------------------
--
-- Toggle
--
------------------------------------------------

-- Toggle Paste
utils.map('n', '<Leader>tp', ':set invpaste paste?<CR>')

-- Toggle Word wrap
utils.map('n', '<Leader>tw', ':setlocal wrap!<CR>')

-- Toggle Quick fix
utils.map('n', '<Leader>tq', [[:lua require('rmarganti.core.functions').toggle_quickfix()<CR>]])

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
