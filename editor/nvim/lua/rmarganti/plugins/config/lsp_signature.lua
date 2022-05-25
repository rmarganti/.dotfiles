local M = {}

M.config = function()
    require('lsp_signature').setup({
        hint_enable = false,
    });
end

return M
