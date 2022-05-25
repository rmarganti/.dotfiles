local M = {}

M.config = function()
    local lsp_installer = require("nvim-lsp-installer")
    local utils = require('rmarganti.utils.misc')
    local on_attach = require('rmarganti.plugins.config.nvim-lsp-installer.on_attach')

    lsp_installer.on_server_ready(function(server)
        local capabilities = require('cmp_nvim_lsp')
            .update_capabilities(vim.lsp.protocol.make_client_capabilities())

        local flags = {
            debounce_text_changes = 300, -- Wait 5 seconds before sending didChange
        }

        ------------------------------------------------
        -- Lua.
        ------------------------------------------------
        if server.name == 'sumneko_lua' then
            require('rmarganti.plugins.config.nvim-lsp-installer.lua').setup(
                server,
                on_attach,
                flags
            )

        ------------------------------------------------
        -- JSON.
        ------------------------------------------------
        elseif server.name == 'jsonls' then
            server:setup({
                capabilities = capabilities,
                on_attach = function(client, buffnr)
                    client.resolved_capabilities.document_formatting = false
                    on_attach(client, buffnr)
                end,
                settings = {
                    json = {
                        schemas = require('schemastore').json.schemas()
                    },
                    documentFormatting = false
                },
                flags = flags
            })

        ------------------------------------------------
        -- HTML, PHP, Typescript, Javascript.
        ------------------------------------------------
        elseif utils.has_value({ 'html', 'intelephense', 'tsserver' }, server.name) then
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
                },
                flags = flags
            })

        ------------------------------------------------
        -- Everything else.
        ------------------------------------------------
        else
            -- Use default settings for all the other language servers
            server:setup({
                capabilities = capabilities,
                on_attach = on_attach,
                flags = flags
            })
        end

        vim.cmd [[ do User LspAttachBuffers ]]
    end)
end

return M
