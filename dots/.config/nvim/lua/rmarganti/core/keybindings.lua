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
-- Jump to next/prev
--
------------------------------------------------

-- Diagnostics
utils.map('n', '<Leader>jd', function()
    vim.diagnostic.goto_next({ float = { border = 'rounded' } })
end)
utils.map('n', '<Leader>kd', function()
    vim.diagnostic.goto_prev({ float = { border = 'rounded' } })
end)

-- Quickfix
utils.map('n', '<Leader>jq', '<Cmd>lua MiniBracketed.quickfix("forward")<CR>')
utils.map('n', '<Leader>kq', '<Cmd>lua MiniBracketed.quickfix("backward")<CR>')

-- Conflict markers
utils.map('n', '<Leader>jx', '<Cmd>lua MiniBracketed.conflict("forward")<CR>')
utils.map('n', '<Leader>kx', '<Cmd>lua MiniBracketed.conflict("backward")<CR>')

-- Comment
utils.map('n', '<Leader>jc', '<Cmd>lua MiniBracketed.comment("forward")<CR>')
utils.map('n', '<Leader>kc', '<Cmd>lua MiniBracketed.comment("backward")<CR>')

-- Files
utils.map('n', '<Leader>jf', '<Cmd>lua MiniBracketed.file("forward")<CR>')
utils.map('n', '<Leader>kf', '<Cmd>lua MiniBracketed.file("backward")<CR>')

-- Yank
utils.map('n', '<Leader>jy', '<Cmd>lua MiniBracketed.yank("forward")<CR>')
utils.map('n', '<Leader>ky', '<Cmd>lua MiniBracketed.yank("backward")<CR>')

-- Tree-sitter node
utils.map('n', '<Leader>jt', '<Cmd>lua MiniBracketed.treesitter("forward")<CR>')
utils.map('n', '<Leader>kt', '<Cmd>lua MiniBracketed.treesitter("backward")<CR>')

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
utils.map('n', 'gd', '<Cmd>Telescope lsp_definitions<CR>')

-- Goto reFerences.
utils.map('n', 'gf', '<Cmd>Telescope lsp_references<CR>')

-- Goto Implementation.
utils.map('n', 'gi', '<Cmd>Telescope lsp_implementations<CR>')

-- Goto Hint
utils.map('n', 'gh', vim.lsp.buf.hover)

-- Code Actions.
utils.map('n', '<Leader>ca', vim.lsp.buf.code_action)
utils.map('v', '<Leader>ca', vim.lsp.buf.code_action)

-- Code symbol Rename.
utils.map('n', '<Leader>cr', vim.lsp.buf.rename)

-- Code file Symbols.
utils.map('n', '<Leader>cs', '<Cmd>Navbuddy<CR>', { desc = 'Toggle symbols Outline' })

-- Code Workspace symbols
utils.map(
    'n',
    '<Leader>cw',
    '<Cmd>lua require("telescope.builtin").lsp_dynamic_workspace_symbols({})<CR>'
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

-- Inspect the tree node at the current cursor position.
utils.map('n', '<Leader>ci', '<Cmd>Inspect<CR>')

-- Inspect the tree of the current buffer
utils.map('n', '<Leader>cI', '<Cmd>InspectTree<CR>')

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

-- Edit Snippets for current file type
utils.map('n', '<Leader>es', core_fns.edit_snippets)

-- Edit Other (edit file related to current one)
utils.map('n', '<Leader>eo', require('rmarganti.core.edit_other').edit_other)

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
utils.map('n', '<Leader>ft', '<Cmd>lua require("telescope.builtin").filetypes({})<CR>')

------------------------------------------------
--
-- Git
--
------------------------------------------------

-- Git Add current file
utils.map('n', '<Leader>ga', '<Cmd>Git add % <bar> lua vim.notify("Git added current file")<CR>')

-- Git checkOut current file
utils.map(
    'n',
    '<Leader>go',
    '<Cmd>Git checkout % <bar> e! % <bar> lua vim.notify("Git checked out current file")<CR>'
)

-- Git Commits
utils.map('n', '<Leader>gc', '<Cmd>Telescope git_commits<CR>')

-- Git History (commits for buffer)
utils.map('n', '<Leader>gh', '<Cmd>Telescope git_bcommits<CR>')

-- Git Branches
utils.map('n', '<Leader>gb', '<Cmd>Telescope git_branches<CR>')

-- Git Blame
utils.map('n', '<Leader>gB', '<Cmd>Git blame<CR>')

-- Git Status
utils.map('n', '<Leader>gs', '<Cmd>Telescope git_status<CR>')

-- Git bLame
utils.map('n', '<Leader>gl', '<Cmd>Git blame<CR>')

-- GitHub gists
utils.map('n', '<Leader>gg', '<Cmd>Telescope gh gist<CR>')

-- GitHub Pull Requests
utils.map('n', '<Leader>gp', '<Cmd>Telescope gh pull_request<CR>')

-- GitHub Notifications
utils.map(
    'n',
    '<Leader>gn',
    [[<Cmd>lua require("telescope").extensions.ghn.ghn({ layout_strategy = 'horizontal' })<CR>]]
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
utils.map('n', '<Leader>sr', '<Cmd>lua require("telescope").extensions.recent_files.pick()<CR>')

-- Search Text
utils.map('n', '<Leader>st', '<Cmd>Telescope live_grep<CR>')

-- Search Todos
utils.map('n', '<Leader>sT', '<Cmd>TodoTelescope<CR>')

-- Search Buffers
utils.map('n', '<Leader>sb', '<Cmd>Telescope buffers<CR>')

-- Search Wiki
utils.map('n', '<Leader>sw', function()
    require('telescope.builtin').find_files({
        hidden = true,
        search_dirs = { '~/vimwiki' },
    })
end)

-- Search Notifications
utils.map('n', '<Leader>sn', '<Cmd>Telescope notify<CR>')

-- Search Symbols
utils.map('n', '<Leader>ss', '<Cmd>Telescope symbols<CR>')

-- Search Commands
utils.map('n', '<Leader>sc', '<Cmd>Telescope commands<CR>')
utils.map('x', '<Leader>sc', '<Cmd>Telescope commands<CR>')

-- Search Help
utils.map('n', '<Leader>sh', '<Cmd>Telescope help_tags<CR>')
utils.map('x', '<Leader>sh', '<Cmd>Telescope help_tags<CR>')

-- Search Highlights
utils.map('n', '<Leader>sH', '<Cmd>Telescope highlights<CR>')
utils.map('x', '<Leader>sH', '<Cmd>Telescope highlights<CR>')

-- Search Resume
utils.map('n', '<Leader>s.', '<Cmd>Telescope resume<CR>')
utils.map('x', '<Leader>s.', '<Cmd>Telescope resume<CR>')

------------------------------------------------
--
-- Testing
--
------------------------------------------------

-- Run Tests for the whole File.
utils.map('n', '<Leader>tf', function()
    require('neotest').run.run(vim.fn.expand('%'))
end)

-- Run the Test that is Nearest.
utils.map('n', '<Leader>tn', function()
    require('neotest').run.run()
end)

-- Run the Last Test.
utils.map('n', '<Leader>tl', function()
    require('neotest').run.run_last()
end)

-- Toggle Test Summary.
utils.map('n', '<Leader>ts', function()
    require('neotest').summary.toggle()
end)

-- Show Test Output.
utils.map('n', '<Leader>to', function()
    require('neotest').output.open({ enter = false })
end)

-- Toggle Test Output panel.
utils.map('n', '<Leader>tO', function()
    require('neotest').output_panel.toggle()
end)

------------------------------------------------
--
-- Toggle (follows vim-unimpaired convention)
-- y = looks like switch. o = option.
--
------------------------------------------------

utils.map('n', 'yoq', core_fns.toggle_quickfix, { desc = 'Toggle Quick fix' })
utils.map('n', 'yof', core_fns.toggle_format_on_save, { desc = 'Toggle Format on save' })
utils.map('n', 'yoc', '<Cmd>ColorizerToggle<CR>', { desc = 'Toggle Colorizer' })
utils.map('n', 'yow', '<Cmd>setlocal wrap! wrap?<CR>', { desc = "Toggle 'wrap'" })

------------------------------------------------
--
-- Windows
--
------------------------------------------------

utils.map('n', '<C-h>', '<CMD>NavigatorLeft<CR>')
utils.map('n', '<C-l>', '<CMD>NavigatorRight<CR>')
utils.map('n', '<C-j>', '<CMD>NavigatorDown<CR>')
utils.map('n', '<C-k>', '<CMD>NavigatorUp<CR>')

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

-- Go Split (opposite of `J` for parameters)
utils.map('n', 'gJ', '<Cmd>TSJToggle<CR>')

-- Jump to character in current window.
utils.map('n', '<Leader><Leader>', '<Cmd>HopChar1<CR>')

-- Add line below
utils.map('n', 'go', "<Cmd>call append(line('.'), repeat([''], v:count1))<CR>")

-- Add line above
utils.map('n', 'gO', "<Cmd>call append(line('.') - 1, repeat([''], v:count1))<CR>")
