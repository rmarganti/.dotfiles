local M = {}

M.setup = function(server, on_attach)
    -- Configure sumneko for neovim lua development
    local lua_path = vim.split(package.path, ';')
    table.insert(lua_path, 'lua/?.lua')
    table.insert(lua_path, 'lua/?/init.lua')

    server:setup({
        on_attach = on_attach,
        settings = {
            Lua = {
                awakened = { cat = true },
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
    })
end

return M
