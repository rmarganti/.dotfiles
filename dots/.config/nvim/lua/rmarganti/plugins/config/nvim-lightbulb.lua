-- Show light bulb icon when code action is available.
local M = {
    'kosayoda/nvim-lightbulb',
    event = 'BufReadPost',
}

function M.config()
    vim.fn.sign_define('LightBulbSign', {
        text = '',
        texthl = 'CodeAction',
    })

    local lightbulb_group = vim.api.nvim_create_augroup('lightbulb', { clear = true })

    vim.api.nvim_create_autocmd({ 'CursorHold', 'CursorHoldI' }, {
        pattern = '*',
        group = lightbulb_group,
        callback = function()
            require('nvim-lightbulb').update_lightbulb()
        end,
        desc = 'Show lightbulb icon when code action is available',
    })
end

return M
