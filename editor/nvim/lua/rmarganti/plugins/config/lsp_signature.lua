local M = {}

M.setup = function()
    require('lsp_signature').setup({
        hint_enable = false,
    });
end

return M
