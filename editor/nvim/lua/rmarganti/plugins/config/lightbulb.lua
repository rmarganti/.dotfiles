local M = {}

M.config = function()
    vim.api.nvim_create_autocmd(
        { 'CursorHold', 'CursorHoldI' },
        {
            pattern = '*',
            callback = function()
                require('nvim-lightbulb').update_lightbulb()
            end,
            desc = 'Show lightbulb icon when code action is available'
        }
    )

end

return M
