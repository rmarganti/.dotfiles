-- Show light bulb icon when code action is available.
local M = {
    'kosayoda/nvim-lightbulb',
    event = 'BufReadPost',
}

function M.config()
    local lightbulb_group = vim.api.nvim_create_augroup('custom', { clear = true })

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
