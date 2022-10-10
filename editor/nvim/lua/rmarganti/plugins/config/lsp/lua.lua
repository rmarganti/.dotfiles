local M = {}

M.setup = function()
    local lspconfig = require('lspconfig')
    local lsp_utils = require('rmarganti.plugins.config.lsp-utils')

    -- Configure sumneko for neovim lua development
    local lua_path = vim.split(package.path, ';')
    table.insert(lua_path, 'lua/?.lua')
    table.insert(lua_path, 'lua/?/init.lua')

    lspconfig.sumneko_lua.setup({
        capabilities = lsp_utils.make_client_capabilities(),
        on_attach = lsp_utils.on_attach,
        settings = {
            Lua = {
                awakened = { cat = true },
                documentFormatting = false, -- We use stylua through null-ls
                runtime = {
                    -- Tell the language server which version of Lua you're using (most likely LuaJIT in the case of Neovim)
                    version = 'LuaJIT',
                    -- Setup your lua path
                    path = lua_path,
                },
                diagnostics = {
                    -- Get the language server to recognize the `vim` global
                    globals = { 'vim' },
                },
                workspace = {
                    -- Make the server aware of Neovim runtime files
                    library = {},
                    maxPreload = 2000,
                    preloadFileSize = 150,
                },
                -- Do not send telemetry data containing a randomized but unique identifier
                telemetry = { enable = false },
            },
        },
        flags = lsp_utils.flags
    })
end

return M
