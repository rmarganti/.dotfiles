return {
    'olimorris/codecompanion.nvim',
    event = 'VeryLazy',
    dependencies = {
        'nvim-lua/plenary.nvim',
        'nvim-treesitter/nvim-treesitter',
    },
    opts = {
        strategies = {
            chat = {
                adapter = 'copilot',
            },
            inline = {
                adapter = 'copilot',
            },
        },
    },
}
