------------------------------------------------
--
-- Theme.
--
------------------------------------------------

vim.opt.laststatus = 3 -- use global status bar

if vim.fn.exists('+termguicolors') == 1 then
    vim.opt.termguicolors = true
end

------------------------------------------------
--
-- General Settings.
--
------------------------------------------------

-- Disable mouse.
vim.opt.mouse = ''

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

-- Don't wrap lines.
vim.opt.wrap = false

-- When wrap is enabled, only break at white space.
vim.opt.linebreak = true

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
vim.opt.scrolloff = 5

-- Always show at least 5 columns to the left/right the cursor.
vim.opt.sidescrolloff = 10

-- Highlight the current line.
vim.opt.cursorline = true

-- Max height for completion menu
vim.opt.pumheight = 20

-- What hidden characters to show
vim.opt.list = true

-- Once bufferline is loaded, it will re-enable this.
vim.opt.showtabline = 0

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

-- Hitting <CR> carries the current line's indentation to the next.
vim.opt.autoindent = true

-- When hitting <CR>, adjust indentation based on the current line's contents.
vim.opt.smartindent = true

------------------------------------------------
--
-- Splits.
--
------------------------------------------------

vim.opt.splitbelow = true
vim.opt.splitright = true

------------------------------------------------
--
-- Terminal.
--
------------------------------------------------

vim.opt.scrollback = 100000
