vim.lsp.handlers['textDocument/publishDiagnostics'] =
    vim.lsp.with(vim.lsp.diagnostic.on_publish_diagnostics, {
        virtual_text = false,
        underline = true,
        signs = true,
        update_in_insert = false,
    })

vim.lsp.handlers['textDocument/hover'] = vim.lsp.with(vim.lsp.handlers.hover, {
    border = 'rounded',
})

vim.lsp.handlers['textDocument/signatureHelp'] = vim.lsp.with(vim.lsp.handlers.signature_help, {
    border = 'rounded',
})

-- Set diagnostic icons.
local signs = {
    Error = '·',
    Warn = '·',
    Hint = '·',
    Info = '·',
}

for type, icon in pairs(signs) do
    local hl = 'DiagnosticSign' .. type
    vim.fn.sign_define(hl, {
        text = icon,
        texthl = hl,
        numhl = '',
    })
end

vim.diagnostic.config({
    float = {
        source = 'always', -- Or "if_many"
        signs = {
            text = {
                [vim.diagnostic.severity.ERROR] = '·',
                [vim.diagnostic.severity.WARN] = '·',
                [vim.diagnostic.severity.HINT] = '·',
                [vim.diagnostic.severity.INFO] = '·',
            },
        },
    },
})
