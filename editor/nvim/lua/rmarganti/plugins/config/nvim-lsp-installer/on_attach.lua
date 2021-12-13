local on_attach = function (client, _)
    -- Auto-format on save.
    if client.resolved_capabilities.document_formatting then
        vim.cmd [[augroup Format]]
        vim.cmd [[autocmd! * <buffer>]]
        vim.cmd [[autocmd BufWritePost <buffer> lua require('rmarganti.core.functions').format(true)]]
        vim.cmd [[augroup END]]
    end
end

return on_attach
