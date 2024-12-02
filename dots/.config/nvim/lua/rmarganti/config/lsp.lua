local M = {}

local function make_lua_lsp_config()
    -- Configure sumneko for neovim lua development
    local lua_path = vim.split(package.path, ';')
    table.insert(lua_path, 'lua/?.lua')
    table.insert(lua_path, 'lua/?/init.lua')

    return {
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
    }
end

--- Configuration for an LSP client
-- @field formatting_enabled Should the client be used for file formatting?
-- @field skip_setup When set to true, the client will not be setup by nvim-lspconfig.
-- @field setup Additional configuration for the client. Passed to nvim-lspconfig[client].setup()
-- @table lsp_client_config

M.clients = {
    ------------------------------------------------
    -- Bash
    ------------------------------------------------

    bashls = {
        formatting_enabled = true,
    },

    ------------------------------------------------
    -- CSS
    ------------------------------------------------

    cssls = {
        formatting_enabled = false,
    },

    ------------------------------------------------
    -- Docker
    ------------------------------------------------

    dockerls = {
        formatting_enabled = true,
    },

    docker_compose_language_service = {
        formatting_enabled = true,
    },

    ------------------------------------------------
    -- HTML
    ------------------------------------------------

    emmet_ls = {
        formatting_enabled = false,
        setup = {
            -- Disabling for React, because it often gets in the way.
            filetypes = { 'html', 'css', 'sass', 'scss', 'less' },
        },
    },

    html = {
        formatting_enabled = false,
    },

    ------------------------------------------------
    -- JSON
    ------------------------------------------------

    jsonls = {
        formatting_enabled = false,
        setup = {
            settings = {
                json = {
                    schemas = require('schemastore').json.schemas(),
                },
            },
        },
    },

    ------------------------------------------------
    -- Lua
    ------------------------------------------------

    lua_ls = {
        formatting_enabled = false,
        setup = {
            settings = make_lua_lsp_config(),
        },
    },

    ------------------------------------------------
    -- Go
    ------------------------------------------------

    gopls = {
        formatting_enabled = true,
        setup = {
            gopls = {
                hints = {
                    assignVariableTypes = true,
                    compositeLiteralFields = true,
                    compositeLiteralTypes = true,
                    constantValues = true,
                    functionTypeParameters = true,
                    parameterNames = true,
                    rangeVariableTypes = true,
                },
            },
        },
    },

    golangci_lint_ls = {
        formatting_enabled = false,
    },

    ------------------------------------------------
    -- GraphQL
    ------------------------------------------------

    graphql = {
        formatting_enabled = false,
        setup = {
            -- Javascript and typescript are supported, but can
            -- interfere with navic, so disabling for now.
            filetypes = { 'graphql' },
        },
    },

    ------------------------------------------------
    -- PHP
    ------------------------------------------------

    phpactor = {
        formatting_enabled = false,
    },

    ------------------------------------------------
    -- Rust
    ------------------------------------------------

    rust_analyzer = {
        formatting_enabled = true,
    },

    ------------------------------------------------
    -- Typescript, Javascript
    ------------------------------------------------

    vtsls = {
        formatting_enabled = true,
    },

    eslint = {
        formatting_enabled = true,
    },

    ------------------------------------------------
    -- Misc
    ------------------------------------------------

    prismals = {
        formatting_enabled = true,
    },

    -- This is installed and managed by zbirenbaum/copilot.lua
    copilot = {
        formatting_enabled = false,
        skip_setup = true,
    },

    terraformls = {
        formatting_enabled = false,
    },

    -- Protobufs
    bufls = {
        formatting_enabled = true,
    },

    helm_ls = {
        fomatting_enabled = true,
    },

    -- TOML
    taplo = {
        formatting_enabled = true,
    },

    yamlls = {
        setup = {
            settings = {
                yaml = {
                    schemas = require('schemastore').yaml.schemas(),
                },
            },
        },
    },
}

return M
