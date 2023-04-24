-- Improved folds
local M = {
    'kevinhwang91/nvim-ufo',
    dependencies = {
        { 'kevinhwang91/promise-async' },
    },
    event = 'BufReadPost',
}

-- This fold handler will add ` %d` to the end of folds,
-- where `%d` is the number of folded lines.
local handler = function(virtText, lnum, endLnum, width, truncate)
    local newVirtText = {}
    local suffix = ('  %d '):format(endLnum - lnum)
    local sufWidth = vim.fn.strdisplaywidth(suffix)
    local targetWidth = width - sufWidth
    local curWidth = 0
    for _, chunk in ipairs(virtText) do
        local chunkText = chunk[1]
        local chunkWidth = vim.fn.strdisplaywidth(chunkText)
        if targetWidth > curWidth + chunkWidth then
            table.insert(newVirtText, chunk)
        else
            chunkText = truncate(chunkText, targetWidth - curWidth)
            local hlGroup = chunk[2]
            table.insert(newVirtText, { chunkText, hlGroup })
            chunkWidth = vim.fn.strdisplaywidth(chunkText)
            -- str width returned from truncate() may less than 2nd argument, need padding
            if curWidth + chunkWidth < targetWidth then
                suffix = suffix .. (' '):rep(targetWidth - curWidth - chunkWidth)
            end
            break
        end
        curWidth = curWidth + chunkWidth
    end
    table.insert(newVirtText, { suffix, 'UfoFoldedEllipsis' })
    return newVirtText
end

function M.config()
    local ufo = require('ufo')

    ufo.setup({
        fold_virt_text_handler = handler,
        preview = {
            win_config = {
                winblend = 0,
            },
        },
        provider_selector = function()
            return { 'treesitter', 'indent' }
        end,
    })

    vim.keymap.set('n', 'zR', ufo.openAllFolds)
    vim.keymap.set('n', 'zM', ufo.closeAllFolds)
    vim.keymap.set('n', 'zr', function()
        ufo.closeFoldsWith(1)
    end)
    vim.keymap.set('n', 'zm', require('ufo').closeFoldsWith) -- closeAllFolds == closeFoldsWith(0)

    -- Clear Fold HL group when using UFO, since
    -- we use other methods of indicating a fold.
    vim.api.nvim_set_hl(0, 'Folded', {})
end

return M
