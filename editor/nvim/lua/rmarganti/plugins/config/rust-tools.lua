local M = {}

M.config = function()
    local rt = require('rust-tools')
    local lsp_utils = require('rmarganti.plugins.config.lsp-utils')

    rt.setup({
        tools = {
            inlay_hints = {
                auto = true,
                show_parameter_hints = false,
                highlight = 'InlayHint',
            },
        },
        server = {
            on_attach = lsp_utils.on_attach,
        },
    })
end

return M
