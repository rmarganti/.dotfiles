local core_fns = require('rmarganti.core.functions')
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
-- vim-unimpaired (and inspired) remaps
--
------------------------------------------------

-- Diagnostics
utils.map('n', '<Leader>jd', function()
    vim.diagnostic.goto_next({ float = { border = 'rounded' } })
end)
utils.map('n', '<Leader>kd', function()
    vim.diagnostic.goto_prev({ float = { border = 'rounded' } })
end)

-- Exchange
utils.map('n', '<Leader>je', ']e', { remap = true })
utils.map('n', '<Leader>ke', '[e', { remap = true })
utils.map('x', '<Leader>je', ']e', { remap = true })
utils.map('x', '<Leader>ke', '[e', { remap = true })

-- Quickfix
utils.map('n', '<Leader>jq', ']q', { remap = true })
utils.map('n', '<Leader>kq', '[q', { remap = true })

-- Add Space
utils.map('n', '<Leader>j<Space>', ']<Space>', { remap = true })
utils.map('n', '<Leader>k<Space>', '[<Space>', { remap = true })

-- Conflict markers
utils.map('n', '<Leader>jc', ']n', { remap = true })
utils.map('n', '<Leader>kc', '[n', { remap = true })

-- Method (function)
utils.map('n', '<Leader>jm', ']m', { remap = true })
utils.map('n', '<Leader>km', '[m', { remap = true })

------------------------------------------------
--
-- Buffers
--
------------------------------------------------

-- See hydra.lua

------------------------------------------------
--
-- Code
--
------------------------------------------------

-- Code completion.
-- NOTE: These are set in 'lua/rmarganti/plugins/config/cmp.lua'

-- Goto Definition.
utils.map('n', 'gd', '<cmd>Telescope lsp_definitions<CR>')

-- Goto reFerences.
utils.map('n', 'gf', '<cmd>Telescope lsp_references<CR>')

-- Goto Implementation.
utils.map('n', 'gi', '<cmd>Telescope lsp_implementations<CR>')

-- Goto Hint
utils.map('n', 'gh', vim.lsp.buf.hover)

-- Code Actions.
utils.map('n', '<Leader>ca', vim.lsp.buf.code_action)
utils.map('v', '<Leader>ca', vim.lsp.buf.code_action)

-- Code symbol Rename.
utils.map('n', '<Leader>cr', vim.lsp.buf.rename)

-- Code file Symbols.
utils.map('n', '<Leader>cs', '<cmd>lua require("telescope.builtin").lsp_document_symbols({})<CR>')

-- Code Workspace symbols
utils.map(
    'n',
    '<Leader>cw',
    '<cmd>lua require("telescope.builtin").lsp_dynamic_workspace_symbols({})<CR>'
)

-- Code Format
utils.map('n', '<Leader>cf', function()
    core_fns.format(false)
end)

-- Code Organize imports
utils.map('n', '<Leader>co', core_fns.organize_imports)

-- Code Capture screenshot
utils.map('n', '<Leader>cc', function()
    require('silicon').visualise_api({ show_buf = true })
end)

-- Code Capture screenshot
utils.map('v', '<Leader>cc', function()
    require('silicon').visualise_api({})
end)

------------------------------------------------
--
-- Edit
--
------------------------------------------------

local edit_nearest = core_fns.edit_nearest

-- Edit nearest Changelog
utils.map('n', '<Leader>ec', function()
    edit_nearest('CHANGELOG.md')
end)

-- Edit nearest Composer.json
utils.map('n', '<Leader>eC', function()
    edit_nearest('composer.json')
end)

-- Edit nearest Env
utils.map('n', '<Leader>ee', function()
    edit_nearest('.env')
end)

-- Edit nearest Index.ts
utils.map('n', '<Leader>ei', function()
    edit_nearest('index.ts')
end)

-- Edit nearest package.json
utils.map('n', '<Leader>ep', function()
    edit_nearest('package.json')
end)

-- Edit nearest Readme
utils.map('n', '<Leader>er', function()
    edit_nearest('README.md')
end)

-- Edit Test
utils.map('n', '<Leader>et', core_fns.edit_test)

-- Edit Snippets for current file type
utils.map('n', '<Leader>es', core_fns.edit_snippets)

------------------------------------------------
--
-- Files
--
------------------------------------------------

-- File Edit. Pre-populates the current directory.
utils.map('n', '<Leader>fe', ':e <C-R>=expand("%:p:h") . "/" <CR>', { silent = false })

-- File Copy
utils.map('n', '<Leader>fc', ':saveas <C-R>=expand("%:p")<CR>', { silent = false })

-- File Delete
utils.map('n', '<Leader>fd', ':Delete!', { silent = false })

-- File Move
utils.map('n', '<Leader>fm', ':Move <C-R>=expand("%:p")<CR>', { silent = false })

-- File Rename
utils.map('n', '<Leader>fr', ':Rename <C-R>=expand("%:t")<CR>', { silent = false })

-- File Write
utils.map('n', '<Leader>fw', function()
    vim.cmd('write')
    vim.notify('File saved')
end)

-- File eXplore
utils.map('n', '<Leader>fx', ':RnvimrToggle<CR>')

-- File Types
utils.map('n', '<Leader>ft', '<cmd>lua require("telescope.builtin").filetypes({})<CR>')

------------------------------------------------
--
-- Git
--
------------------------------------------------

-- Git Add current file
utils.map('n', '<Leader>ga', '<cmd>Git add % <bar> lua vim.notify("Git added current file")<CR>')

-- Git checkOut current file
utils.map(
    'n',
    '<Leader>go',
    '<cmd>Git checkout % <bar> e! % <bar> lua vim.notify("Git checked out current file")<CR>'
)

-- Git Commits
utils.map('n', '<Leader>gc', '<cmd>Telescope git_commits<CR>')

-- Git History (commits for buffer)
utils.map('n', '<Leader>gh', '<cmd>Telescope git_bcommits<CR>')

-- Git Branches
utils.map('n', '<Leader>gb', '<cmd>Telescope git_branches<CR>')

-- Git Status
utils.map('n', '<Leader>gs', '<cmd>Telescope git_status<CR>')

-- Git bLame
utils.map('n', '<Leader>gl', '<cmd>Git blame<CR>')

-- GitHub gists
utils.map('n', '<Leader>gg', '<cmd>Telescope gh gist<CR>')

-- GitHub Pull Requests
utils.map('n', '<Leader>gp', '<cmd>Telescope gh pull_request<CR>')

-- GitHub Notifications
utils.map(
    'n',
    '<Leader>gn',
    [[<cmd>lua require("telescope").extensions.ghn.ghn({ layout_strategy = 'horizontal' })<CR>]]
)

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
utils.map('n', '<Leader>gr', '"+gr', { remap = true })
utils.map('x', '<Leader>gr', '"+gr', { remap = true })

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
utils.map('n', '<Leader>sf', function()
    require('telescope.builtin').find_files({ hidden = true })
end)

-- Search Recent files
utils.map('n', '<Leader>sr', '<cmd>lua require("telescope").extensions.recent_files.pick()<CR>')

-- Search Text
utils.map('n', '<Leader>st', '<cmd>Telescope live_grep<CR>')

-- Search Buffers
utils.map('n', '<Leader>sb', '<cmd>Telescope buffers<CR>')

-- Search Window (jumps to character visible in current window)
utils.map('n', '<Leader>sw', '<cmd>HopChar1<CR>')

-- Search Wiki
utils.map('n', '<Leader>sW', function()
    require('telescope.builtin').find_files({
        hidden = true,
        search_dirs = { '~/vimwiki' },
    })
end)

-- Search Notifications
utils.map('n', '<Leader>sn', '<cmd>Telescope notify<CR>')

-- Search Symbols
utils.map('n', '<Leader>ss', '<cmd>Telescope symbols<CR>')

-- Search Commands
utils.map('n', '<Leader>sc', '<cmd>Telescope commands<CR>')

-- Search Help
utils.map('n', '<Leader>sh', '<cmd>Telescope help_tags<CR>')

-- Search Resume
utils.map('n', '<Leader>s.', '<cmd>Telescope resume<CR>')

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
utils.map('n', '<Leader>tj', '<Plug>(ultest-next-fail)', { remap = true })

-- Jump to the previous Test.
utils.map('n', '<Leader>tk', '<Plug>(ultest-prev-fail)', { remap = true })

-- Toggle Test Summary.
utils.map('n', '<Leader>ts', ':UltestSummary<CR>')

------------------------------------------------
--
-- Toggle (follows vim-unimpaired convention)
-- y = looks like switch. o = option.
--
------------------------------------------------

-- Toggle Quick fix
utils.map('n', 'yoq', core_fns.toggle_quickfix)

-- Toggle Format on save
utils.map('n', 'yof', core_fns.toggle_format_on_save)

-- Toggle Colorizer
utils.map('n', 'yoc', '<CMD>ColorizerToggle<CR>')

-- Toggle symbol Outline
utils.map('n', 'yoo', '<CMD>SymbolsOutline<CR>')

------------------------------------------------
--
-- Windows
--
------------------------------------------------

utils.map('n', '<C-h>', '<C-w>h')
utils.map('n', '<C-l>', '<C-w>l')
utils.map('n', '<C-j>', '<C-w>j')
utils.map('n', '<C-k>', '<C-w>k')

-- See hydra.lua for more Window mappings.

------------------------------------------------
--
-- Misc
--
------------------------------------------------

-- Clear search highlight
utils.map('n', '<Esc>', ':nohlsearch<CR>')

-- Quit
utils.map('n', '<Leader>qq', ':qa<CR>')

-- Force close all buffers and Quit
utils.map('n', '<Leader>qQ', ':qa!<CR>')

-- Show syntax Highlight group for word under cursor.
utils.map('n', '<Leader>hh', '<CMD>TSHighlightCapturesUnderCursor<CR>')

-- Go Split (opposite of `J` for parameters)
utils.map('n', 'gJ', function()
    require('trevj').format_at_cursor()
end)
