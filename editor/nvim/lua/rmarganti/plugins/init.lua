------------------------------------------------
--
-- Packer bootsrap.
--
------------------------------------------------

local packer_path = vim.fn.stdpath('data')
    .. '/site/pack/packer/opt/packer.nvim'

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
            require('rmarganti.plugins.config.treesitter').setup()
        end,
        run = ':TSUpdate',
        event = 'BufWinEnter',
    })

    use({
        'nvim-treesitter/nvim-treesitter-textobjects',
        after = 'nvim-treesitter',
    })

    use({
        'RRethy/nvim-treesitter-textsubjects',
        after = 'nvim-treesitter',
    })

    --------------------------------
    -- Theme/UI
    --------------------------------

    use({
        'sainnhe/everforest',
        config = function()
            require('rmarganti.plugins.config.everforest').setup()
        end,
    })

    use({
        'ojroques/nvim-bufdel',
        event = 'BufWinEnter',
        config = function()
            require('bufdel').setup({ quit = false })
        end
    })

    use({
        'francoiscabrol/ranger.vim',
        cmd = 'Ranger',
        requires = {
            {
                'rbgrouleff/bclose.vim',
                cmd = 'Bclose',
                setup = function()
                    vim.g.bclose_no_plugin_maps = true
                end
            }
        }
    })

    use({
        'akinsho/nvim-bufferline.lua',
        config = function()
            require('rmarganti.plugins.config.bufferline').setup()
        end,
        event = 'ColorScheme',
    })

    use({
        'famiu/feline.nvim',
        config = function()
            require('rmarganti.plugins.config.feline').setup()
        end,
        requires = {'kyazdani42/nvim-web-devicons', opt = true},
        after = 'gitsigns.nvim',
    })

    --------------------------------
    -- Git
    --------------------------------

    -- Used to power feline git functionality.
    use ({
        'lewis6991/gitsigns.nvim',
        config = function()
            require('rmarganti.plugins.config.gitsigns').setup()
        end,
        event = 'ColorScheme',
    })

    -- Show GitHub notification count in status line.
    use({
        'rlch/github-notifications.nvim',
        config = function()
            require('rmarganti.plugins.config.github-notifications').setup()
        end,
        module = 'github-notifications',
        requires = {
            'nvim-telescope/telescope.nvim',
        },
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
        config = function()
            require('rmarganti.plugins.config.lspconfig').setup()
        end,
        event = 'BufWinEnter',
    })

    use({
        'jose-elias-alvarez/null-ls.nvim',
        config = function()
            require('rmarganti.plugins.config.null-ls').setup()
        end,
        after = 'nvim-lspconfig'
    })

    -- Adds LSPInstall command.
    use({
        'williamboman/nvim-lsp-installer',
        config = function()
            require('rmarganti.plugins.config.nvim-lsp-installer').setup()
        end,
        after = 'null-ls.nvim'
    })

    -- Show function signature as you type.
    use({
        'ray-x/lsp_signature.nvim',
        event = 'InsertEnter',
        config = function()
            require('rmarganti.plugins.config.lsp_signature').setup()
        end
    })

    -- Adds icons to auto-complete.
    use({
        'onsails/lspkind-nvim',
        config = function()
            require('rmarganti.plugins.config.lspkind').setup()
        end,
        after = 'nvim-lspconfig'
    })

    -- Code completion.
    use({
        'hrsh7th/nvim-cmp',
        config = function()
            require('rmarganti.plugins.config.cmp').setup()
        end,
        event = 'InsertEnter',
    })

    -- Completion sources.
    use({ 'hrsh7th/cmp-nvim-lsp', after = 'nvim-cmp' })
    use({ 'hrsh7th/cmp-buffer', after = 'nvim-cmp' })
    use({ 'hrsh7th/cmp-path', after = 'nvim-cmp' })
    use({ 'tzachar/cmp-tabnine', run='./install.sh', after = 'nvim-cmp' })
    use({ 'hrsh7th/cmp-vsnip', after = 'nvim-cmp' })

    -- Snippets.
    use({ 'hrsh7th/vim-vsnip', after = 'nvim-cmp' })

    --------------------------------
    -- Text manipulation
    --------------------------------

    -- Quickly surround text with brackets, quotes, etc.
    use({
        'tpope/vim-surround',
        event = 'BufWinEnter'
    })

    -- Easily replace with contents of register.
    use({
        'vim-scripts/ReplaceWithRegister',
        event = 'BufWinEnter'
    })

    --------------------------------
    -- Code Specific
    --------------------------------

    -- Easily comment/uncomment code.
    use({
        'b3nj5m1n/kommentary',
        event = 'BufWinEnter'
    })

    -- Auto-close brackets, etc.
    use({
        'windwp/nvim-autopairs',
        after = 'nvim-cmp',
        config = function()
            require('rmarganti.plugins.config.nvim-autopairs').setup()
        end,
    })

    use({
        'rcarriga/vim-ultest',
        requires = { 'vim-test/vim-test' },
        run = ':UpdateRemotePlugins',
        event = 'BufWinEnter'
    })

    use({
        'kosayoda/nvim-lightbulb',
        event = 'BufWinEnter',
        config = function()
            require('rmarganti.plugins.config.lightbulb').setup()
        end
    })

    --------------------------------
    -- Tmux integration
    --------------------------------

    use({
        'christoomey/vim-tmux-navigator',
        event = 'BufWinEnter',
    })

    use({
        'tmux-plugins/vim-tmux-focus-events',
        event = 'BufWinEnter',
    })

    --------------------------------
    -- Utility
    --------------------------------

    use({
        'nvim-lua/plenary.nvim',
        module = 'plenary',
    })

    use({
        'nvim-lua/popup.nvim',
        module = 'popup',
    })

    --------------------------------
    -- Misc
    --------------------------------

    -- Find, Filter, Preview,Pick
    use({
        'nvim-telescope/telescope.nvim',
        cmd = 'Telescope',
        module = 'telescope',
        config = function()
            require('rmarganti.plugins.config.telescope').setup()
        end,
    })

    use({
        'nvim-telescope/telescope-fzf-native.nvim',
        run = 'make',
        after = 'telescope.nvim',
        config = function()
            require('rmarganti.plugins.config.telescope-fzf-native').setup()
        end,
    })

    use({
        'nvim-telescope/telescope-github.nvim',
        after = 'telescope.nvim',
        config = function()
            require('rmarganti.plugins.config.telescope-github').setup()
        end,
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

    -- Close all buffers but current one.
    use({
        'vim-scripts/BufOnly.vim',
        event = 'BufWinEnter',
    })

    -- Make more things repeatalble.
    use({
        'tpope/vim-repeat',
        event = 'BufWinEnter',
    })

    -- Code spell-checking.
    use({
        'kamykn/spelunker.vim',
        setup = function()
            vim.g.spelunker_check_type = 2
            vim.g.spelunker_spell_bad_group = 'SpellBad'
        end,
        requires = {
            {
                'kamykn/popup-menu.nvim',
                event = 'BufWinEnter'
            }
        },
        event = 'BufWinEnter',
    })

    use({
        'phaazon/hop.nvim',
        config = function()
            require'hop'.setup()
        end,
        event = 'BufWinEnter',
    })
end)
