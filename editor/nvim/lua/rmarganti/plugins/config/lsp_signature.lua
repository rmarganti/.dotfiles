-- Show function signature as you type.
local M = {
    'ray-x/lsp_signature.nvim',
    event = 'InsertEnter',
}

function M.config()
    require('lsp_signature').setup({
        hint_enable = false,
    })
end

return M
