-- AI Sidekick for Neovim - Next Edit Suggestions & CLI Integration
local M = {
    'folke/sidekick.nvim',
    dir = '/Users/rmarganti/code/folke/sidekick.nvim',
    event = 'VeryLazy',
    dependencies = {
        { 'zbirenbaum/copilot.lua' },
        { 'nvim-treesitter/nvim-treesitter-textobjects' },
    },
}

function M.config()
    require('sidekick').setup({
        -- Next Edit Suggestions configuration
        nes = {
            enabled = true,
            debounce = 100,
            diff = {
                inline = 'words',
            },
        },

        -- AI CLI Integration
        cli = {
            watch = true, -- notify Neovim of file changes done by AI CLI tools
            mux = {
                enabled = true, -- persistent sessions through Herdr
                backend = 'herdr',
                create = vim.env.HERDR_ENV == '1' and 'split' or 'terminal',
                dump = 2000,
            },
            picker = 'telescope',

            tools = {
                -- Only enable opencode
                opencode = {
                    cmd = { 'opencode' },
                },

                aider = false,
                amazon_q = false,
                claude = false,
                codex = false,
                copilot = false,
                crush = false,
                cursor = false,
                gemini = false,
                grok = false,
                qwen = false,
            },
        },

        -- Copilot status tracking
        copilot = {
            status = {
                enabled = true,
                level = vim.log.levels.WARN,
            },
        },
    })
end

return M
