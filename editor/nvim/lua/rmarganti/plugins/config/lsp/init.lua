local M = {}

M.config = function()
    local lspconfig = require('lspconfig')
    local lsp_utils = require('rmarganti.plugins.config.lsp-utils')

    -- Installs servers.
    require('mason').setup()
    require('mason-lspconfig').setup({
        ensure_installed = {
            'cssls',
            'emmet_ls',
            'eslint',
            'html',
            'intelephense',
            'jsonls',
            'sumneko_lua',
            'terraformls',
            'tsserver',
        }
    })

    ------------------------------------------------
    -- Lua.
    ------------------------------------------------

    require('rmarganti.plugins.config.lsp.lua').setup()

    ------------------------------------------------
    -- JSON.
    ------------------------------------------------

    lspconfig.jsonls.setup({
        capabilities = capabilities,
        on_attach = function(client, buffnr)
            client.resolved_capabilities.document_formatting = false
            lsp_utils.on_attach(client, buffnr)
        end,
        settings = {
            json = {
                schemas = require('schemastore').json.schemas()
            },
            documentFormatting = false
        },
        flags = lsp_utils.flags,
    })

    ------------------------------------------------
    -- HTML, PHP, Typescript, Javascript.
    ------------------------------------------------

    -- Disable the language server's `document_formatting` capability,
    -- since we will use some other linter/formatter (prettier, etc).
    for _, server in pairs({ 'emmet_ls', 'html', 'intelephense', 'terraformls', 'tsserver' }) do
        lspconfig[server].setup({
            capabilities = capabilities,
            on_attach = function(client, buffnr)
                client.resolved_capabilities.document_formatting = false
                lsp_utils.on_attach(client, buffnr)
            end,
            settings = {
                documentFormatting = false
            },
            flags = lsp_utils.flags,
        })
    end

    ------------------------------------------------
    -- Everything else.
    ------------------------------------------------
    for _, server in pairs({ 'cssls', 'eslint' }) do
        lspconfig[server].setup({
            capabilities = capabilities,
            on_attach = lsp_utils.on_attach,
            flags = lsp_utils.flags,
        })
    end

    vim.cmd [[ do User LspAttachBuffers ]]
end

return M
