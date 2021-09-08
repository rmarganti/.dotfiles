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
        run = ':TSUpdate'
    })

    use('nvim-treesitter/nvim-treesitter-textobjects')

    --------------------------------
    -- Theme/UI
    --------------------------------

     use({
        'shaunsingh/nord.nvim',
        config = require('rmarganti.plugins.config.nord')
    })

    use('rbgrouleff/bclose.vim')
    use('francoiscabrol/ranger.vim')

    use({
        'akinsho/nvim-bufferline.lua',
        config = require('rmarganti.plugins.config.bufferline'),
        event = "ColorScheme",
    })

    use({
        'hoob3rt/lualine.nvim',
        config = require('rmarganti.plugins.config.lualine'),
        requires = {'kyazdani42/nvim-web-devicons', opt = true}
    })


    --------------------------------
    -- LSP
    --------------------------------

    -- Common LSP configs.
    use({
        'neovim/nvim-lspconfig',
        config = require('rmarganti.plugins.config.lspconfig'),
    })

    -- Adds LSPInstall command.
    use {
        'kabouzeid/nvim-lspinstall',
        config = require('rmarganti.plugins.config.lspinstall'),
        after = 'nvim-lspconfig'
    }

    -- Code completion.
    use({
        'hrsh7th/nvim-compe',
        config = require('rmarganti.plugins.config.compe'),
        after = 'nvim-lspconfig',
    })

    -- UI for common LSP actions.
    use({
        'glepnir/lspsaga.nvim',
        after = 'nvim-lspconfig',
    })

    --------------------------------
    -- Text manipulation
    --------------------------------

    -- Quickly surround text with brackets, quotes, etc.
    use('tpope/vim-surround')

    -- Easily replace with contents of register.
    use('vim-scripts/ReplaceWithRegister')

    --------------------------------
    -- Code Specific
    --------------------------------

    -- Easily comment/uncomment code.
    use('b3nj5m1n/kommentary')

    --------------------------------
    -- Tmux integration
    --------------------------------

    use('christoomey/vim-tmux-navigator')
    use('tmux-plugins/vim-tmux-focus-events')

    --------------------------------
    -- Misc
    --------------------------------

    -- Find, Filter, Preview,Pick
    use({
        'nvim-telescope/telescope.nvim',
        cmd = 'Telescope',
        module = 'telescope',
        requires = {{'nvim-lua/popup.nvim'}, {'nvim-lua/plenary.nvim'}},
        config = require('rmarganti.plugins.config.telescope'),
    })

    -- Sugar for file operations (rename, move, etc.).
    use('tpope/vim-eunuch')
    --
    --  Random shortcuts that typically work in pairs.
    use('tpope/vim-unimpaired')

    -- Close all buffers but current one.
    use('vim-scripts/BufOnly.vim')
end)
