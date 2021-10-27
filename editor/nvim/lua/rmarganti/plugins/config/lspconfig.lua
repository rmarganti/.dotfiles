local M = {}

M.setup = function()
    -- Disable inline diagnostics
    vim.lsp.handlers['textDocument/publishDiagnostics'] = vim.lsp.with(
        vim.lsp.diagnostic.on_publish_diagnostics,
        {
            virtual_text = false,
            underline = true,
            signs = true,
            update_in_insert = false
        }
    )


    vim.lsp.handlers['textDocument/hover'] = vim.lsp.with(
        vim.lsp.handlers.hover,
        {
            border = 'rounded'
        }
    )

    vim.lsp.handlers['textDocument/signatureHelp'] = vim.lsp.with(
        vim.lsp.handlers.signature_help,
        {
            border = 'rounded'
        }
    )

    -- Set diagnostic icons.
    local signs = {
        Error = '–',
        Warning = '–',
        Hint = '–',
        Information = '–'
    }

    for type, icon in pairs(signs) do
        local hl = 'LspDiagnosticsSign' .. type
        vim.fn.sign_define(
            hl, {
            text = icon,
            texthl = hl,
            numhl = ''
        })
    end
end

return M
