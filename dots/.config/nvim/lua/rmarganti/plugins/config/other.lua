-- Open alternative file
local M = {
    'rgroli/other.nvim',
    cmd = { 'Other', 'OtherClear', 'OtherSplit', 'OtherVSplit' },
}

function M.config()
    require('other-nvim').setup({
        mappings = {
            ------------------------------------------------
            -- PHP
            ------------------------------------------------

            -- class -> unit test
            {
                pattern = '/src/(.*)/(.*).php$',
                target = '/tests/Unit/%1/%2Test.php',
                context = 'unit test',
            },

            -- unit test -> class
            {
                pattern = '/tests/Unit/(.*)/(.*)Test.php$',
                target = '/src/%1/%2.php',
                context = 'unit test',
            },

            ------------------------------------------------
            -- Laravel
            ------------------------------------------------

            -- class -> unit test
            {
                pattern = '/app/(.*)/(.*).php$',
                target = '/tests/unit/%1/%2Test.php',
                context = 'unit test',
            },

            -- unit test -> class
            {
                pattern = '/app/(.*)/(.*).php$',
                target = '/tests/unit/%1/%2Test.php',
                context = 'unit test',
            },

            ------------------------------------------------
            -- Typescript
            ------------------------------------------------

            -- class -> unit test
            {
                pattern = '/(.*)/(.*).ts$',
                target = '/%1/%2.spec.ts',
                context = 'unit test',
            },

            -- unit test -> class
            {
                pattern = '/(.*)/(.*).spec.ts$',
                target = '/%1/%2.ts',
                context = 'tested file',
            },

            ------------------------------------------------
            -- Go
            ------------------------------------------------

            -- class -> unit test
            {
                pattern = '/(.*)/(.*).go$',
                target = '/%1/%2_test.go',
                context = 'unit test',
            },

            -- unit test -> class
            {
                pattern = '/(.*)/(.*)_test.go$',
                target = '/%1/%2.go',
                context = 'tested file',
            },
        },
    })
end

return M
