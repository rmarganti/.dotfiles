local user_lsp_config = require('rmarganti.config.lsp')

local M = {}
local configured_clients

M.config = function()
    local lspconfig = require('lspconfig')
    local lsp_utils = require('rmarganti.plugins.config.lsp-utils')
    local clients = configured_clients()

    local capabilities = lsp_utils.make_client_capabilities()
    local flags = lsp_utils.flags
    local on_attach = lsp_utils.on_attach

    -- Installs servers.
    require('mason').setup()
    require('mason-lspconfig').setup({
        ensure_installed = clients,
    })

    -- Support nvim-ufo code folding
    capabilities.textDocument.foldingRange = {
        dynamicRegistration = false,
        lineFoldingOnly = true,
    }

    -- Register clients via nvim-lspconfig
    for _, client in ipairs(clients) do
        local config = user_lsp_config.clients[client]

        lspconfig[client].setup({
            flags = flags,
            capabilities = capabilities,
            on_attach = on_attach,
            filetypes = config.filetypes,
            settings = config.additional_lsp_config,
        })
    end

    vim.cmd([[ do User LspAttachBuffers ]])
end

-- Get table of clients that should be installed
-- by Mason and configured by nvim-lspconfig.
configured_clients = function()
    local clients = {}

    for client, config in pairs(user_lsp_config.clients) do
        if config.skip_setup ~= true then
            table.insert(clients, client)
        end
    end

    return clients
end

return M
