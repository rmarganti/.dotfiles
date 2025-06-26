vim.lsp.handlers['textDocument/publishDiagnostics'] =
    vim.lsp.with(vim.lsp.diagnostic.on_publish_diagnostics, {
        virtual_text = false,
        underline = true,
        signs = true,
        update_in_insert = false,
    })

vim.diagnostic.config({
    float = {
        source = true, -- Or "if_many"
    },
    signs = {
        text = {
            [vim.diagnostic.severity.ERROR] = '·',
            [vim.diagnostic.severity.WARN] = '·',
            [vim.diagnostic.severity.HINT] = '·',
            [vim.diagnostic.severity.INFO] = '·',
        },
    },
})
