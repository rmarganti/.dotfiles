local M = {}

M.setup = function()
    local lspconfig = require('lspconfig')
    local utils = require('rmarganti.utils.misc')

    -- https://github.com/kabouzeid/nvim-lspinstall#advanced-configuration-recommended
    local function setup_servers()
        -- Provide the missing :LspInstall
        require('lspinstall').setup()

        local servers = require('lspinstall').installed_servers()

        for _, server in pairs(servers) do
            if server == 'lua' then
                require('rmarganti.plugins.config.lspinstall.lua').setup(lspconfig)
            elseif utils.has_value({ 'html', 'json', 'php', 'typescript' }, server) then
                -- Disable the language server's `document_formatting` capability,
                -- since we will use some other linter/formatter (prettier, etc).
                lspconfig[server].setup({
                    on_attach = function(client, _)
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

return M
