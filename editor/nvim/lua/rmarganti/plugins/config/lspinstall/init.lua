return function()
    local lspconfig = require('lspconfig')
    local utils = require('rmarganti.utils.misc')

    -- https://github.com/kabouzeid/nvim-lspinstall#advanced-configuration-recommended
    local function setup_servers()
        -- Provide the missing :LspInstall
        require('lspinstall').setup()

        -- Use default config for every installed language server.
        local servers = require('lspinstall').installed_servers()
        for _, server in pairs(servers) do
            if server == 'efm' then
                require('rmarganti.plugins.config.lspinstall.efm')(lspconfig)
            elseif server == 'lua' then
                require('rmarganti.plugins.config.lspinstall.lua')(lspconfig)
            elseif utils.has_value({ 'html', 'json', 'typescript' }, server) then
                lspconfig[server].setup({
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
