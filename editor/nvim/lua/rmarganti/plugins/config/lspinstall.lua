return function()
    local utils = require('rmarganti.utils.misc')
    local lspconfig = require('lspconfig')
    local eslint = require('rmarganti.plugins.config.efm.eslint')
    local prettier = require('rmarganti.plugins.config.efm.prettier')

    -- https://github.com/kabouzeid/nvim-lspinstall#advanced-configuration-recommended
    local function setup_servers()
        -- Provide the missing :LspInstall
        require('lspinstall').setup()

        -- Use default config for every installed language server.
        local servers = require('lspinstall').installed_servers()
        for _, server in pairs(servers) do
            if server == 'efm' then
                lspconfig.efm.setup({
                    init_options = {
                        documentFormatting = true,
                    },
                    filetypes = {
                        'css',
                        'html',
                        'javascript',
                        'javascriptreact',
                        'json',
                        'markdown',
                        'scss',
                        'typescript',
                        'typescriptreact',
                        'yaml',
                    },
                    settings = {
                        rootMarkers = { ".git/" },
                        languages = {
                            css = { prettier },
                            html = { prettier },
                            javascript = { prettier, eslint },
                            javascriptreact = { prettier, eslint },
                            json = { prettier },
                            markdown = { prettier },
                            scss = { prettier },
                            typescript = { prettier, eslint },
                            typescriptreact = { prettier, eslint },
                            yaml = { prettier },
                        },
                    },
                })
            -- Configure sumneko for neovim lua development
            elseif server == 'lua' then
                local lua_path = vim.split(package.path, ';')
                table.insert(lua_path, 'lua/?.lua')
                table.insert(lua_path, 'lua/?/init.lua')

                lspconfig.lua.setup({
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
            elseif utils.has_value({ 'html', 'json', 'typescript' }, server) then
                lspconfig.typescript.setup({
                    on_attach = function(client, _)
                        -- This makes sure tsserver is not used for formatting (I prefer prettier)
                        client.resolved_capabilities.document_formatting = false
                    end,
                    settings = {
                        documentFormatting = false
                    }
                })
            else
                -- Use default settings for all the other language servers
                lspconfig[server].setup({})
            end
        end
    end

    setup_servers()

    -- Automatically reload after `:LspInstall <server>` so we don't have to restart neovim
    require('lspinstall').post_install_hook = function()
        setup_servers() -- reload installed servers
        vim.cmd('bufdo e') -- this triggers the FileType autocmd that starts the server
    end
end
