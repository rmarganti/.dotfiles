local M = {}

M.setup = function()
    local lsp_installer = require("nvim-lsp-installer")
    local utils = require('rmarganti.utils.misc')

    lsp_installer.on_server_ready(function(server)
        if server.name == 'sumneko_lua' then
            require('rmarganti.plugins.config.nvim-lsp-installer.lua').setup(server)
        elseif utils.has_value({ 'html', 'jsonls', 'intelephense', 'tsserver' }, server.name) then
            -- Disable the language server's `document_formatting` capability,
            -- since we will use some other linter/formatter (prettier, etc).
            server:setup({
                on_attach = function(client, _)
                    client.resolved_capabilities.document_formatting = false
                end,
                settings = {
                    documentFormatting = false
                }
            })
        else
            -- Use default settings for all the other language servers
            server:setup({})
        end

        vim.cmd [[ do User LspAttachBuffers ]]
    end)
end

return M
