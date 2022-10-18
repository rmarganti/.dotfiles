local M = {}

-- Commonly used flags
M.flags = {
    debounce_text_changes = 300, -- Wait 5 seconds before sending didChange
}

M.make_client_capabilities = function()
    return require('cmp_nvim_lsp').default_capabilities()
end

M.on_attach = function(client, bufnr)
    local core_fns = require('rmarganti.core.functions')

    -- Provide breadcrumbs
    if client.server_capabilities.documentSymbolProvider then
        local navic = require('nvim-navic')
        navic.attach(client, bufnr)
    end

    -- Auto-format on save.
    if client.supports_method('textDocument/formatting') then
        local format_group =
            vim.api.nvim_create_augroup('format', { clear = true })

        vim.api.nvim_create_autocmd('BufWritePost', {
            group = format_group,
            callback = function()
                core_fns.format(true)
            end,
            desc = 'Auto-format on save',
            buffer = 0,
        })
    end
end

return M
