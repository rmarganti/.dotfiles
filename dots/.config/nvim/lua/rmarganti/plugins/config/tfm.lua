-- File explorer.
local M = {
    'Rolv-Apneseth/tfm.nvim',
    lazy = false,
}

function M.config()
    vim.api.nvim_create_autocmd('FileType', {
        group = vim.api.nvim_create_augroup('rmarganti_tfm_appearance', { clear = true }),
        pattern = 'tfm',
        callback = function()
            vim.wo.winhighlight = 'Normal:NormalFloat,NormalFloat:NormalFloat'
        end,
    })

    require('tfm').setup({
        file_manager = 'lf',
        replace_netrw = true,
        ui = {
            border = 'rounded',
            height = 32 / 42, -- Match the previous 10-row margin at a 42-row terminal.
            width = 0.9,
        },
    })
end

return M
