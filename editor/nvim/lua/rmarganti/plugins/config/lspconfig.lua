local M = {}

M.setup = function()
    -- If a format-on-save action occurs after the buffer has
    -- already been written, re-save with the now formatted contents.
    vim.lsp.handlers["textDocument/formatting"] = function(err, result, ctx)
        if err ~= nil or result == nil then
            return
        end

        if
            vim.api.nvim_buf_get_var(ctx.bufnr, "init_changedtick") == vim.api.nvim_buf_get_var(ctx.bufnr, "changedtick")
        then
            local view = vim.fn.winsaveview()

            vim.lsp.util.apply_text_edits(result, ctx.bufnr)
            vim.fn.winrestview(view)

            if ctx.bufnr == vim.api.nvim_get_current_buf() then
                vim.b.is_saving_format = true
                vim.cmd [[update]]
                vim.b.is_saving_format = false
            end
        end
    end

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
        Warn = '–',
        Hint = '–',
        Information = '–'
    }

    for type, icon in pairs(signs) do
        local hl = 'DiagnosticSign' .. type
        vim.fn.sign_define(
            hl, {
            text = icon,
            texthl = hl,
            numhl = ''
        })
    end
end

return M
