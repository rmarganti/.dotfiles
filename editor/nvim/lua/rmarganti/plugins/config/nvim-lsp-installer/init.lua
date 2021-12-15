local M = {}

M.setup = function()
    local lsp_installer = require("nvim-lsp-installer")
    local utils = require('rmarganti.utils.misc')
    local on_attach = require('rmarganti.plugins.config.nvim-lsp-installer.on_attach')

    lsp_installer.on_server_ready(function(server)
        local capabilities = require('cmp_nvim_lsp')
            .update_capabilities(vim.lsp.protocol.make_client_capabilities())

        if server.name == 'sumneko_lua' then
            require('rmarganti.plugins.config.nvim-lsp-installer.lua').setup(server, on_attach)
        elseif utils.has_value({ 'html', 'jsonls', 'intelephense', 'tsserver' }, server.name) then
            -- Disable the language server's `document_formatting` capability,
            -- since we will use some other linter/formatter (prettier, etc).
            server:setup({
                capabilities = capabilities,
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
                capabilities = capabilities,
                on_attach = on_attach
            })
        end

        vim.cmd [[ do User LspAttachBuffers ]]
    end)
end

return M
