-- Resize windows based on focus.
local M = {
    'beauwilliams/focus.nvim',
    event = 'VeryLazy',
}

function M.config()
    require('focus').setup({
        ui = {
            signcolumn = false,
        },
    })

    local ignore_filetypes = { 'fugitiveblame' }

    local augroup = vim.api.nvim_create_augroup('FocusDisable', { clear = true })

    vim.api.nvim_create_autocmd('FileType', {
        group = augroup,
        callback = function(_)
            if vim.tbl_contains(ignore_filetypes, vim.bo.filetype) then
                vim.b.focus_disable = true
            end
        end,
        desc = 'Disable focus autoresize for FileType',
    })
end

return M
