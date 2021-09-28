local eslint = {
    lintCommand = "eslint_d -f visualstudio --stdin --stdin-filename ${INPUT}",
    lintIgnoreExitCode = true,
    lintStdin = true,
    lintFormats = {
        "%f(%l,%c): %tarning %m",
        "%f(%l,%c): %rror %m",
    },
    lintSource = "eslint",
}

local prettier = {
    formatCommand = 'prettierd "${INPUT}"',
    formatStdin = true,
    env = {
        string.format(
            'PRETTIERD_DEFAULT_CONFIG=%s',
            vim.fn.expand('~/.config/nvim/lua/rmarganti/plugins/config/efm/.prettierrc.json')
        ),
    },
}

local phpstan = {
    lindCommand = './vendor/bin/phpstan analyze --error-format raw --no-progress'
}

return function(lspconfig)
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
                php = { phpstan },
                scss = { prettier },
                typescript = { prettier, eslint },
                typescriptreact = { prettier, eslint },
                yaml = { prettier },
            },
        },
    })
end
