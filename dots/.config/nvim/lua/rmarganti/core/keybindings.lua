local core_fns = require('rmarganti.core.functions')

-- Set <Space> as the leader key.
vim.keymap.set('n', '<Space>', '<Nop>')
vim.g.mapleader = ' '

------------------------------------------------
-- Disables
------------------------------------------------

-- Disable accidentally pressing ctrl-z and suspending
vim.keymap.set('n', '<c-z>', '<Nop>')

-- Disable ex mode
vim.keymap.set('n', 'Q', '<Nop>')

------------------------------------------------
-- Jump to next/prev
------------------------------------------------

-- Diagnostics (minimum WARN level)
vim.keymap.set('n', '<Leader>jd', function()
    vim.diagnostic.goto_next({
        float = { border = 'rounded' },
        severity = { min = vim.diagnostic.severity.WARN },
    })
end)
vim.keymap.set('n', '<Leader>kd', function()
    vim.diagnostic.goto_prev({
        float = { border = 'rounded' },
        severity = { min = vim.diagnostic.severity.WARN },
    })
end)

-- Diagnostics (INFO + HINT levels)
vim.keymap.set('n', '<Leader>ji', function()
    vim.diagnostic.goto_next({
        float = { border = 'rounded' },
        severity = {
            vim.diagnostic.severity.HINT,
            vim.diagnostic.severity.INFO,
        },
    })
end)
vim.keymap.set('n', '<Leader>ki', function()
    vim.diagnostic.goto_prev({
        float = { border = 'rounded' },
        severity = {
            vim.diagnostic.severity.HINT,
            vim.diagnostic.severity.INFO,
        },
    })
end)

-- Quickfix
vim.keymap.set('n', '<Leader>jq', '<Cmd>lua MiniBracketed.quickfix("forward")<CR>')
vim.keymap.set('n', '<Leader>kq', '<Cmd>lua MiniBracketed.quickfix("backward")<CR>')

-- Conflict markers
vim.keymap.set('n', '<Leader>jx', '<Cmd>lua MiniBracketed.conflict("forward")<CR>')
vim.keymap.set('n', '<Leader>kx', '<Cmd>lua MiniBracketed.conflict("backward")<CR>')

-- Comment
vim.keymap.set('n', '<Leader>jc', '<Cmd>lua MiniBracketed.comment("forward")<CR>')
vim.keymap.set('n', '<Leader>kc', '<Cmd>lua MiniBracketed.comment("backward")<CR>')

-- Files
vim.keymap.set('n', '<Leader>jf', '<Cmd>lua MiniBracketed.file("forward")<CR>')
vim.keymap.set('n', '<Leader>kf', '<Cmd>lua MiniBracketed.file("backward")<CR>')

-- Yank
vim.keymap.set('n', '<Leader>jy', '<Cmd>lua MiniBracketed.yank("forward")<CR>')
vim.keymap.set('n', '<Leader>ky', '<Cmd>lua MiniBracketed.yank("backward")<CR>')

-- Tree-sitter node
vim.keymap.set('n', '<Leader>jt', '<Cmd>lua MiniBracketed.treesitter("forward")<CR>')
vim.keymap.set('n', '<Leader>kt', '<Cmd>lua MiniBracketed.treesitter("backward")<CR>')

------------------------------------------------
-- AI Sidekick
------------------------------------------------

-- Sidekick Next Edit Suggestions - Jump to or Apply
vim.keymap.set({ 'n', 'i' }, '<Tab>', function()
    -- if there is a next edit, jump to it, otherwise apply it if any
    if not require('sidekick').nes_jump_or_apply() then
        return '<Tab>' -- fallback to normal tab
    end
end, { expr = true, desc = 'Goto/Apply Next Edit Suggestion' })

-- Sidekick CLI - Select Tool
vim.keymap.set('n', '<Leader>as', function()
    require('sidekick.cli').select()
end, { desc = 'AI Select CLI tool' })

-- Sidekick CLI - Send Context
vim.keymap.set({ 'x', 'n' }, '<Leader>at', function()
    require('sidekick.cli').send({ msg = '{this}' })
end, { desc = 'AI Send This' })

vim.keymap.set('n', '<Leader>af', function()
    require('sidekick.cli').send({ msg = '{file}' })
end, { desc = 'AI Send File' })

vim.keymap.set('x', '<Leader>av', function()
    require('sidekick.cli').send({ msg = '{selection}' })
end, { desc = 'AI Send Visual Selection' })

-- Sidekick CLI - Select Prompt
vim.keymap.set({ 'n', 'x' }, '<Leader>ap', function()
    require('sidekick.cli').prompt()
end, { desc = 'AI Select Prompt' })

-- Sidekick NES - Clear Suggestions
vim.keymap.set('n', '<Leader>ac', function()
    require('sidekick.nes').clear()
end, { desc = 'AI Clear NES' })

-- Sidekick NES - Toggle
vim.keymap.set('n', '<Leader>aT', function()
    require('sidekick.nes').toggle()
end, { desc = 'AI Toggle NES' })

------------------------------------------------
-- Buffers
------------------------------------------------

-- See hydra.lua

------------------------------------------------
-- Code & LSP
------------------------------------------------

-- Code completion.
-- NOTE: These are set in 'lua/rmarganti/plugins/config/cmp.lua'

-- Goto Definition.
vim.keymap.set('n', 'gd', '<Cmd>Telescope lsp_definitions<CR>')

-- Goto reFerences.
vim.keymap.set('n', 'gf', '<Cmd>Telescope lsp_references<CR>')

-- Goto Implementation.
vim.keymap.set('n', 'gi', '<Cmd>Telescope lsp_implementations<CR>')

-- Goto Hint
vim.keymap.set('n', 'gh', vim.lsp.buf.hover)

-- Code Actions.
vim.keymap.set({ 'n', 'v' }, '<Leader>ca', vim.lsp.buf.code_action)

vim.keymap.set('n', '<Leader>cd', function()
    vim.diagnostic.open_float({ border = 'rounded' })
end)

-- Code symbol Rename.
vim.keymap.set('n', '<Leader>cr', vim.lsp.buf.rename)

-- Code file Symbols.
vim.keymap.set(
    'n',
    '<Leader>cs',
    '<Cmd>Telescope lsp_document_symbols<CR>',
    { desc = 'Toggle symbols Outline' }
)

-- Code Workspace symbols
vim.keymap.set(
    'n',
    '<Leader>cw',
    '<Cmd>lua require("telescope.builtin").lsp_dynamic_workspace_symbols({})<CR>'
)

-- Code Format
vim.keymap.set({ 'n', 'v' }, '<Leader>cf', function()
    core_fns.format(false)
end)

-- Code eslint Fix all
vim.keymap.set('n', '<Leader>cF', '<Cmd>EslintFixAll<CR>')

-- Code Organize imports
vim.keymap.set('n', '<Leader>co', function()
    -- Typescript organize imports code action
    vim.lsp.buf.code_action({
        apply = true,
        context = {
            only = { 'source.organizeImports' },
        },
        filter = function(action)
            return action.title == 'Organize Imports'
        end,
    })
end)

-- Code Capture screenshot
vim.keymap.set('n', '<Leader>cc', function()
    require('silicon').visualise_api({ show_buf = true })
end)

-- Code Capture screenshot
vim.keymap.set('v', '<Leader>cc', function()
    require('silicon').visualise_api({})
end)

-- Inspect the tree node at the current cursor position.
vim.keymap.set('n', '<Leader>ci', '<Cmd>Inspect<CR>')

-- Inspect the tree of the current buffer
vim.keymap.set('n', '<Leader>cI', '<Cmd>InspectTree<CR>')

-- Restart LSP
vim.keymap.set('n', '<Leader>cR', function()
    vim.cmd('LspRestart')
    vim.diagnostic.reset()
end)

-- Reset LSP Diagnostics
vim.keymap.set('n', '<Leader>cD', vim.diagnostic.reset)

------------------------------------------------
-- Edit
------------------------------------------------

-- Edit Nearest (with prompt)
vim.keymap.set('n', '<Leader>en', core_fns.edit_nearest)

-- Edit nearest Changelog
vim.keymap.set('n', '<Leader>ec', function()
    core_fns.edit_nearest('CHANGELOG.md')
end)

-- Edit nearest Composer.json
vim.keymap.set('n', '<Leader>eC', function()
    core_fns.edit_nearest('composer.json')
end)

-- Edit nearest Env
vim.keymap.set('n', '<Leader>ee', function()
    core_fns.edit_nearest('.env')
end)

-- Edit nearest Index.ts
vim.keymap.set('n', '<Leader>ei', function()
    core_fns.edit_nearest('index.ts')
end)

-- Edit nearest package.json
vim.keymap.set('n', '<Leader>ep', function()
    core_fns.edit_nearest('package.json')
end)

-- Edit nearest project.json
vim.keymap.set('n', '<Leader>eP', function()
    core_fns.edit_nearest('project.json')
end)

-- Edit nearest Readme
vim.keymap.set('n', '<Leader>er', function()
    core_fns.edit_nearest('README.md')
end)

-- Edit nearest cArgo.toml
vim.keymap.set('n', '<Leader>ea', function()
    core_fns.edit_nearest('Catgo.toml')
end)

-- Edit Snippets for current file type
vim.keymap.set('n', '<Leader>es', core_fns.edit_snippets)

-- Edit Other (edit file related to current one)
vim.keymap.set('n', '<Leader>eo', require('rmarganti.core.edit_other').edit_other)

------------------------------------------------
-- Files
------------------------------------------------

-- File Edit. Pre-populates the current directory.
vim.keymap.set('n', '<Leader>fe', ':e <C-R>=expand("%:p:h") . "/" <CR>', { silent = false })

-- File Copy
vim.keymap.set('n', '<Leader>fc', ':saveas <C-R>=expand("%:p")<CR>', { silent = false })

-- File Delete
vim.keymap.set('n', '<Leader>fd', ':Delete!', { silent = false })

-- File Move
vim.keymap.set('n', '<Leader>fm', ':Move <C-R>=expand("%:p")<CR>', { silent = false })

-- File Rename
vim.keymap.set('n', '<Leader>fr', ':Rename <C-R>=expand("%:t")<CR>', { silent = false })

-- File Write
vim.keymap.set('n', '<Leader>fw', function()
    vim.cmd('write')
    vim.notify('File saved')
end)

-- File eXplore
vim.keymap.set('n', '<Leader>fx', function()
    require('lf').start({
        height = vim.fn.float2nr(vim.o.lines - 10),
        width = vim.fn.float2nr(vim.o.columns - 18),
    })
end)

-- File Types
vim.keymap.set('n', '<Leader>ft', '<Cmd>lua require("telescope.builtin").filetypes({})<CR>')

------------------------------------------------
-- Git
------------------------------------------------

-- Git Add current file
vim.keymap.set(
    'n',
    '<Leader>ga',
    '<Cmd>Git add % <bar> lua vim.notify("Git added current file")<CR>'
)

-- Git checkOut current file
vim.keymap.set(
    'n',
    '<Leader>go',
    '<Cmd>Git checkout % <bar> e! % <bar> lua vim.notify("Git checked out current file")<CR>'
)

-- Git Commits
vim.keymap.set('n', '<Leader>gc', '<Cmd>Telescope git_commits<CR>')

-- Git History (commits for buffer)
vim.keymap.set('n', '<Leader>gh', '<Cmd>Telescope git_bcommits<CR>')

-- Git Branches
vim.keymap.set('n', '<Leader>gb', '<Cmd>Telescope git_branches<CR>')

-- Git Blame
vim.keymap.set('n', '<Leader>gB', '<Cmd>Git blame<CR>')

-- Git Status
vim.keymap.set('n', '<Leader>gs', '<Cmd>Telescope git_status<CR>')

-- Git bLame
vim.keymap.set('n', '<Leader>gl', '<Cmd>Git blame<CR>')

-- GitHub gists
vim.keymap.set('n', '<Leader>gg', '<Cmd>Telescope gh gist<CR>')

-- GitHub Pull Requests
vim.keymap.set('n', '<Leader>gp', '<Cmd>Telescope gh pull_request<CR>')

-- GitHub Notifications
vim.keymap.set(
    'n',
    '<Leader>gn',
    [[<Cmd>lua require("telescope").extensions.ghn.ghn({ layout_strategy = 'horizontal' })<CR>]]
)

-- GitHub browse Repo
vim.keymap.set('n', '<Leader>ghr', function()
    vim.fn.system('gh browse &')
end)

-- GitHub browse File on Main
vim.keymap.set({ 'n', 'v' }, '<Leader>ghfm', function()
    local file = vim.fn.expand('%:.')
    local start_row = vim.fn.line('.')
    local end_row = vim.fn.line('v')
    if start_row > end_row then
        start_row, end_row = end_row, start_row
    end
    local range = start_row == end_row and start_row or (start_row .. '-' .. end_row)
    vim.fn.system('gh browse ' .. file .. ':' .. range .. ' &')
end)

-- GitHub browse File at Commit
vim.keymap.set({ 'n', 'v' }, '<Leader>ghfc', function()
    local file = vim.fn.expand('%:.')
    local start_row = vim.fn.line('.')
    local end_row = vim.fn.line('v')
    if start_row > end_row then
        start_row, end_row = end_row, start_row
    end
    local range = start_row == end_row and start_row or (start_row .. '-' .. end_row)
    local commit = vim.fn.system('git rev-parse HEAD'):gsub('\n', '')
    vim.fn.system('gh browse ' .. file .. ':' .. range .. ' --commit=' .. commit .. ' &')
end)

------------------------------------------------
-- Yank file name, path
------------------------------------------------

-- Yank File name to system clipboard.
vim.keymap.set('n', '<Leader>yf', ':let @+ = expand("%:t")<CR>')

-- Yank file Absolute path to system clipboard.
vim.keymap.set('n', '<Leader>ya', ':let @+ = expand("%:p")<CR>')

-- Yank file Relative path to system clipboard.
vim.keymap.set('n', '<Leader>yr', ':let @+ = expand("%:.")<CR>')

------------------------------------------------
-- Search
------------------------------------------------

-- Search Files
vim.keymap.set({ 'n', 'x' }, '<Leader>sf', function()
    require('telescope.builtin').find_files({ hidden = true })
end)

-- Search Directory Files
vim.keymap.set({ 'n', 'x' }, '<Leader>sdf', function()
    require('telescope').extensions.dir.find_files()
end)

-- Search Recent files
vim.keymap.set(
    { 'n', 'x' },
    '<Leader>sr',
    '<Cmd>lua require("telescope").extensions.recent_files.pick()<CR>'
)

-- Search Buffers
vim.keymap.set({ 'n', 'x' }, '<Leader>sb', '<Cmd>Telescope buffers<CR>')

-- Search Text
vim.keymap.set({ 'n', 'x' }, '<Leader>st', '<Cmd>Telescope live_grep<CR>')

-- Search Directory Text
vim.keymap.set({ 'n', 'x' }, '<Leader>sdt', function()
    require('telescope').extensions.dir.live_grep()
end)

-- Search Todos
vim.keymap.set({ 'n', 'x' }, '<Leader>sT', '<Cmd>TodoTelescope<CR>')

-- Search Wiki
vim.keymap.set({ 'n', 'x' }, '<Leader>sw', '<Cmd>ObsidianQuickSwitch<CR>')

-- Search Notifications
vim.keymap.set({ 'n', 'x' }, '<Leader>sn', '<Cmd>Telescope notify<CR>')

-- Search Symbols
vim.keymap.set({ 'n', 'x' }, '<Leader>ss', '<Cmd>Telescope symbols<CR>')

-- Search Commands
vim.keymap.set({ 'n', 'x' }, '<Leader>sc', '<Cmd>Telescope commands<CR>')

-- Search Help
vim.keymap.set({ 'n', 'x' }, '<Leader>sh', '<Cmd>Telescope help_tags<CR>')

-- Search Highlights
vim.keymap.set({ 'n', 'x' }, '<Leader>sH', '<Cmd>Telescope highlights<CR>')

-- Search Key maps
vim.keymap.set({ 'n', 'x' }, '<Leader>sk', '<Cmd>Telescope keymaps<CR>')

-- Search Resume
vim.keymap.set({ 'n', 'x' }, '<Leader>s.', '<Cmd>Telescope resume<CR>')

------------------------------------------------
-- Testing
------------------------------------------------

-- Run Tests for the whole File.
vim.keymap.set('n', '<Leader>tf', function()
    require('neotest').run.run(vim.fn.expand('%'))
end)

-- Run the Test that is Nearest.
vim.keymap.set('n', '<Leader>tn', function()
    require('neotest').run.run()
end)

-- Run the Last Test.
vim.keymap.set('n', '<Leader>tl', function()
    require('neotest').run.run_last()
end)

-- Toggle Test Summary.
vim.keymap.set('n', '<Leader>ts', function()
    require('neotest').summary.toggle()
end)

-- Show Test Output.
vim.keymap.set('n', '<Leader>to', function()
    require('neotest').output.open({ enter = false })
end)

-- Toggle Test Output panel.
vim.keymap.set('n', '<Leader>tO', function()
    require('neotest').output_panel.toggle()
end)

------------------------------------------------
-- Toggle (follows vim-unimpaired convention)
-- y = looks like switch. o = option.
------------------------------------------------

vim.keymap.set('n', 'yoq', core_fns.toggle_quickfix, { desc = 'Toggle Quick fix' })
vim.keymap.set('n', 'yof', core_fns.toggle_format_on_save, { desc = 'Toggle Format on save' })
vim.keymap.set(
    'n',
    'yoc',
    '<Cmd>HighlightColors Toggle<CR>',
    { desc = 'Toggle Color highlighting' }
)
vim.keymap.set('n', 'yow', '<Cmd>setlocal wrap! wrap?<CR>', { desc = "Toggle 'wrap'" })
vim.keymap.set('n', 'yoo', '<Cmd>AerialToggle right<CR>', { desc = 'Toggle Outline' })

------------------------------------------------
-- Windows
------------------------------------------------

vim.keymap.set({ 'n', 'x' }, '<C-h>', '<CMD>NavigatorLeft<CR>')
vim.keymap.set({ 'n', 'x' }, '<C-l>', '<CMD>NavigatorRight<CR>')
vim.keymap.set({ 'n', 'x' }, '<C-j>', '<CMD>NavigatorDown<CR>')
vim.keymap.set({ 'n', 'x' }, '<C-k>', '<CMD>NavigatorUp<CR>')

-- See hydra.lua for more Window mappings.

------------------------------------------------
-- Obsidian.nvim
------------------------------------------------

vim.keymap.set('n', '<Leader>oy', ':ObsidianYesterday<CR>', { desc = 'Obsidian Yesterday' })
vim.keymap.set('n', '<Leader>ot', ':ObsidianToday<CR>', { desc = 'Obsidian Today' })
vim.keymap.set('n', '<Leader>on', ':ObsidianNew<CR>', { desc = 'Obsidian New' })
vim.keymap.set('n', '<Leader>oo', ':ObsidianOpen<CR>', { desc = 'Obsidian Open' })
vim.keymap.set('n', '<Leader>oq', ':ObsidianQuickSwitch<CR>', { desc = 'Obsidian Quick switch' })
vim.keymap.set('n', '<Leader>or', ':ObsidianRename<CR>', { desc = 'Obsidian Rename' })
vim.keymap.set('n', '<Leader>os', ':ObsidianSearch<CR>', { desc = 'Obsidian Search' })
vim.keymap.set('n', '<Leader>oT', ':ObsidianTags<CR>', { desc = 'Obsidian Tags' })

------------------------------------------------
-- Misc
------------------------------------------------

-- Clear search highlight
vim.keymap.set('n', '<Esc>', ':nohlsearch<CR>')

-- Quit
vim.keymap.set('n', '<Leader>qq', ':qa<CR>')

-- Force close all buffers and Quit
vim.keymap.set('n', '<Leader>qQ', ':qa!<CR>')

-- Go Split (opposite of `J` for parameters)
vim.keymap.set('n', 'gJ', '<Cmd>TSJToggle<CR>')

-- Jump to character in current window.
vim.keymap.set({ 'n', 'x', 'o' }, '<Leader><Leader>', function()
    local MiniJump2d = require('mini.jump2d')
    MiniJump2d.start(MiniJump2d.builtin_opts.single_character)
end)

-- Add line below
vim.keymap.set('n', 'go', "<Cmd>call append(line('.'), repeat([''], v:count1))<CR>")

-- Add line above
vim.keymap.set('n', 'gO', "<Cmd>call append(line('.') - 1, repeat([''], v:count1))<CR>")
