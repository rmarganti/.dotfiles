------------------------------------------------
--
-- Theme.
--
------------------------------------------------

vim.opt.showtabline = 2
vim.opt.laststatus = 2

if vim.fn.exists('+termguicolors') == 1 then
    vim.opt.termguicolors = true
end

------------------------------------------------
--
-- General Settings.
--
------------------------------------------------

-- Show menus in UTF-8
vim.opt.encoding = 'utf-8'

-- Set to auto read when a file is changed from the outside
vim.opt.autoread = true

-- Make backspace behave like every other editor.
vim.opt.backspace = 'indent,eol,start'

-- Show relative line numbers.
vim.opt.number = true
vim.opt.relativenumber = true

-- Allow modified buffers to be hidden.
vim.opt.hidden = true

-- Enhanced tab-completion for commands.
vim.opt.wildmenu = true

-- Ignore compiled files, etc.
-- vim.opt.wildignore=*.o,*~,*.pyc
-- if has("win16") || has("win32")
--     set wildignore+=.git\*,.hg\*,.svn\*
-- else
--     set wildignore+=*/.git/*,*/.hg/*,*/.svn/*,*/.DS_Store
-- endif

-- Don't wrap lines.
vim.opt.wrap = false

-- Disable backups, swaps, etc.
vim.opt.backup = false
vim.opt.swapfile = false

-- Increase timeout for mapped key sequences.
vim.opt.timeoutlen = 2000

-- Update UI more often.
vim.opt.updatetime = 300

-- Preview %s commands as you type them.
vim.opt.inccommand = 'nosplit'

-- Always show sign column
vim.opt.signcolumn = 'yes'

-- Always show at least 2 lines above/below the cursor.
vim.opt.scrolloff=5

-- Always show at least 5 columns to the left/right the cursor.
vim.opt.sidescrolloff=10

-- Highlight the current line. 
vim.opt.cursorline = true


------------------------------------------------
--
-- Text search, tabs, indents.
--
------------------------------------------------

-- Highlight Search
vim.opt.hlsearch = true

-- Incremental Search
vim.opt.incsearch = true

-- Show existing tab with 4 spaces width
vim.opt.tabstop = 4

-- When indenting with '>', use 4 spaces width
vim.opt.shiftwidth = 4

-- On pressing tab, insert 4 spaces
vim.opt.expandtab = true

-- Be smart, obviously.
vim.opt.smarttab = true

-- Auto indent, smart indent
vim.opt.autoindent = true
vim.opt.smartindent = true


------------------------------------------------
--
-- Splits.
--
------------------------------------------------

vim.opt.splitbelow = true
vim.opt.splitright = true
