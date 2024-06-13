-- File explorer.
local M = {
    'lmburns/lf.nvim',
    event = 'VeryLazy',
    dependencies = { 'akinsho/toggleterm.nvim' },
}

function M.init()
    vim.g.lf_netrw = 1
end

function M.config()
    require('lf').setup({
        escape_quit = false,
        border = 'rounded',
        winblend = 0,
    })
end

return M
