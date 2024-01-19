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

    vim.api.nvim_create_autocmd('User', {
        pattern = 'LfTermEnter',
        callback = function(a)
            -- `q` and `esc` exit the terminal
            vim.api.nvim_buf_set_keymap(a.buf, 't', 'q', 'q', { nowait = true })
            vim.api.nvim_buf_set_keymap(a.buf, 't', '<esc>', 'q', { nowait = true })
        end,
    })
end

return M
