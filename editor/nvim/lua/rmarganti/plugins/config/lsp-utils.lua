local M = {}

-- Commonly used flags
M.flags = {
    debounce_text_changes = 300, -- Wait 5 seconds before sending didChange
}

M.make_client_capabilities = function()
    local capabilities = require('cmp_nvim_lsp').update_capabilities(
        vim.lsp.protocol.make_client_capabilities()
    )

    return capabilities
end

M.on_attach = function(client, bufnr)
    -- Provide breadcrumbs
    if client.server_capabilities.documentSymbolProvider then
        local navic = require('nvim-navic')
        navic.attach(client, bufnr)
    end

    -- Auto-format on save.
    if client.supports_method('textDocument/formatting') then
        vim.cmd([[augroup Format]])
        vim.cmd([[autocmd! * <buffer>]])
        vim.cmd([[autocmd BufWritePost <buffer> lua require('rmarganti.core.functions').format(true)]])
        vim.cmd([[augroup END]])
    end
end

return M
