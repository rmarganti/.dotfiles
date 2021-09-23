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
        config = require('rmarganti.plugins.config.treesitter'),
        run = ':TSUpdate',
        event = 'ColorScheme'
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
        config = require('rmarganti.plugins.config.everforest')
    })

    use({
        'rbgrouleff/bclose.vim',
        event = 'BufWinEnter'
    })

    use({
        'francoiscabrol/ranger.vim',
        cmd = 'Ranger',
    })

    use({
        'akinsho/nvim-bufferline.lua',
        config = require('rmarganti.plugins.config.bufferline'),
    })

    use({
        'hoob3rt/lualine.nvim',
        config = require('rmarganti.plugins.config.lualine'),
        requires = {'kyazdani42/nvim-web-devicons', opt = true},
    })

    --------------------------------
    -- LSP
    --------------------------------

    -- Common LSP configs.
    use({
        'neovim/nvim-lspconfig',
        config = require('rmarganti.plugins.config.lspconfig'),
        event = 'ColorScheme',
    })

    -- Adds LSPInstall command.
    use {
        'kabouzeid/nvim-lspinstall',
        config = require('rmarganti.plugins.config.lspinstall'),
        after = 'nvim-lspconfig'
    }

    -- Code completion.
    use({
        'hrsh7th/nvim-cmp',
        config = require('rmarganti.plugins.config.cmp'),
        event = 'InsertEnter'
    })

    -- Completion sources.
    use({ 'hrsh7th/cmp-nvim-lsp', after = 'nvim-cmp' })
    use({ 'hrsh7th/cmp-buffer', after = 'nvim-cmp' })
    use({ 'tzachar/cmp-tabnine', run='./install.sh', after = 'nvim-cmp' })
    use({ 'hrsh7th/cmp-vsnip', after = 'nvim-cmp' })
    use({ 'hrsh7th/vim-vsnip', after = 'nvim-cmp' })

    -- UI for common LSP actions.
    use({
        'glepnir/lspsaga.nvim',
        after = 'nvim-lspconfig',
    })

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
        config = require('rmarganti.plugins.config.nvim-autopairs')
    })

    use({
        'rcarriga/vim-ultest',
        requires = { 'vim-test/vim-test' },
        run = ':UpdateRemotePlugins',
        event = 'BufWinEnter'
    })

    --------------------------------
    -- Tmux integration
    --------------------------------

    use({
        'christoomey/vim-tmux-navigator',
        event = 'ColorScheme'
    })

    use({
        'tmux-plugins/vim-tmux-focus-events',
        event = 'ColorScheme'
    })

    --------------------------------
    -- Misc
    --------------------------------

    -- Find, Filter, Preview,Pick
    use({
        'nvim-telescope/telescope.nvim',
        cmd = 'Telescope',
        module = 'telescope',
        requires = {
            { 'nvim-lua/popup.nvim' },
            { 'nvim-lua/plenary.nvim' },
            {
                'nvim-telescope/telescope-fzf-native.nvim',
                run = 'make',
            }
        },
        config = require('rmarganti.plugins.config.telescope'),
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
        event = 'ColorScheme'
    })

    -- Git.
    use({
        'tpope/vim-fugitive',
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
end)
