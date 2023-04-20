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
-- @field filetypes Table of file types for which the LSP should be used
-- @field root_dir Function to determine the root directory for the LSP
-- @field additional_lsp_config Configuration to be passed to nvim-lspconfig
-- @table lsp_client_config

M.clients = {
    ------------------------------------------------
    -- CSS
    ------------------------------------------------

    cssls = {
        formatting_enabled = false,
    },

    ------------------------------------------------
    -- HTML
    ------------------------------------------------

    emmet_ls = {
        -- Disabling for React, because it often gets in the way.
        filetypes = { 'html', 'css', 'sass', 'scss', 'less' },
        formatting_enabled = false,
    },

    html = {
        formatting_enabled = false,
    },

    ------------------------------------------------
    -- JSON
    ------------------------------------------------

    jsonls = {
        formatting_enabled = false,
        additional_lsp_config = {
            json = {
                schemas = require('schemastore').json.schemas(),
            },
        },
    },

    ------------------------------------------------
    -- Lua
    ------------------------------------------------

    lua_ls = {
        formatting_enabled = false,
        additional_lsp_config = make_lua_lsp_config(),
    },

    ------------------------------------------------
    -- Go
    ------------------------------------------------

    gopls = {
        formatting_enabled = true,
    },

    golangci_lint_ls = {
        formatting_enabled = false,
    },

    ------------------------------------------------
    -- GraphQL
    ------------------------------------------------

    graphql = {
        -- Javascript and typescript are supported, but can
        -- interfere with navic, so disabling for now.
        filetypes = { 'graphql' },
        formatting_enabled = false,
    },

    ------------------------------------------------
    -- PHP
    ------------------------------------------------

    phpactor = {
        formatting_enabled = true,
    },

    ------------------------------------------------
    -- Rust
    ------------------------------------------------

    rust_analyzer = {
        formatting_enabled = true,
        -- simrat39/rust-tools.nvim runs this setup
        skip_setup = true,
    },

    ------------------------------------------------
    -- Typescript, Javascript
    ------------------------------------------------

    tsserver = {
        formatting_enabled = false,
        additional_lsp_config = {
            settings = {
                completions = {
                    completeFunctionCalls = true,
                },
            },
        },
    },

    eslint = {
        formatting_enabled = true,
    },

    ------------------------------------------------
    -- Misc
    ------------------------------------------------

    ['null-ls'] = {
        formatting_enabled = true,
        skip_setup = true, -- null-ls does its own setup.
    },

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

    bufls = {
        formatting_enabled = true,
    },

    yamlls = {
        additional_lsp_config = {
            settings = {
                yaml = {
                    schemas = require('schemastore').yaml.schemas(),
                },
            },
        },
    },
}

return M
