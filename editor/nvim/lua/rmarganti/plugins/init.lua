------------------------------------------------
--
-- Packer bootsrap.
--
------------------------------------------------

local packer_path = vim.fn.stdpath('data') .. '/site/pack/packer/opt/packer.nvim'

if vim.fn.empty(vim.fn.glob(packer_path)) > 0 then
    vim.fn.system({
        'git',
        'clone',
        'https://github.com/wbthomason/packer.nvim',
        packer_path,
    })
end

-- Load packer
vim.cmd([[ packadd packer.nvim ]])
local packer = require('packer')

-- Change some defaults
packer.init({
    git = {
        clone_timeout = 300, -- 5 mins
    },
    profile = {
        enable = true,
    },
})

packer.startup(function(use)
    --------------------------------
    -- Essentials
    --------------------------------

    -- Plugins manager
    use({
        'wbthomason/packer.nvim',
        opt = true,
    })

    -- Tree-Sitter
    use({
        'nvim-treesitter/nvim-treesitter',
        config = function()
            require('rmarganti.plugins.config.treesitter').config()
        end,
        run = ':TSUpdate',
        event = 'BufWinEnter',
    })

    use({
        'nvim-treesitter/playground',
        after = 'nvim-treesitter',
    })

    use({
        'nvim-treesitter/nvim-treesitter-textobjects',
        after = 'nvim-treesitter',
    })

    --------------------------------
    -- Theme/UI
    --------------------------------

    -- Delete buffers without affecting layout of windows.
    use({
        'ojroques/nvim-bufdel',
        event = 'BufWinEnter',
        config = function()
            require('bufdel').setup({ quit = false })
        end,
    })

    -- File explorer.
    use({
        'kevinhwang91/rnvimr',
        setup = function()
            require('rmarganti.plugins.config.rnvimr').setup()
        end,
    })

    -- Tabs.
    use({
        'akinsho/bufferline.nvim',
        requires = { 'kyazdani42/nvim-web-devicons' },
        config = function()
            require('rmarganti.plugins.config.bufferline').config()
        end,
        event = 'BufWinEnter',
    })

    -- Status line.
    use({
        'feline-nvim/feline.nvim',
        config = function()
            require('rmarganti.plugins.config.feline').config()
        end,
        requires = { 'kyazdani42/nvim-web-devicons' },
        after = 'nvim-navic',
    })

    -- Show lines where tabs are.
    use({
        'lukas-reineke/indent-blankline.nvim',
        config = function()
            require('indent_blankline').setup({
                filetype_exclude = { 'alpha' },
            })
        end,
    })

    -- Support VIM's `popup_*` APIs. Will likely
    -- be merged into Neovim at some point.
    use({
        'nvim-lua/popup.nvim',
        module = 'popup',
    })

    -- Replaces `vim.ui.{input,select}`.
    use({
        'stevearc/dressing.nvim',
        config = function()
            require('rmarganti.plugins.config.dressing').config()
        end,
    })

    -- Replaces `vim.notify`.
    use({
        'rcarriga/nvim-notify',
        config = function()
            require('rmarganti.plugins.config.nvim-notify').config()
        end,
    })

    -- Resize windows based on focus.
    use({
        'beauwilliams/focus.nvim',
        config = function()
            require('rmarganti.plugins.config.focus').config()
        end,
    })

    -- Dim inactive windows.
    use({
        'levouh/tint.nvim',
        config = function()
            require('rmarganti.plugins.config.tint').config()
        end,
        event = 'BufWinEnter',
    })

    --------------------------------
    -- Git
    --------------------------------

    -- Used to power feline git functionality.
    use({
        'lewis6991/gitsigns.nvim',
        config = function()
            require('rmarganti.plugins.config.gitsigns').config()
        end,
        event = 'BufWinEnter',
    })

    -- Show GitHub notification count in status line.
    use({
        'rlch/github-notifications.nvim',
        config = function()
            require('rmarganti.plugins.config.github-notifications').config()
        end,
        module = 'github-notifications',
    })

    -- Git diffs/commands.
    use({
        'tpope/vim-fugitive',
        event = 'BufWinEnter',
    })

    --------------------------------
    -- LSP
    --------------------------------

    -- Common LSP configs.
    use({
        'neovim/nvim-lspconfig',
        event = 'BufWinEnter',
    })

    -- Adds JSON schemas support for jsonls.
    use({
        'b0o/schemastore.nvim',
        after = 'cmp-nvim-lsp',
    })

    -- Language server for linters, formatters, etc.
    use({
        'jose-elias-alvarez/null-ls.nvim',
        config = function()
            require('rmarganti.plugins.config.null-ls').config()
        end,
        after = 'schemastore.nvim',
    })

    -- Install LSP servers, DAP, linters, etc.
    use({
        'williamboman/mason.nvim',
        config = function()
            require('rmarganti.plugins.config.lsp').config()
        end,
        after = 'mason-lspconfig.nvim',
    })

    use({
        'williamboman/mason-lspconfig.nvim',
        after = 'null-ls.nvim',
    })

    use({
        'simrat39/rust-tools.nvim',
        after = 'mason.nvim',
        config = function()
            require('rmarganti.plugins.config.rust-tools').config()
        end,
    })

    -- Show function signature as you type.
    use({
        'ray-x/lsp_signature.nvim',
        event = 'InsertEnter',
        config = function()
            require('rmarganti.plugins.config.lsp_signature').config()
        end,
    })

    -- Adds icons to auto-complete.
    use({
        'onsails/lspkind-nvim',
        config = function()
            require('rmarganti.plugins.config.lspkind').config()
        end,
        after = 'nvim-lspconfig',
    })

    -- Symbol tree panel.
    use({ 'simrat39/symbols-outline.nvim' })

    -- AI code-completion.
    use({
        'zbirenbaum/copilot.lua',
        event = 'VimEnter',
        config = function()
            vim.defer_fn(function()
                require('copilot').setup()
            end, 100)
        end,
    })


    -- Code completion.
    use({
        'hrsh7th/nvim-cmp',
        config = function()
            require('rmarganti.plugins.config.cmp').config()
        end,
        after = 'LuaSnip',
    })

    -- Completion sources.
    use({ 'hrsh7th/cmp-nvim-lsp', after = 'lspkind-nvim' }) -- Loaded earlier for capabilities.
    use({ 'hrsh7th/cmp-buffer', after = 'nvim-cmp' })
    use({ 'hrsh7th/cmp-path', after = 'nvim-cmp' })
    use({ 'hrsh7th/cmp-nvim-lua', after = 'nvim-cmp' })
    use({ 'saadparwaiz1/cmp_luasnip', after = 'nvim-cmp' })
    use({
        'zbirenbaum/copilot-cmp',
        after = { 'copilot.lua' },
        config = function()
            require('copilot_cmp').setup()
        end,
    })

    -- Snippets.
    use({
        'L3MON4D3/LuaSnip',
        after = 'friendly-snippets',
        config = function()
            require('luasnip.loaders.from_vscode').lazy_load()
        end,
    })

    use({
        'rafamadriz/friendly-snippets',
        event = { 'InsertEnter', 'CmdlineEnter' },
    })

    --------------------------------
    -- Code Specific
    --------------------------------

    -- Easily comment/uncomment code.
    use({
        'numToStr/Comment.nvim',
        config = function()
            require('Comment').setup({
                ignore = '^$',
            })
        end,
        event = 'BufWinEnter',
    })

    -- Auto-close brackets, etc.
    use({
        'windwp/nvim-autopairs',
        after = 'nvim-cmp',
        config = function()
            require('rmarganti.plugins.config.nvim-autopairs').config()
        end,
    })

    -- Run tests.
    use({
        'rcarriga/vim-ultest',
        requires = { 'vim-test/vim-test' },
        run = ':UpdateRemotePlugins',
        event = 'BufWinEnter',
        setup = function()
            vim.g.ultest_deprecation_notice = 0
        end,
    })

    -- Show light bulb icon when code action is available.
    use({
        'kosayoda/nvim-lightbulb',
        event = 'BufWinEnter',
        config = function()
            require('rmarganti.plugins.config.lightbulb').config()
        end,
    })

    -- Preview CSS colors.
    use({
        'norcalli/nvim-colorizer.lua',
        event = 'BufWinEnter',
        config = function()
            require('colorizer').setup()
        end,
    })

    -- Split function parameters into multiple lines (opposite of `J`).
    use({
        'AckslD/nvim-trevJ.lua',
        event = 'BufWinEnter',
    })

    -- Provide code tree breadcrumbs.
    use({
        'SmiteshP/nvim-navic',
        after = 'gitsigns.nvim',
    })

    --------------------------------
    -- Text manipulation
    --------------------------------

    -- Quickly surround text with brackets, quotes, etc.
    use({
        'tpope/vim-surround',
        event = 'BufWinEnter',
    })

    -- Easily replace with contents of register.
    use({
        'vim-scripts/ReplaceWithRegister',
        event = 'BufWinEnter',
    })

    -- Code spell-checking.
    use({
        'kamykn/spelunker.vim',
        setup = function()
            vim.g.spelunker_check_type = 2
            vim.g.spelunker_spell_bad_group = 'SpellBad'
            vim.g.spelunker_complex_or_compound_word_group = 'SpellBad'
        end,
        requires = {
            {
                'kamykn/popup-menu.nvim',
                event = 'BufWinEnter',
            },
        },
        event = 'BufWinEnter',
    })

    --------------------------------
    -- Utility
    --------------------------------

    -- Various utility functions.
    use({
        'nvim-lua/plenary.nvim',
        module = 'plenary',
    })

    --------------------------------
    -- Telescope
    --------------------------------

    -- Find, Filter, Preview,Pick
    use({
        'nvim-telescope/telescope.nvim',
        cmd = 'Telescope',
        module = 'telescope',
        config = function()
            require('rmarganti.plugins.config.telescope').config()
        end,
    })

    -- Use FZF for filtering.
    use({
        'nvim-telescope/telescope-fzf-native.nvim',
        run = 'make',
        after = 'telescope.nvim',
        config = function()
            require('rmarganti.plugins.config.telescope-fzf-native').config()
        end,
    })

    -- Telescope plugins for GitHub issues, pull requests, gists, workflow runs.
    use({
        'nvim-telescope/telescope-github.nvim',
        after = 'telescope.nvim',
        config = function()
            require('rmarganti.plugins.config.telescope-github').config()
        end,
    })

    -- Search text symbols (emoji, unicode).
    use({
        'nvim-telescope/telescope-symbols.nvim',
        after = 'telescope.nvim',
    })

    -- Like oldfiles, but includes files edited in current session.
    use({
        'smartpde/telescope-recent-files',
        after = 'telescope.nvim',
    })

    --------------------------------
    -- Misc
    --------------------------------

    -- Create mini-modes with their own set of key bindings.
    use({
        'anuvyklack/hydra.nvim',
        config = function()
            require('rmarganti.plugins.config.hydra').config()
        end,
        requires = 'anuvyklack/keymap-layer.nvim', -- needed only for pink hydras
        after = 'gitsigns.nvim',
    })

    -- Sugar for file operations (rename, move, etc.).
    use({
        'tpope/vim-eunuch',
        event = 'BufWinEnter',
    })

    --  Random shortcuts that typically work in pairs.
    use({
        'tpope/vim-unimpaired',
        event = 'BufWinEnter',
    })

    -- Make more things repeatable.
    use({
        'tpope/vim-repeat',
        event = 'BufWinEnter',
    })

    -- Quickly jump elsewhere in window.
    use({
        'phaazon/hop.nvim',
        config = function()
            require('rmarganti.plugins.config.hop').config()
        end,
        event = 'BufWinEnter',
    })

    -- Maintain a person wiki.
    use({
        'vimwiki/vimwiki',
        setup = function()
            vim.g.vimwiki_list = {
                {
                    path = '~/vimwiki/',
                    syntax = 'markdown',
                    ext = '.md',
                },
            }
        end,
    })

    -- Markdown preview.
    use({
        'iamcco/markdown-preview.nvim',
        run = function()
            vim.fn['mkdp#util#install']()
        end,
    })

    -- Heuristically set buffer options.
    use({
        'tpope/vim-sleuth',
        event = 'BufWinEnter',
    })
end)
