local M = {}

M.setup = function()
    local lsp_installer = require("nvim-lsp-installer")
    local utils = require('rmarganti.utils.misc')

    local on_attach = function (client, _)
        -- Auto-format on save.
        if client.resolved_capabilities.document_formatting then
            vim.cmd [[augroup Format]]
            vim.cmd [[autocmd! * <buffer>]]
            vim.cmd [[autocmd BufWritePost <buffer> lua require('rmarganti.core.functions').format(true)]]
            vim.cmd [[augroup END]]
        end
    end

    lsp_installer.on_server_ready(function(server)
        if server.name == 'sumneko_lua' then
            require('rmarganti.plugins.config.nvim-lsp-installer.lua').setup(server, on_attach)
        elseif utils.has_value({ 'html', 'jsonls', 'intelephense', 'tsserver' }, server.name) then
            -- Disable the language server's `document_formatting` capability,
            -- since we will use some other linter/formatter (prettier, etc).
            server:setup({
                on_attach = function(client, buffnr)
                    client.resolved_capabilities.document_formatting = false
                    on_attach(client, buffnr)
                end,
                settings = {
                    documentFormatting = false
                }
            })
        else
            -- Use default settings for all the other language servers
            server:setup({
                on_attach = on_attach
            })
        end

        vim.cmd [[ do User LspAttachBuffers ]]
    end)


    require('lspconfig')['null-ls'].setup({
        on_attach = on_attach
    })
end

return M
